const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// Log file MUST be at workspace root: debug-dd61b8.log
const debugLogPath = path.join(__dirname, '..', '..', 'debug-dd61b8.log');

function agentDebugLog(payload) {
    try {
        const base = {
            sessionId: 'dd61b8',
            timestamp: Date.now(),
            ...payload,
        };
        const line = JSON.stringify(base) + '\n';
        fs.appendFile(debugLogPath, line, () => { });

        if (typeof fetch === 'function') {
            fetch('http://127.0.0.1:7419/ingest/3d183f64-daba-444d-9888-f2fbba078fb1', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Debug-Session-Id': 'dd61b8',
                },
                body: JSON.stringify(base),
            }).catch(() => { });
        }
    } catch {
        // Swallow all logging errors
    }
}

// Create a new tuition batch
exports.createTuitionBatch = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { title, class_id, amount } = req.body;

        if (!title || !class_id || !amount) {
            return res.status(400).json({ message: 'Vui lòng cung cấp đủ thông tin (title, class_id, amount)' });
        }

        await client.query('BEGIN');

        // 1. Create the batch
        const batchRes = await client.query(
            `INSERT INTO tuition_batches (title, class_id, amount) VALUES ($1, $2, $3) RETURNING *`,
            [title, class_id, amount]
        );
        const batchId = batchRes.rows[0].id;

        // 2. Find all students enrolled in this class
        const studentsRes = await client.query(
            `SELECT DISTINCT student_id FROM class_enrollments WHERE class_id = $1`,
            [class_id]
        );

        // 3. Create a tuition record for each student
        if (studentsRes.rows.length > 0) {
            const values = [];
            let queryParams = [];
            let i = 1;

            studentsRes.rows.forEach(student => {
                values.push(`($${i}, $${i + 1})`);
                queryParams.push(batchId, student.student_id);
                i += 2;
            });

            await client.query(
                `INSERT INTO tuitions (batch_id, student_id) VALUES ${values.join(', ')}`,
                queryParams
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Tạo đợt thu học phí thành công', batch: batchRes.rows[0], studentsCount: studentsRes.rows.length });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Create Tuition Batch Error:', err);
        res.status(500).json({ message: 'Lỗi server khi tạo đợt thu' });
    } finally {
        client.release();
    }
};

// Get batches by class
exports.getTuitionBatches = async (req, res) => {
    console.log("=== DEBUG TUITION BATCHES ===");
    console.log("req.params:", req.params);
    console.log("req.user:", req.user);

    try {
        const { classId } = req.params;

        if (!classId) {
            return res.status(400).json({ message: "Missing classId" });
        }

        const result = await db.query(
            `
            SELECT id, title, amount, created_at,
             (SELECT COUNT(*) FROM tuitions t WHERE t.batch_id = tb.id) as student_count
            FROM tuition_batches tb
            WHERE class_id = $1
            ORDER BY created_at DESC
            `,
            [classId]
        );

        return res.json(result.rows || []);
    } catch (error) {
        console.error("FULL ERROR:");
        console.error(error.message);
        console.error(error.detail);
        console.error(error.stack);
        return res.status(500).json({
            message: "Server error",
            error_message: error.message,
            error_detail: error.detail,
            error_stack: error.stack
        });
    }
};

// Get tuitions inside a specific batch (auto-sync new students)
exports.getTuitionsByBatch = async (req, res) => {
    try {
        const { batchId } = req.params;

        // 1. Get the class_id for this batch
        const batchRes = await db.query(`SELECT class_id FROM tuition_batches WHERE id = $1`, [batchId]);
        if (batchRes.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy đợt thu' });
        }
        const classId = batchRes.rows[0].class_id;

        // 2. Auto-insert tuition records for newly enrolled students who don't have one yet
        await db.query(
            `INSERT INTO tuitions (batch_id, student_id, status)
             SELECT $1, ce.student_id, 'unpaid'
             FROM class_enrollments ce
             WHERE ce.class_id = $2
               AND NOT EXISTS (
                   SELECT 1 FROM tuitions t WHERE t.batch_id = $1 AND t.student_id = ce.student_id
               )`,
            [batchId, classId]
        );

        // 3. Also remove tuition records for students no longer enrolled in this class
        await db.query(
            `DELETE FROM tuitions 
             WHERE batch_id = $1 
               AND student_id NOT IN (
                   SELECT student_id FROM class_enrollments WHERE class_id = $2
               )`,
            [batchId, classId]
        );

        // 4. Return the synced list
        const result = await db.query(
            `SELECT t.id, t.status, t.paid_at, u.full_name as student_name 
             FROM tuitions t
             JOIN users u ON t.student_id = u.id
             WHERE t.batch_id = $1
             ORDER BY u.full_name ASC`,
            [batchId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Get Tuitions Error:', err);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách học sinh' });
    }
};

// Mark tuition as paid
exports.markTuitionPaid = async (req, res) => {
    try {
        const { id } = req.params; // Tuition ID
        const result = await db.query(
            `UPDATE tuitions SET status = 'paid', paid_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy bản ghi học phí' });
        }

        res.json({ message: 'Đã đánh dấu nộp tiền', tuition: result.rows[0] });
    } catch (err) {
        console.error('Mark Tuition Paid Error:', err);
        res.status(500).json({ message: 'Lỗi server khi cập nhật trạng thái' });
    }
};

// Revert tuition to unpaid
exports.markTuitionUnpaid = async (req, res) => {
    try {
        const { id } = req.params; // Tuition ID
        const result = await db.query(
            `UPDATE tuitions SET status = 'unpaid', paid_at = NULL WHERE id = $1 RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy bản ghi học phí' });
        }

        res.json({ message: 'Đã hủy đánh dấu nộp tiền', tuition: result.rows[0] });
    } catch (err) {
        console.error('Mark Tuition Unpaid Error:', err);
        res.status(500).json({ message: 'Lỗi server khi cập nhật trạng thái' });
    }
};

// Delete a tuition batch
exports.deleteTuitionBatch = async (req, res) => {
    try {
        const { id } = req.params;
        // Due to lack of ON DELETE CASCADE on tuitions table referencing batch_id (implied from missing FK setup in schema maybe? Let's just manually delete or let postgres handle if foreign keys exist)
        // PostgreSQL will error if there's no cascade. Better to explicitly delete child tuitions first just in case.

        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            // Delete tuitions in this batch
            await client.query(`DELETE FROM tuitions WHERE batch_id = $1`, [id]);

            // Delete the batch
            const deleteResult = await client.query(`DELETE FROM tuition_batches WHERE id = $1 RETURNING id`, [id]);

            if (deleteResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ message: 'Không tìm thấy đợt thu này' });
            }

            await client.query('COMMIT');
            res.json({ message: 'Xóa đợt thu thành công' });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('Delete Tuition Batch Error:', err);
        res.status(500).json({ message: 'Lỗi khi xóa đợt thu' });
    }
};


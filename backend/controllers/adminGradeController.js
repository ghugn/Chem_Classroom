const db = require('../config/db');

// Get all exams for a specific class
exports.getExamsByClass = async (req, res) => {
    try {
        const { classId } = req.params;
        console.log("CLASS ID RECEIVED:", req.params.classId);
        console.log(`[ADMIN-GRADE][GET] Fetching exams for classId: ${classId}`);

        const query = `
            SELECT e.*, 
                COALESCE(
                    (SELECT json_agg(json_build_object('id', c.id, 'name', c.name)) 
                     FROM exam_classes ec2 
                     JOIN classes c ON ec2.class_id = c.id 
                     WHERE ec2.exam_id = e.id), 
                    '[]'::json
                ) as classes
            FROM exams e 
            WHERE EXISTS (
                SELECT 1 FROM exam_classes ec 
                WHERE ec.exam_id = e.id AND ec.class_id = $1
            )
            ORDER BY e.date DESC, e.created_at DESC;
        `;
        const result = await db.query(query, [classId]);
        console.log(`[ADMIN-GRADE][GET] Found ${result.rowCount} exams successfully`);

        res.json(result.rows);
    } catch (err) {
        console.error('[ADMIN-GRADE][GET] Lỗi lấy danh sách buổi thi:', err);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách buổi thi' });
    }
};

// Create a new exam
exports.createExam = async (req, res) => {
    let client;
    try {
        client = await db.pool.connect();
        const { class_ids, title, date, max_score } = req.body;
        if (!class_ids || class_ids.length === 0 || !title || !date) {
            return res.status(400).json({ message: 'Vui lòng điền đủ thông tin bắt buộc và chọn ít nhất 1 lớp' });
        }

        await client.query('BEGIN');
        const query = `
            INSERT INTO exams (title, date, max_score) 
            VALUES ($1, $2, $3) RETURNING *;
        `;
        const result = await client.query(query, [title, date, max_score || 10]);
        const newExam = result.rows[0];

        for (const cid of class_ids) {
            await client.query('INSERT INTO exam_classes (exam_id, class_id) VALUES ($1, $2)', [newExam.id, cid]);
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Tạo buổi thi thành công', exam: newExam });
    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('Lỗi tạo buổi thi:', err);
        const fs = require('fs'); fs.writeFileSync('debug_error.log', err.stack || err.message);
        res.status(500).json({ message: err.message || 'Lỗi server khi tạo buổi thi' });
    } finally {
        if (client) client.release();
    }
};

// Update an exam
exports.updateExam = async (req, res) => {
    let client;
    try {
        client = await db.pool.connect();
        const { id } = req.params;
        const { class_ids, title, date, max_score } = req.body;

        await client.query('BEGIN');
        const query = `
            UPDATE exams 
            SET title = $1, date = $2, max_score = $3, updated_at = CURRENT_TIMESTAMP
            WHERE id = $4 RETURNING *;
        `;
        const result = await client.query(query, [title, date, max_score, id]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Không tìm thấy buổi thi' });
        }

        if (class_ids && Array.isArray(class_ids)) {
            await client.query('DELETE FROM exam_classes WHERE exam_id = $1', [id]);
            for (const cid of class_ids) {
                await client.query('INSERT INTO exam_classes (exam_id, class_id) VALUES ($1, $2)', [id, cid]);
            }
        }

        await client.query('COMMIT');
        res.json({ message: 'Cập nhật buổi thi thành công', exam: result.rows[0] });
    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('Lỗi cập nhật buổi thi:', err);
        const fs = require('fs'); fs.writeFileSync('debug_error.log', err.stack || err.message);
        res.status(500).json({ message: err.message || 'Lỗi server khi cập nhật buổi thi' });
    } finally {
        if (client) client.release();
    }
};

// Delete an exam
exports.deleteExam = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM exams WHERE id = $1 RETURNING id;', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy buổi thi' });
        }

        res.json({ message: 'Đã xóa buổi thi' });
    } catch (err) {
        console.error('Lỗi xóa buổi thi:', err);
        res.status(500).json({ message: 'Lỗi server khi xóa buổi thi' });
    }
};

// Get students and their grades for a specific exam
exports.getExamGrades = async (req, res) => {
    try {
        const { examId } = req.params;

        // Fetch all students in all classes assigned to this exam
        const query = `
            WITH ExamClasses AS (
                SELECT class_id FROM exam_classes WHERE exam_id = $1
            ),
            ClassStudents AS (
                SELECT DISTINCT u.id, u.full_name
                FROM users u
                LEFT JOIN class_enrollments ce ON u.id = ce.student_id
                LEFT JOIN student_groups sg ON u.id = sg.student_id
                LEFT JOIN groups g ON sg.group_id = g.id
                LEFT JOIN tuition_payments tp ON u.id = tp.student_id
                WHERE (ce.class_id IN (SELECT class_id FROM ExamClasses) OR g.class_id IN (SELECT class_id FROM ExamClasses) OR (tp.class_id IN (SELECT class_id FROM ExamClasses) AND tp.status != 'FAILED'))
                  AND u.role = 'STUDENT'
            )
            SELECT cs.id as student_id, cs.full_name, eg.id as grade_id, eg.score, eg.comment
            FROM ClassStudents cs
            LEFT JOIN exam_grades eg ON cs.id = eg.student_id AND eg.exam_id = $1
            ORDER BY cs.full_name ASC;
        `;

        const result = await db.query(query, [examId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Lỗi lấy danh sách điểm:', err);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách điểm' });
    }
};

// Save grades for an exam (bulk update/insert)
exports.saveExamGrades = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { examId } = req.params;
        const { grades } = req.body;

        if (!Array.isArray(grades)) {
            return res.status(400).json({ message: 'Dữ liệu điểm không hợp lệ' });
        }

        await client.query('BEGIN');

        for (const grade of grades) {
            if (grade.score === null || grade.score === undefined || grade.score === '') {
                await client.query(
                    'DELETE FROM exam_grades WHERE exam_id = $1 AND student_id = $2',
                    [examId, grade.student_id]
                );
            } else {
                const query = `
                    INSERT INTO exam_grades (exam_id, student_id, score, comment, updated_at)
                    VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
                    ON CONFLICT (exam_id, student_id) 
                    DO UPDATE SET score = EXCLUDED.score, comment = EXCLUDED.comment, updated_at = CURRENT_TIMESTAMP;
                `;
                await client.query(query, [examId, grade.student_id, grade.score, grade.comment || null]);
            }
        }

        await client.query('COMMIT');
        res.json({ message: 'Đã lưu điểm thành công' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Lỗi cập nhật điểm hàng loạt:', err);
        res.status(500).json({ message: 'Lỗi server khi cập nhật điểm' });
    } finally {
        client.release();
    }
};

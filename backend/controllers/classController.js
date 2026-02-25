const db = require('../config/db');
const Joi = require('joi');

// Joi schemas for validation
const classSchema = Joi.object({
    name: Joi.string().required(),
    fee: Joi.number().min(0).optional().default(0),
    subject_id: Joi.string().uuid().allow(null, ''),
    start_date: Joi.date().allow(null, ''),
    end_date: Joi.date().allow(null, ''),
    schedule: Joi.string().allow('', null),
});

const groupSchema = Joi.object({
    class_id: Joi.string().uuid().required(),
    name: Joi.string().required(),
    description: Joi.string().allow('', null),
});

exports.createClass = async (req, res) => {
    try {
        const { error, value } = classSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const { name, fee, subject_id, start_date, end_date, schedule } = value;

        const newClass = await db.query(
            `INSERT INTO classes (name, fee, subject_id, start_date, end_date, schedule) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [name, fee, subject_id || null, start_date || null, end_date || null, schedule || null]
        );

        res.status(201).json({ message: 'Lớp học được tạo thành công', class: newClass.rows[0] });
    } catch (err) {
        console.error('Create Class Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateClass = async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = classSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const { name, fee, subject_id, start_date, end_date, schedule } = value;

        // Bắt đầu transaction để đảm bảo tính toàn vẹn dữ liệu
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            const updateResult = await client.query(
                `UPDATE classes 
                 SET name = $1, fee = $2, subject_id = $3, start_date = $4, end_date = $5, schedule = $6, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $7 RETURNING *`,
                [name, fee, subject_id || null, start_date || null, end_date || null, schedule || null, id]
            );

            if (updateResult.rows.length === 0) {
                await client.query('ROLLBACK');
                client.release();
                return res.status(404).json({ message: 'Không tìm thấy lớp học' });
            }

            // Cập nhật học phí cho các học sinh chưa nộp (PENDING)
            if (fee !== undefined) {
                await client.query(
                    `UPDATE tuition_payments SET amount = $1 WHERE class_id = $2 AND status = 'PENDING'`,
                    [fee, id]
                );
            }

            await client.query('COMMIT');
            client.release();

            res.json({ message: 'Cập nhật thành công', class: updateResult.rows[0] });
        } catch (err) {
            await client.query('ROLLBACK');
            client.release();
            throw err;
        }
    } catch (err) {
        console.error('Update Class Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteClass = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { id } = req.params;

        await client.query('BEGIN');

        // 1. Preserve materials
        // Updating materials linked to this class or its groups to have NULL references so they aren't CASCADE deleted
        await client.query(`
            UPDATE materials 
            SET class_id = NULL, group_id = NULL 
            WHERE class_id = $1 OR group_id IN (SELECT id FROM groups WHERE class_id = $1)
        `, [id]);

        // 2. Delete tuition records attached to batches of this class
        await client.query(`
            DELETE FROM tuitions 
            WHERE batch_id IN (SELECT id FROM tuition_batches WHERE class_id = $1)
        `, [id]);

        // Delete the batches
        await client.query(`DELETE FROM tuition_batches WHERE class_id = $1`, [id]);

        // 3. Find students ONLY in this class (not enrolled anywhere else)
        const studentsRes = await client.query(`
            SELECT DISTINCT ce.student_id 
            FROM class_enrollments ce
            WHERE ce.class_id = $1
              AND NOT EXISTS (
                SELECT 1 FROM class_enrollments ce2 
                WHERE ce2.student_id = ce.student_id AND ce2.class_id != $1
              )
        `, [id]);

        const studentIds = studentsRes.rows.map(r => r.student_id);

        if (studentIds.length > 0) {
            const placeholders = studentIds.map((_, i) => `$${i + 1}`).join(', ');
            await client.query(`
                DELETE FROM users WHERE id IN (${placeholders}) AND role = 'STUDENT'
            `, studentIds);
        }

        // 4. Delete enrollments for students remaining in other classes
        await client.query(`DELETE FROM class_enrollments WHERE class_id = $1`, [id]);

        // 4. Finally delete the class (which cascades to groups)
        const deleteResult = await client.query('DELETE FROM classes WHERE id = $1 RETURNING id', [id]);

        if (deleteResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Không tìm thấy lớp học' });
        }

        await client.query('COMMIT');
        res.json({ message: 'Xóa lớp và toàn bộ học sinh thành công (giữ lại tài liệu)' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Delete Class Error:', err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

exports.createGroup = async (req, res) => {
    try {
        const { error, value } = groupSchema.validate({ ...req.body, class_id: req.params.classId });
        if (error) return res.status(400).json({ message: error.details[0].message });

        const { class_id, name, description } = value;

        // Verify class exists
        const classCheck = await db.query('SELECT id FROM classes WHERE id = $1', [class_id]);
        if (classCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Class not found' });
        }

        const newGroup = await db.query(
            `INSERT INTO groups (class_id, name, description) 
       VALUES ($1, $2, $3) RETURNING *`,
            [class_id, name, description]
        );

        res.status(201).json({ message: 'Group created successfully', group: newGroup.rows[0] });
    } catch (err) {
        console.error('Create Group Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteGroup = async (req, res) => {
    try {
        const { id } = req.params;

        const deleteResult = await db.query('DELETE FROM groups WHERE id = $1 RETURNING id', [id]);

        if (deleteResult.rows.length === 0) {
            return res.status(404).json({ message: 'Group not found' });
        }

        res.json({ message: 'Group deleted successfully' });
    } catch (err) {
        console.error('Delete Group Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getClassesWithGroups = async (req, res) => {
    try {
        // Query retrieving classes with fee, structured groups array, and student count
        const query = `
          SELECT 
            c.id, c.name, c.fee, c.start_date, c.end_date, c.schedule, c.created_at,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', gr.id,
                  'name', gr.name,
                  'description', gr.description
                )
              ) FILTER (WHERE gr.id IS NOT NULL), '[]'::json
            ) as groups,
            (SELECT COUNT(*) FROM groups gr_count WHERE gr_count.class_id = c.id) as group_count,
            (SELECT COUNT(DISTINCT sg.student_id) FROM student_groups sg JOIN groups gr_check ON sg.group_id = gr_check.id WHERE gr_check.class_id = c.id) as student_count,
            (SELECT COUNT(*) FROM tuition_batches tb WHERE tb.class_id = c.id) as tuition_batch_count
          FROM classes c
          LEFT JOIN groups gr ON c.id = gr.class_id
          GROUP BY c.id
          ORDER BY c.created_at DESC;
        `;

        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Get Classes Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getClassStudents = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT 
                u.id, 
                u.full_name as name, 
                u.email, 
                u.raw_password as password,
                (SELECT COUNT(*) FROM tuitions t WHERE t.student_id = u.id AND t.status = 'unpaid') as unpaid_count
            FROM users u
            JOIN class_enrollments ce ON u.id = ce.student_id
            WHERE u.role = 'STUDENT' AND ce.class_id = $1
            ORDER BY u.created_at DESC;
        `;
        const result = await db.query(query, [id]);
        res.json(result.rows);
    } catch (err) {
        console.error('Get Class Students Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const bcrypt = require('bcrypt');

exports.addStudentToClass = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { id: class_id } = req.params;
        const { student_id } = req.body;

        if (!student_id) {
            return res.status(400).json({ message: 'Thiếu thông tin học sinh.' });
        }

        // Check student exists
        const studentCheck = await client.query('SELECT id FROM users WHERE id = $1 AND role = $2', [student_id, 'STUDENT']);
        if (studentCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy học sinh.' });
        }

        // Check if already enrolled
        const enrollCheck = await client.query(
            'SELECT id FROM class_enrollments WHERE student_id = $1 AND class_id = $2',
            [student_id, class_id]
        );
        if (enrollCheck.rows.length > 0) {
            return res.status(400).json({ message: 'Học sinh đã có trong lớp này.' });
        }

        await client.query('BEGIN');

        // 1. Enroll student in class
        await client.query(
            `INSERT INTO class_enrollments (student_id, class_id) VALUES ($1, $2)`,
            [student_id, class_id]
        );

        // 2. Create tuition payment record
        const classRes = await client.query('SELECT fee FROM classes WHERE id = $1', [class_id]);
        const fee = classRes.rows.length > 0 ? classRes.rows[0].fee : 0;
        await client.query(
            `INSERT INTO tuition_payments (student_id, class_id, amount, status) VALUES ($1, $2, $3, 'PAID')`,
            [student_id, class_id, fee]
        );

        await client.query('COMMIT');
        res.status(201).json({ message: 'Thêm học sinh vào lớp thành công' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Add Student to Class Error:', err);
        res.status(500).json({ message: err.message || 'Lỗi khi thêm học sinh vào lớp' });
    } finally {
        client.release();
    }
};

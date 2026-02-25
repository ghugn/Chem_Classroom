const db = require('../config/db');
const bcrypt = require('bcrypt');
const Joi = require('joi');

const studentSchema = Joi.object({
    full_name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).optional(),
    class_ids: Joi.array().items(Joi.string().uuid()).min(1).required()
});

const studentUpdateSchema = Joi.object({
    full_name: Joi.string().required(),
    class_ids: Joi.array().items(Joi.string().uuid()).min(1).required()
});

exports.getAllStudents = async (req, res) => {
    try {
        const query = `
            SELECT 
                u.id, 
                u.full_name as name, 
                u.email, 
                u.raw_password as password,
                COALESCE(
                    json_agg(
                        json_build_object('id', c.id, 'name', c.name)
                    ) FILTER (WHERE c.id IS NOT NULL), '[]'::json
                ) as classes,
                (SELECT COUNT(*) FROM tuitions t WHERE t.student_id = u.id AND t.status = 'unpaid') as unpaid_count
            FROM users u
            LEFT JOIN class_enrollments ce ON u.id = ce.student_id
            LEFT JOIN classes c ON ce.class_id = c.id
            WHERE u.role = 'STUDENT'
            GROUP BY u.id
            ORDER BY u.created_at DESC;
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Get Students Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createStudent = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { error, value } = studentSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const { full_name, email, password, class_ids } = value;

        // Check if email exists
        const emailCheck = await client.query('SELECT id FROM users WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ message: 'Email này đã được sử dụng.' });
        }

        await client.query('BEGIN');

        // Create random password or use provided
        const studentPassword = password || '123456';
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(studentPassword, salt);

        // 1. Create user
        const userRes = await client.query(
            `INSERT INTO users(email, password_hash, raw_password, full_name, role) VALUES($1, $2, $3, $4, 'STUDENT') RETURNING id`,
            [email, hash, studentPassword, full_name]
        );
        const studentId = userRes.rows[0].id;

        // 2. Enroll in all selected classes
        for (const class_id of class_ids) {
            await client.query(
                `INSERT INTO class_enrollments(student_id, class_id) VALUES($1, $2) ON CONFLICT DO NOTHING`,
                [studentId, class_id]
            );

            // Create tuition payment record for each class
            const classRes = await client.query('SELECT fee FROM classes WHERE id = $1', [class_id]);
            const fee = classRes.rows.length > 0 ? classRes.rows[0].fee : 0;
            await client.query(
                `INSERT INTO tuition_payments(student_id, class_id, amount, status) VALUES($1, $2, $3, $4)`,
                [studentId, class_id, fee, 'PAID']
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Thêm học sinh mới thành công' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Create Student Error:', err);
        res.status(500).json({ message: 'Lỗi khi tạo học sinh' });
    } finally {
        client.release();
    }
};

exports.updateStudent = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { id } = req.params;
        const { error, value } = studentUpdateSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const { full_name, class_ids } = value;

        await client.query('BEGIN');

        // 1. Update user name
        await client.query(`UPDATE users SET full_name = $1 WHERE id = $2`, [full_name, id]);

        // 2. Get current enrollments
        const currentEnrollments = await client.query(
            `SELECT class_id FROM class_enrollments WHERE student_id = $1`, [id]
        );
        const currentClassIds = currentEnrollments.rows.map(r => r.class_id);

        // 3. Find classes to add and remove
        const toAdd = class_ids.filter(cid => !currentClassIds.includes(cid));
        const toRemove = currentClassIds.filter(cid => !class_ids.includes(cid));

        // 4. Remove old enrollments
        for (const class_id of toRemove) {
            await client.query(`DELETE FROM class_enrollments WHERE student_id = $1 AND class_id = $2`, [id, class_id]);
        }

        // 5. Add new enrollments + tuition records
        for (const class_id of toAdd) {
            await client.query(
                `INSERT INTO class_enrollments(student_id, class_id) VALUES($1, $2) ON CONFLICT DO NOTHING`,
                [id, class_id]
            );
            // Create tuition payment for new class
            const classRes = await client.query('SELECT fee FROM classes WHERE id = $1', [class_id]);
            const fee = classRes.rows.length > 0 ? classRes.rows[0].fee : 0;
            await client.query(
                `INSERT INTO tuition_payments(student_id, class_id, amount, status) VALUES($1, $2, $3, 'PAID')`,
                [id, class_id, fee]
            );
        }

        await client.query('COMMIT');
        res.json({ message: 'Cập nhật thành công' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Update Student Error:', err);
        res.status(500).json({ message: 'Lỗi khi cập nhật học sinh' });
    } finally {
        client.release();
    }
};

exports.deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(`DELETE FROM users WHERE id = $1 AND role = 'STUDENT' RETURNING id`, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy học sinh này.' });
        }

        res.json({ message: 'Xóa học sinh thành công' });
    } catch (err) {
        console.error('Delete Student Error:', err);
        res.status(500).json({ message: 'Lỗi khi xóa học sinh' });
    }
};

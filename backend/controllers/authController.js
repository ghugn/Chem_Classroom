const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const db = require('../config/db');

// Validation schema for registration
const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    full_name: Joi.string().min(2).max(255).required(),
    phone: Joi.string().allow('', null).max(20),
    class_id: Joi.string().uuid().required()
});

// Validation schema for login
const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

exports.register = async (req, res) => {
    const client = await db.pool.connect();
    try {
        // 1. Validate input
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const { email, password, full_name, phone, class_id } = value;

        // Verify class exists
        const classCheck = await client.query('SELECT fee FROM classes WHERE id = $1', [class_id]);
        if (classCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Lớp học không tồn tại' });
        }
        const classFee = classCheck.rows[0].fee;

        // 2. Check if user already exists
        const userCheck = await client.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: 'Email này đã được sử dụng' });
        }

        await client.query('BEGIN');

        // 3. Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Insert user into Database (Default role: STUDENT) Note: saving raw_password for Admin
        const newUser = await client.query(
            `INSERT INTO users (email, password_hash, raw_password, full_name, role, phone) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, full_name, role`,
            [email, hashedPassword, password, full_name, 'STUDENT', phone]
        );
        const studentId = newUser.rows[0].id;

        // 5. Enroll student in the class
        await client.query(
            `INSERT INTO class_enrollments (student_id, class_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [studentId, class_id]
        );

        // 6. Create tuition payment record (status PAID as baseline)
        await client.query(
            `INSERT INTO tuition_payments (student_id, class_id, amount, status) VALUES ($1, $2, $3, 'PAID')`,
            [studentId, class_id, classFee]
        );

        // 6. Generate JWT Token
        const payload = {
            id: studentId,
            role: newUser.rows[0].role,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Đăng ký học sinh thành công',
            token,
            user: newUser.rows[0],
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Registration Error:', err);
        res.status(500).json({ message: 'Lỗi server khi đăng ký' });
    } finally {
        client.release();
    }
};

exports.getPublicClasses = async (req, res) => {
    try {
        const result = await db.query('SELECT id, name FROM classes ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Get Public Classes Error:', err);
        res.status(500).json({ message: 'Server error retrieving classes' });
    }
};

exports.login = async (req, res) => {
    try {
        // 1. Validate input
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const { email, password } = value;

        // 2. Find user in Database
        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = userResult.rows[0];

        // 3. Verify password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // 4. Generate JWT Token
        const payload = {
            id: user.id,
            role: user.role,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

        // Exclude password from response
        delete user.password_hash;

        res.json({
            message: 'Logged in successfully',
            token,
            user,
        });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ message: 'Server error during login' });
    }
};

const updateProfileSchema = Joi.object({
    full_name: Joi.string().min(2).max(255).optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().allow('', null).max(20).optional(),
    current_password: Joi.string().required(),
    new_password: Joi.string().min(6).optional().allow('', null),
});

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Validate input
        const { error, value } = updateProfileSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const { full_name, email, phone, current_password, new_password } = value;

        // 2. Fetch current user
        const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = userResult.rows[0];

        // 3. Verify current password
        const isMatch = await bcrypt.compare(current_password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
        }

        // 3.5 Check Email Uniqueness if changing
        if (email !== undefined && email !== user.email) {
            const emailCheck = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
            if (emailCheck.rows.length > 0) {
                return res.status(400).json({ message: 'Email này đã được sử dụng bởi người khác' });
            }
        }

        // 4. Update fields
        let updateQuery = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
        const queryParams = [];
        let paramIndex = 1;

        if (full_name !== undefined) {
            updateQuery += `, full_name = $${paramIndex++}`;
            queryParams.push(full_name);
        }

        if (email !== undefined) {
            updateQuery += `, email = $${paramIndex++}`;
            queryParams.push(email);
        }

        if (phone !== undefined) {
            updateQuery += `, phone = $${paramIndex++}`;
            queryParams.push(phone);
        }

        if (new_password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(new_password, salt);

            updateQuery += `, password_hash = $${paramIndex++}, raw_password = $${paramIndex++}`;
            queryParams.push(hashedPassword, new_password);
        }

        updateQuery += ` WHERE id = $${paramIndex} RETURNING id, email, full_name, phone, role`;
        queryParams.push(userId);

        const updatedUser = await db.query(updateQuery, queryParams);

        res.json({
            message: 'Cập nhật thông tin thành công',
            user: updatedUser.rows[0]
        });

    } catch (err) {
        console.error('Update Profile Error:', err);
        res.status(500).json({ message: 'Lỗi server khi cập nhật profile' });
    }
};

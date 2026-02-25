const db = require('../config/db');

// ==========================================
// ADMIN LEVEL CONTROLLERS
// ==========================================

// 1. Xem danh sách học sinh (Có phân trang tối ưu cho frontend)
exports.getAllStudents = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const [countResult, dataResult] = await Promise.all([
            db.query(`SELECT COUNT(*) FROM users WHERE role = 'STUDENT'`),
            db.query(
                `SELECT id, email, full_name, phone, created_at 
                 FROM users 
                 WHERE role = 'STUDENT' 
                 ORDER BY created_at DESC 
                 LIMIT $1 OFFSET $2`,
                [limit, offset]
            )
        ]);

        const totalStudents = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalStudents / limit);

        res.json({
            data: dataResult.rows,
            meta: {
                totalItems: totalStudents,
                totalPages: totalPages,
                currentPage: page,
                itemsPerPage: limit
            }
        });
    } catch (err) {
        console.error('Get Students Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// 2. Thêm học sinh vào nhóm
exports.assignStudentToGroup = async (req, res) => {
    try {
        const { studentId, groupId } = req.params;

        // Check if student exists and is a STUDENT
        const studentCheck = await db.query('SELECT id, role FROM users WHERE id = $1', [studentId]);
        if (studentCheck.rows.length === 0 || studentCheck.rows[0].role !== 'STUDENT') {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Check if group exists and get its class_id
        const groupCheck = await db.query('SELECT id, class_id FROM groups WHERE id = $1', [groupId]);
        if (groupCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Group not found' });
        }
        const classId = groupCheck.rows[0].class_id;

        // Logic: Avoid placing student in multiple groups of the same class (Optional but recommended)
        const existingInClass = await db.query(
            `SELECT sg.id FROM student_groups sg 
       JOIN groups g ON sg.group_id = g.id 
       WHERE sg.student_id = $1 AND g.class_id = $2`,
            [studentId, classId]
        );

        if (existingInClass.rows.length > 0) {
            return res.status(400).json({ message: 'Student is already assigned to a group in this class' });
        }

        // Insert to student_groups
        // Explicit UNIQUE constraint in DB also protects against exact duplicates
        const assignResult = await db.query(
            `INSERT INTO student_groups (student_id, group_id) 
       VALUES ($1, $2) RETURNING *`,
            [studentId, groupId]
        );

        res.status(201).json({ message: 'Assigned successfully', entry: assignResult.rows[0] });
    } catch (err) {
        if (err.code === '23505') { // unique violation
            return res.status(400).json({ message: 'Student is already in this group' });
        }
        console.error('Assign Student Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// 3. Chuyển nhóm
exports.transferStudentGroup = async (req, res) => {
    try {
        const { studentId, oldGroupId, newGroupId } = req.params;

        // verify old mapping exists
        const checkMapping = await db.query(
            `SELECT id FROM student_groups WHERE student_id = $1 AND group_id = $2`,
            [studentId, oldGroupId]
        );

        if (checkMapping.rows.length === 0) {
            return res.status(404).json({ message: 'Student is not in the specified old group' });
        }

        // check new group exists
        const groupCheck = await db.query('SELECT id FROM groups WHERE id = $1', [newGroupId]);
        if (groupCheck.rows.length === 0) {
            return res.status(404).json({ message: 'New group not found' });
        }

        // Update the mapping to the new group
        const updateResult = await db.query(
            `UPDATE student_groups SET group_id = $1 
       WHERE student_id = $2 AND group_id = $3 RETURNING *`,
            [newGroupId, studentId, oldGroupId]
        );

        res.json({ message: 'Transferred successfully', entry: updateResult.rows[0] });

    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ message: 'Student is already in the new group' });
        }
        console.error('Transfer Student Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// 4. Xóa học sinh khỏi nhóm
exports.removeStudentFromGroup = async (req, res) => {
    try {
        const { studentId, groupId } = req.params;
        const deleteResult = await db.query(
            'DELETE FROM student_groups WHERE student_id = $1 AND group_id = $2 RETURNING id',
            [studentId, groupId]
        );

        if (deleteResult.rows.length === 0) {
            return res.status(404).json({ message: 'Student is not in this group' });
        }

        res.json({ message: 'Removed student from group successfully' });
    } catch (err) {
        console.error('Remove Student Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};


// ==========================================
// STUDENT LEVEL CONTROLLERS
// ==========================================

// 1. Xem thông tin của mình (Profile)
exports.getMyProfile = async (req, res) => {
    try {
        const studentId = req.user.id;
        const userQuery = await db.query(
            `SELECT id, email, full_name, phone, role, created_at 
             FROM users WHERE id = $1`,
            [studentId]
        );

        res.json(userQuery.rows[0]);
    } catch (err) {
        console.error('Get Profile Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// 2. Xem lớp và nhóm mình đang học (Kèm Lịch học và Danh sách học sinh cùng lớp)
exports.getMyClassesAndGroups = async (req, res) => {
    try {
        const studentId = req.user.id;
        const query = `
            WITH my_classes AS (
                SELECT DISTINCT c.id, c.name, c.fee, c.start_date, c.end_date, c.schedule, c.created_at
                FROM classes c
                WHERE 
                    EXISTS (SELECT 1 FROM class_enrollments ce WHERE ce.class_id = c.id AND ce.student_id = $1)
                    OR
                    EXISTS (SELECT 1 FROM tuitions t JOIN tuition_batches tb ON t.batch_id = tb.id WHERE tb.class_id = c.id AND t.student_id = $1)
                    OR 
                    EXISTS (SELECT 1 FROM student_groups sg JOIN groups g ON sg.group_id = g.id WHERE g.class_id = c.id AND sg.student_id = $1)
            ),
            class_students AS (
                SELECT DISTINCT mc.id AS class_id, u.id as student_id, u.full_name
                FROM my_classes mc
                JOIN (
                    SELECT class_id, student_id FROM class_enrollments
                    UNION
                    SELECT tb.class_id, t.student_id FROM tuitions t JOIN tuition_batches tb ON t.batch_id = tb.id
                    UNION
                    SELECT g.class_id, sg.student_id FROM student_groups sg JOIN groups g ON sg.group_id = g.id
                ) all_enrollments ON mc.id = all_enrollments.class_id
                JOIN users u ON all_enrollments.student_id = u.id
                WHERE u.id != $1
            )
            SELECT 
                mc.id as class_id, mc.name as class_name, mc.fee, mc.start_date, mc.end_date, mc.schedule, mc.created_at as joined_at,
                (SELECT COUNT(cs.student_id) FROM class_students cs WHERE cs.class_id = mc.id) as classmate_count,
                COALESCE(
                    (SELECT json_agg(json_build_object('id', cs2.student_id, 'full_name', cs2.full_name))
                     FROM (SELECT student_id, full_name FROM class_students WHERE class_id = mc.id) cs2),
                    '[]'::json
                ) as classmates
            FROM my_classes mc
            ORDER BY mc.start_date DESC NULLS LAST;
        `;
        const result = await db.query(query, [studentId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Get My Classes Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// 3. API Dashboard Student Hoàn Chỉnh
exports.getStudentDashboard = async (req, res) => {
    try {
        const studentId = req.user.id;

        // Lấy tất cả các class_id student đang tham gia (qua group hoặc tuition_batches)
        const classesRes = await db.query(
            `
            SELECT DISTINCT class_id FROM (
                SELECT class_id
                FROM class_enrollments
                WHERE student_id = $1

                UNION

                SELECT g.class_id
                FROM student_groups sg
                JOIN groups g ON sg.group_id = g.id
                WHERE sg.student_id = $1

                UNION

                SELECT tb.class_id
                FROM tuitions t
                JOIN tuition_batches tb ON t.batch_id = tb.id
                WHERE t.student_id = $1
            ) as combined
            `,
            [studentId]
        );

        const classIds = classesRes.rows.map(r => r.class_id);

        if (classIds.length === 0) {
            return res.json({
                profile: req.user,
                summary: {
                    totalClasses: 0,
                    totalFee: 0,
                    unpaidTuition: 0
                },
                classes: []
            });
        }

        const totalClasses = classIds.length;

        // Tính các chỉ số học phí cho học sinh
        const tuitionRes = await db.query(
            `SELECT 
                SUM(CASE WHEN t.status IN ('unpaid', 'partial') THEN tb.amount ELSE 0 END) as unpaid_tuition,
                SUM(tb.amount) as total_fee
             FROM tuitions t
             JOIN tuition_batches tb ON t.batch_id = tb.id
             WHERE t.student_id = $1 AND tb.class_id = ANY($2::uuid[])`,
            [studentId, classIds]
        );
        const unpaidTuition = parseInt(tuitionRes.rows[0].unpaid_tuition) || 0;
        const totalFee = parseInt(tuitionRes.rows[0].total_fee) || 0;

        // Lấy chi tiết các lớp (để render giao diện Frontend student dashboard)
        const classesDetailRes = await db.query(
            `SELECT c.id as class_id, c.name as class_name, c.fee, c.start_date, c.end_date, c.schedule, c.created_at as joined_at,
                (SELECT COUNT(sg.student_id) FROM student_groups sg JOIN groups g ON sg.group_id = g.id WHERE g.class_id = c.id AND sg.student_id != $1) as classmate_count,
                 COALESCE(
                    (SELECT json_agg(json_build_object('id', u.id, 'full_name', u.full_name))
                     FROM (SELECT sg2.student_id FROM student_groups sg2 JOIN groups g2 ON sg2.group_id = g2.id WHERE g2.class_id = c.id AND sg2.student_id != $1) as sub
                     JOIN users u ON u.id = sub.student_id
                    ), '[]'::json
                ) as classmates
             FROM classes c
             WHERE c.id = ANY($2::uuid[])
             ORDER BY c.start_date DESC NULLS LAST`,
            [studentId, classIds]
        );

        res.json({
            profile: req.user,
            summary: {
                totalClasses,
                totalFee,
                unpaidTuition
            },
            classes: classesDetailRes.rows
        });

    } catch (err) {
        console.error('Get Student Dashboard Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
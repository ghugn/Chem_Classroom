const db = require('../config/db');

exports.getStudentDocuments = async (req, res) => {
    try {
        const studentId = req.user.id;

        const query = `
            SELECT DISTINCT m.id, m.title, m.description, m.file_url, m.created_at, m.subject_id, s.name as subject_name, c.id as class_id, c.name as class_name
            FROM materials m
            JOIN classes c ON m.class_id = c.id
            JOIN class_enrollments ce ON c.id = ce.class_id
            LEFT JOIN subjects s ON m.subject_id = s.id
            WHERE ce.student_id = $1
            ORDER BY m.created_at DESC;
        `;

        const result = await db.query(query, [studentId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Get Student Documents Error:', err);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách tài liệu' });
    }
};

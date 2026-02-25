const db = require('../config/db');

exports.getStudentTuitions = async (req, res) => {
    try {
        const studentId = req.user.id;

        const result = await db.query(
            `SELECT t.id, t.status, t.paid_at, tb.title, tb.amount, tb.created_at
             FROM tuitions t
             JOIN tuition_batches tb ON t.batch_id = tb.id
             WHERE t.student_id = $1
             ORDER BY tb.created_at DESC`,
            [studentId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Get Student Tuitions Error:', err);
        res.status(500).json({ message: 'Lỗi server khi lấy lịch sử học phí' });
    }
};

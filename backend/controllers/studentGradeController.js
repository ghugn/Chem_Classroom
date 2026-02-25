const db = require('../config/db');

exports.getMyGrades = async (req, res) => {
    try {
        const studentId = req.user.id;
        const query = `
            WITH StudentClasses AS (
                SELECT DISTINCT ce.class_id 
                FROM class_enrollments ce
                WHERE ce.student_id = $1
            ),
            StudentExams AS (
                SELECT DISTINCT e.id, e.title, e.date, e.max_score
                FROM exams e
                JOIN exam_classes ec ON e.id = ec.exam_id
                WHERE ec.class_id IN (SELECT class_id FROM StudentClasses)
            )
            SELECT se.id as exam_id, se.title, se.date as exam_date, se.max_score,
                   eg.id as grade_id, eg.score, eg.comment, eg.updated_at as graded_at,
                   (
                       SELECT string_agg(c.name, ', ')
                       FROM exam_classes ec2
                       JOIN classes c ON ec2.class_id = c.id
                       WHERE ec2.exam_id = se.id
                   ) as class_name
            FROM StudentExams se
            LEFT JOIN exam_grades eg ON se.id = eg.exam_id AND eg.student_id = $1
            ORDER BY se.date DESC;
        `;
        const result = await db.query(query, [studentId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Lỗi lấy điểm sinh viên:', err);
        res.status(500).json({ message: 'Lỗi server khi xem điểm' });
    }
};

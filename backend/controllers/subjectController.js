const db = require('../config/db');

exports.getAllSubjects = async (req, res) => {
    try {
        const query = `SELECT id, name, description FROM subjects ORDER BY created_at ASC;`;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Get All Subjects Error:', err);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách phân môn' });
    }
};

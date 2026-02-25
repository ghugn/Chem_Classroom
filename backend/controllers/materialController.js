const db = require('../config/db');
const Joi = require('joi');

const uploadMaterialSchema = Joi.object({
    title: Joi.string().required(),
    class_id: Joi.string().uuid().allow(null, ''),
    group_id: Joi.string().uuid().allow(null, ''),
    subject_id: Joi.string().uuid().allow(null, '')
});

// ==========================================
// ADMIN LEVEL CONTROLLERS
// ==========================================

// Upload Material
exports.uploadMaterial = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Vui lòng chọn file để tải lên' });
        }

        const { error, value } = uploadMaterialSchema.validate(req.body);
        if (error) {
            // Optional: Clean up uploaded file if validation fails here using fs.unlink
            return res.status(400).json({ message: error.details[0].message });
        }

        const { title, class_id, group_id, subject_id } = value;
        const file_url = `/uploads/${req.file.filename}`; // relative URL for serving static file
        const file_type = req.file.mimetype;
        const uploaded_by = req.user.id;

        // Insert material record to database
        const newMaterial = await db.query(
            `INSERT INTO materials 
       (title, file_url, file_type, class_id, group_id, subject_id, uploaded_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [
                title,
                file_url,
                file_type,
                class_id || null,
                group_id || null,
                subject_id || null,
                uploaded_by
            ]
        );

        res.status(201).json({
            message: 'Tải tài liệu lên thành công',
            material: newMaterial.rows[0],
        });
    } catch (err) {
        console.error('Upload Material Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// View All Materials (Admin only)
exports.getAllMaterialsAdmin = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM materials ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Get All Materials Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete Material (Admin only)
exports.deleteMaterial = async (req, res) => {
    try {
        const { id } = req.params;

        // We should ideally fetch the record and delete the physical file too using fs.unlink

        const deleteResult = await db.query('DELETE FROM materials WHERE id = $1 RETURNING id', [id]);
        if (deleteResult.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
        }

        res.json({ message: 'Xoá tài liệu thành công' });
    } catch (err) {
        console.error('Delete Material Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};


// ==========================================
// STUDENT LEVEL CONTROLLERS
// ==========================================

// Get Materials visible to Student
exports.getStudentMaterials = async (req, res) => {
    try {
        const studentId = req.user.id;

        // Logic: 
        // Môn Hóa: Sinh viên có thể xem tài liệu thuộc class_id mà họ đang được enroll thông qua student_groups.
        // Lấy query trả về tất cả material nếu nó thuộc `class_id` của group học sinh tham gia, hoặc thuộc đích danh `group_id` học sinh tham gia.

        const query = `
      SELECT DISTINCT m.*
      FROM materials m
      LEFT JOIN student_groups sg ON 
         (m.class_id = (SELECT class_id FROM groups WHERE id = sg.group_id) 
          OR m.group_id = sg.group_id)
      WHERE sg.student_id = $1
      ORDER BY m.created_at DESC;
    `;

        const result = await db.query(query, [studentId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Get Student Materials Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const db = require('../config/db');
const fs = require('fs');
const path = require('path');

exports.getAllDocuments = async (req, res) => {
    try {
        const query = `
            SELECT m.*, c.name as class_name, s.name as subject_name 
            FROM materials m
            LEFT JOIN classes c ON m.class_id = c.id
            LEFT JOIN subjects s ON m.subject_id = s.id
            ORDER BY m.created_at DESC;
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Get All Admin Documents Error:', err);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách tài liệu' });
    }
};

exports.uploadDocument = async (req, res) => {
    try {
        const { title, description, class_id, subject_id } = req.body;
        if (!title) {
            return res.status(400).json({ message: 'Tiêu đề là bắt buộc' });
        }

        const file_url = req.file ? `/uploads/${req.file.filename}` : null;
        const file_type = req.file ? req.file.mimetype : 'link/text';
        const uploaded_by = req.user.id;

        const newDocument = await db.query(
            `INSERT INTO materials (title, description, file_url, file_type, class_id, subject_id, uploaded_by) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [title, description || null, file_url, file_type, class_id || null, subject_id || null, uploaded_by]
        );

        res.status(201).json({
            message: 'Tải tài liệu thành công',
            document: newDocument.rows[0],
        });
    } catch (err) {
        console.error('Upload Document Error:', err);
        res.status(500).json({ message: 'Lỗi khi tải tài liệu' });
    }
};

exports.updateDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, class_id, subject_id } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Tiêu đề là bắt buộc' });
        }

        let updateQuery = `
            UPDATE materials 
            SET title = $1, description = $2, class_id = $3, subject_id = $4, updated_at = CURRENT_TIMESTAMP
            WHERE id = $5 RETURNING *
        `;
        let queryParams = [title, description || null, class_id || null, subject_id || null, id];

        if (req.file) {
            // New file is being uploaded
            const file_url = `/uploads/${req.file.filename}`;
            const file_type = req.file.mimetype;

            // Delete old file from filesystem
            const docRes = await db.query('SELECT file_url FROM materials WHERE id = $1', [id]);
            if (docRes.rows.length > 0 && docRes.rows[0].file_url) {
                const oldFileUrl = docRes.rows[0].file_url;
                if (oldFileUrl.startsWith('/uploads/')) {
                    const filename = oldFileUrl.replace('/uploads/', '');
                    const filePath = path.join(__dirname, '..', 'uploads', filename);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                }
            }

            // Expand update query to include the replaced file specs
            updateQuery = `
                UPDATE materials 
                SET title = $1, description = $2, class_id = $3, subject_id = $4, file_url = $6, file_type = $7, updated_at = CURRENT_TIMESTAMP
                WHERE id = $5 RETURNING *
            `;
            queryParams = [title, description || null, class_id || null, subject_id || null, id, file_url, file_type];
        }

        const result = await db.query(updateQuery, queryParams);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
        }

        res.json({ message: 'Cập nhật tài liệu thành công', document: result.rows[0] });
    } catch (err) {
        console.error('Update Document Error:', err);
        res.status(500).json({ message: 'Lỗi khi cập nhật tài liệu' });
    }
};

exports.deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch to get the file path first
        const docRes = await db.query('SELECT file_url FROM materials WHERE id = $1', [id]);
        if (docRes.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
        }

        const fileUrl = docRes.rows[0].file_url;

        // Delete from database
        await db.query('DELETE FROM materials WHERE id = $1', [id]);

        // Delete file from disk
        if (fileUrl && fileUrl.startsWith('/uploads/')) {
            const filename = fileUrl.replace('/uploads/', '');
            const filePath = path.join(__dirname, '..', 'uploads', filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        res.json({ message: 'Xoá tài liệu thành công' });
    } catch (err) {
        console.error('Delete Document Error:', err);
        res.status(500).json({ message: 'Lỗi khi xoá tài liệu' });
    }
};

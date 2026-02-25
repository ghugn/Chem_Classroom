const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// ==========================================
// ADMIN ROUTES (Requires 'ADMIN' role)
// ==========================================

// Lấy danh sách toàn bộ tài liệu
router.get('/admin', verifyToken, checkRole(['ADMIN']), materialController.getAllMaterialsAdmin);

// Form-data request: field 'file' for the document upload
router.post(
    '/',
    verifyToken,
    checkRole(['ADMIN']),
    upload.single('file'),
    materialController.uploadMaterial
);

// Xoá file tài liệu
router.delete('/:id', verifyToken, checkRole(['ADMIN']), materialController.deleteMaterial);

// ==========================================
// STUDENT ROUTES (Requires 'STUDENT' role)
// ==========================================

// Học sinh tự lấy danh sách tài liệu thuộc phần mình được học
router.get('/', verifyToken, checkRole(['STUDENT', 'ADMIN']), materialController.getStudentMaterials);

module.exports = router;

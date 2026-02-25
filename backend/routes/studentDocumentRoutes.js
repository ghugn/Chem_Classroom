const express = require('express');
const router = express.Router();
const studentDocumentController = require('../controllers/studentDocumentController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Get documents (available to students across their enrolled classes)
router.get('/', verifyToken, checkRole(['STUDENT']), studentDocumentController.getStudentDocuments);

module.exports = router;

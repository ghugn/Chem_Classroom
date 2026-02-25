const express = require('express');
const router = express.Router();
const adminDocumentController = require('../controllers/adminDocumentController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Get all documents
router.get('/', verifyToken, checkRole(['ADMIN']), adminDocumentController.getAllDocuments);

// Upload document (with multer)
router.post('/', verifyToken, checkRole(['ADMIN']), upload.single('file'), adminDocumentController.uploadDocument);

// Update document details
router.put('/:id', verifyToken, checkRole(['ADMIN']), upload.single('file'), adminDocumentController.updateDocument);

// Delete document
router.delete('/:id', verifyToken, checkRole(['ADMIN']), adminDocumentController.deleteDocument);

module.exports = router;

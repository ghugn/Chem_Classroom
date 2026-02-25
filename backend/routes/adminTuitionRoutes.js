const express = require('express');
const router = express.Router();
const adminTuitionController = require('../controllers/adminTuitionController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Batches
router.post('/tuition-batches', verifyToken, checkRole(['ADMIN']), adminTuitionController.createTuitionBatch);
router.get('/tuition-batches/:classId', verifyToken, checkRole(['ADMIN']), adminTuitionController.getTuitionBatches);
router.delete('/tuition-batches/:id', verifyToken, checkRole(['ADMIN']), adminTuitionController.deleteTuitionBatch);

// Tuitions inside batches
router.get('/tuitions/:batchId', verifyToken, checkRole(['ADMIN']), adminTuitionController.getTuitionsByBatch);
router.put('/tuitions/:id/pay', verifyToken, checkRole(['ADMIN']), adminTuitionController.markTuitionPaid);
router.put('/tuitions/:id/unpay', verifyToken, checkRole(['ADMIN']), adminTuitionController.markTuitionUnpaid);

module.exports = router;

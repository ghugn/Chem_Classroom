const express = require('express');
const router = express.Router();
const studentTuitionController = require('../controllers/studentTuitionController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.get('/tuitions', verifyToken, checkRole(['STUDENT']), studentTuitionController.getStudentTuitions);

module.exports = router;

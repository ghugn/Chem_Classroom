const express = require('express');
const router = express.Router();
const studentGradeController = require('../controllers/studentGradeController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Get all grades for logged in student
router.get('/', verifyToken, checkRole(['STUDENT']), studentGradeController.getMyGrades);

module.exports = router;

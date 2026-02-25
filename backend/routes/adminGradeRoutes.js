const express = require('express');
const router = express.Router();
const adminGradeController = require('../controllers/adminGradeController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Get all exams for a specific class
router.get('/classes/:classId/exams', verifyToken, checkRole(['ADMIN']), adminGradeController.getExamsByClass);

// Create a new exam
router.post('/exams', verifyToken, checkRole(['ADMIN']), adminGradeController.createExam);

// Update an exam
router.put('/exams/:id', verifyToken, checkRole(['ADMIN']), adminGradeController.updateExam);

// Delete an exam
router.delete('/exams/:id', verifyToken, checkRole(['ADMIN']), adminGradeController.deleteExam);

// Get students and their grades for a specific exam
router.get('/exams/:examId/grades', verifyToken, checkRole(['ADMIN']), adminGradeController.getExamGrades);

// Save grades for an exam (bulk update/insert)
router.post('/exams/:examId/grades', verifyToken, checkRole(['ADMIN']), adminGradeController.saveExamGrades);

module.exports = router;

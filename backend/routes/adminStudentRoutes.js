const express = require('express');
const router = express.Router();
const adminStudentController = require('../controllers/adminStudentController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Apply admin only middlewares to all routes in this router
router.use(verifyToken, checkRole(['ADMIN']));

// @route   GET /api/admin/students
// @desc    Get all students with mapped classes, groups and tuition
router.get('/', adminStudentController.getAllStudents);

// @route   POST /api/admin/students
// @desc    Create a new student along with class mapping
router.post('/', adminStudentController.createStudent);

// @route   PUT /api/admin/students/:id
// @desc    Update an existing student
router.put('/:id', adminStudentController.updateStudent);

// @route   DELETE /api/admin/students/:id
// @desc    Delete a student (cascades)
router.delete('/:id', adminStudentController.deleteStudent);

module.exports = router;

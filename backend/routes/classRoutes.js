const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Apply admin only middlewares to all routes in this router
router.use(verifyToken, checkRole(['ADMIN']));

// @route   GET api/classes
// @desc    Get all classes with their groups
// @access  Private (ADMIN)
router.get('/', classController.getClassesWithGroups);

// @route   POST api/classes
// @desc    Create a new class
// @access  Private (ADMIN)
router.post('/', classController.createClass);

// @route   PUT api/classes/:id
// @desc    Update an existing class
// @access  Private (ADMIN)
router.put('/:id', classController.updateClass);

// @route   DELETE api/classes/:id
// @desc    Delete a class and cascade delete its groups
// @access  Private (ADMIN)
router.delete('/:id', classController.deleteClass);

// @route   POST api/classes/:classId/groups
// @desc    Add a new group to a class
// @access  Private (ADMIN)
router.post('/:classId/groups', classController.createGroup);

// @route   DELETE api/classes/groups/:id
// @desc    Delete a group
// @access  Private (ADMIN)
router.delete('/groups/:id', classController.deleteGroup);

// @route   GET api/classes/:id/students
// @desc    Get all students in a specific class
// @access  Private (ADMIN)
router.get('/:id/students', classController.getClassStudents);

// @route   POST api/classes/:id/students
// @desc    Add a student to a class directly
// @access  Private (ADMIN)
router.post('/:id/students', classController.addStudentToClass);

module.exports = router;

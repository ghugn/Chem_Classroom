const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// ==========================================
// STUDENT ROUTES (Requires 'STUDENT' role)
// ==========================================
// Note: We'll allow ADMIN to also view profile endpoints if they wanted, 
// but strictly this is for 'STUDENT' checking their own data.
router.get('/me', verifyToken, checkRole(['STUDENT', 'ADMIN']), studentController.getMyProfile);
router.get('/me/classes', verifyToken, checkRole(['STUDENT', 'ADMIN']), studentController.getMyClassesAndGroups);
router.get('/dashboard', verifyToken, checkRole(['STUDENT', 'ADMIN']), studentController.getStudentDashboard);

// ==========================================
// ADMIN ROUTES (Requires 'ADMIN' role)
// ==========================================
router.get('/', verifyToken, checkRole(['ADMIN']), studentController.getAllStudents);

// Assign student to a group
router.post('/:studentId/groups/:groupId', verifyToken, checkRole(['ADMIN']), studentController.assignStudentToGroup);

// Transfer student from one group to another
router.put('/:studentId/groups/:oldGroupId/transfer/:newGroupId', verifyToken, checkRole(['ADMIN']), studentController.transferStudentGroup);

// Remove student from a group
router.delete('/:studentId/groups/:groupId', verifyToken, checkRole(['ADMIN']), studentController.removeStudentFromGroup);

module.exports = router;

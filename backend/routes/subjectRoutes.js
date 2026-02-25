const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { verifyToken } = require('../middleware/authMiddleware');

// Get all subjects
router.get('/', verifyToken, subjectController.getAllSubjects);

module.exports = router;

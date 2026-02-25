const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Route gets Admin dashboard statistics
router.get('/', verifyToken, checkRole(['ADMIN']), dashboardController.getAdminDashboardStats);

module.exports = router;

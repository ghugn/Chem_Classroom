const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// @route   POST api/auth/register
// @desc    Register a student
// @access  Public
router.post('/register', authController.register);

// @route   GET api/auth/classes
// @desc    Get classes for registration dropdown
// @access  Public
router.get('/classes', authController.getPublicClasses);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', authController.login);

// @route   GET api/auth/me
// @desc    Get current logged in user details
// @access  Private (Any authenticated user)
router.get('/me', verifyToken, (req, res) => {
    res.json({ user: req.user, message: 'Token is valid' });
});

// @route   GET api/auth/admin-only
// @desc    Test admin route
// @access  Private (Admin only)
router.get('/admin-only', verifyToken, checkRole(['ADMIN']), (req, res) => {
    res.json({ message: 'Welcome Admin!' });
});

// @route   PUT api/auth/profile
// @desc    Update user profile & password
// @access  Private (Any authenticated user)
router.put('/profile', verifyToken, authController.updateProfile);

module.exports = router;

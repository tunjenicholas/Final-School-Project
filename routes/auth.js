const express = require('express');
const { registerUser, login, forgotPassword, resetPassword, updateProfile, getAllUsers } = require('../controllers/authController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/register', authenticateToken, authorizeAdmin, registerUser);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/update-profile', authenticateToken, updateProfile);
router.get('/users', authenticateToken, authorizeAdmin, getAllUsers);

module.exports = router;
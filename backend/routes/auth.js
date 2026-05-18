const express = require('express');
const router = express.Router();
const { googleLogin, adminLogin, customerLogin, registerCustomer, getMe, logout, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/google', googleLogin);
router.post('/login', adminLogin);
router.post('/login/customer', customerLogin);
router.post('/register', registerCustomer);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put('/profile', protect, updateProfile);

module.exports = router;

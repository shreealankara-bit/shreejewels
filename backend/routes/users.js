const express = require('express');
const router = express.Router();
const { getAllUsers, toggleUserStatus } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, adminOnly, getAllUsers);
router.put('/:id/toggle', protect, adminOnly, toggleUserStatus);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  createAdminUser,
  updateAdminUser,
  toggleUserStatus,
  deleteAdminUser,
} = require('../controllers/userController');
const { protect, adminOnly, superAdminOnly } = require('../middleware/auth');

// All routes require auth + admin
router.get('/', protect, adminOnly, getAllUsers);

// Create admin user — superadmin only
router.post('/', protect, superAdminOnly, createAdminUser);

// Update user details — superadmin only
router.put('/:id', protect, superAdminOnly, updateAdminUser);

// Toggle active/inactive — admin can do this
router.put('/:id/toggle', protect, adminOnly, toggleUserStatus);

// Soft-delete (deactivate) — superadmin only
router.delete('/:id', protect, superAdminOnly, deleteAdminUser);

module.exports = router;

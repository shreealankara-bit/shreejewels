const express = require('express');
const router = express.Router();
const { getCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory, reorderCategories } = require('../controllers/categoryController');
const { protect, adminOnly } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// Public
router.get('/', getCategories);
router.get('/:slug', getCategoryBySlug);

// Admin
router.post('/admin', protect, adminOnly, upload.single('image'), createCategory);
router.put('/admin/reorder', protect, adminOnly, reorderCategories);
router.put('/admin/:id', protect, adminOnly, upload.single('image'), updateCategory);
router.delete('/admin/:id', protect, adminOnly, deleteCategory);

module.exports = router;

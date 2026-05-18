const express = require('express');
const router = express.Router();
const { getProducts, getProductBySlug, createProduct, updateProduct, deleteProduct, deleteProductImage, addReview, toggleWishlist, getProductStats } = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// Public
router.get('/', getProducts);

// Admin
router.get('/admin/stats', protect, adminOnly, getProductStats);
router.post('/admin/create', protect, adminOnly, upload.array('images', 10), createProduct);
router.put('/admin/:id', protect, adminOnly, upload.array('images', 10), updateProduct);
router.delete('/admin/:id/images/:publicId', protect, adminOnly, deleteProductImage);
router.delete('/admin/:id', protect, adminOnly, deleteProduct);

// Protected (customer)
router.post('/:id/reviews', protect, addReview);
router.post('/:id/wishlist', protect, toggleWishlist);

// Public detail
router.get('/:slug', getProductBySlug);

module.exports = router;

const express = require('express');
const router = express.Router();
const { createPayment, verifyPayment, getMyOrders, getOrder, getAllOrders, updateOrderStatus, getOrderStats } = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/auth');

// Customer
router.post('/create-payment', protect, createPayment);
router.post('/verify-payment', protect, verifyPayment);
router.get('/my', protect, getMyOrders);
router.get('/:id', protect, getOrder);

// Admin
router.get('/admin/all', protect, adminOnly, getAllOrders);
router.get('/admin/stats', protect, adminOnly, getOrderStats);
router.put('/admin/:id', protect, adminOnly, updateOrderStatus);

module.exports = router;

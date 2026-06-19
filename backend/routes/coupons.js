const express = require('express');
const router = express.Router();
const { validateCoupon, getCoupons, createCoupon, updateCoupon, deleteCoupon } = require('../controllers/couponController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/validate', validateCoupon);
router.get('/admin', protect, adminOnly, getCoupons);
router.post('/admin', protect, adminOnly, createCoupon);
router.put('/admin/:id', protect, adminOnly, updateCoupon);
router.delete('/admin/:id', protect, adminOnly, deleteCoupon);

module.exports = router;

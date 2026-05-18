const express = require('express');
const router = express.Router();
const { getBanners, getAllBanners, createBanner, updateBanner, deleteBanner } = require('../controllers/bannerController');
const { protect, adminOnly } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

router.get('/', getBanners);
router.get('/admin', protect, adminOnly, getAllBanners);
router.post('/admin', protect, adminOnly, upload.single('image'), createBanner);
router.put('/admin/:id', protect, adminOnly, upload.single('image'), updateBanner);
router.delete('/admin/:id', protect, adminOnly, deleteBanner);

module.exports = router;

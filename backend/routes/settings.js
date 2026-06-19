const express = require('express');
const router = express.Router();
const {
  getPublicSettings,
  getAdminSettings,
  updateSettings,
  uploadFavicon,
  uploadLogo,
  uploadAboutImage,
} = require('../controllers/settingsController');
const { protect, adminOnly } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// Public
router.get('/', getPublicSettings);

// Admin
router.get('/admin', protect, adminOnly, getAdminSettings);
router.put('/admin', protect, adminOnly, updateSettings);
router.post('/admin/upload-favicon', protect, adminOnly, upload.single('file'), uploadFavicon);
router.post('/admin/upload-logo', protect, adminOnly, upload.single('file'), uploadLogo);
router.post('/admin/upload-about-image', protect, adminOnly, upload.single('file'), uploadAboutImage);

module.exports = router;

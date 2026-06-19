const express = require('express');
const router = express.Router();
const { getActive, getAll, create, update, remove } = require('../controllers/testimonialController');
const { protect, adminOnly } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// Public
router.get('/', getActive);

// Admin
router.get('/admin', protect, adminOnly, getAll);
router.post('/admin', protect, adminOnly, upload.single('avatar'), create);
router.put('/admin/:id', protect, adminOnly, upload.single('avatar'), update);
router.delete('/admin/:id', protect, adminOnly, remove);

module.exports = router;

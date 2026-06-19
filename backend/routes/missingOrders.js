const express = require('express');
const router = express.Router();
const { saveMissingOrder, getAll, remove } = require('../controllers/missingOrderController');
const { protect, adminOnly } = require('../middleware/auth');

// Public (no auth required — called from frontend on failure)
router.post('/', saveMissingOrder);

// Admin
router.get('/admin', protect, adminOnly, getAll);
router.delete('/admin/:id', protect, adminOnly, remove);

module.exports = router;

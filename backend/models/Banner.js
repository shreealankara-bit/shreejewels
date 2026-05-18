const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: '' },
    image: { type: String, required: true },
    imagePublicId: { type: String, default: '' },
    mobileImage: { type: String, default: '' }, // separate mobile-optimized version
    link: { type: String, default: '' },
    buttonText: { type: String, default: 'Shop Now' },
    position: {
      type: String,
      enum: ['hero', 'homepage_mid', 'category', 'popup', 'sidebar'],
      default: 'hero',
    },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    textColor: { type: String, default: '#ffffff' },
    bgColor: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Banner', bannerSchema);

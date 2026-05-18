const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        isDefault: { type: Boolean, default: false },
      },
    ],
    stock: { type: Number, default: 0, min: 0 },
    sku: { type: String, unique: true, sparse: true },
    tags: [{ type: String, trim: true }], // e.g., ['anti-tarnish', 'korean', 'kundan']
    material: { type: String, default: '' },
    weight: { type: String, default: '' },
    dimensions: { type: String, default: '' },
    isFeatured: { type: Boolean, default: false },
    isBestseller: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    ratings: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    reviews: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        rating: { type: Number, min: 1, max: 5 },
        comment: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    soldCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-calculate discount percent
productSchema.pre('save', function (next) {
  if (this.discountPrice && this.price > 0) {
    this.discountPercent = Math.round(((this.price - this.discountPrice) / this.price) * 100);
  }
  next();
});

// Text index for search
productSchema.index({ title: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, subCategory: 1 });
productSchema.index({ price: 1 });

module.exports = mongoose.model('Product', productSchema);

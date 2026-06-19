const asyncHandler = require('express-async-handler');
const prisma = require('../config/prisma');
const { calculateCouponDiscount } = require('../utils/couponRules');

const normalizeStringArray = (value) => (
  Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : []
);

const normalizeCouponData = (body) => ({
  ...(body.description !== undefined ? { description: body.description || '' } : {}),
  ...(body.discountType !== undefined ? { discountType: body.discountType } : {}),
  ...(body.value !== undefined ? { value: Number(body.value) } : {}),
  ...(body.minOrderAmount !== undefined ? { minOrderAmount: Number(body.minOrderAmount) || 0 } : {}),
  ...(body.maxDiscount !== undefined ? { maxDiscount: body.maxDiscount ? Number(body.maxDiscount) : null } : {}),
  ...(body.expiry !== undefined ? { expiry: new Date(body.expiry) } : {}),
  ...(body.usageLimit !== undefined ? { usageLimit: body.usageLimit ? Number(body.usageLimit) : null } : {}),
  ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
  ...(body.applicableCategories !== undefined ? { applicableCategories: normalizeStringArray(body.applicableCategories) } : {}),
  ...(body.applicableProductTypes !== undefined ? { applicableProductTypes: normalizeStringArray(body.applicableProductTypes) } : {}),
  ...(body.applicableProductTags !== undefined ? { applicableProductTags: normalizeStringArray(body.applicableProductTags).map((tag) => tag.toLowerCase()) } : {}),
  ...(body.minProductPrice !== undefined ? { minProductPrice: body.minProductPrice ? Number(body.minProductPrice) : null } : {}),
  ...(body.maxProductPrice !== undefined ? { maxProductPrice: body.maxProductPrice ? Number(body.maxProductPrice) : null } : {}),
});

const loadCartProducts = async (items = []) => {
  if (!Array.isArray(items) || items.length === 0) return [];
  const ids = [...new Set(items.map((item) => item.productId).filter(Boolean))];
  const products = await prisma.product.findMany({ where: { id: { in: ids } } });
  const productMap = new Map(products.map((product) => [product.id, product]));

  return items
    .map((item) => {
      const product = productMap.get(item.productId);
      return product ? { product, quantity: Number(item.quantity) || 1 } : null;
    })
    .filter(Boolean);
};

const validateCoupon = asyncHandler(async (req, res) => {
  const { code, subtotal, items } = req.body;
  if (!code) {
    res.status(400);
    throw new Error('Coupon code required');
  }

  const coupon = await prisma.coupon.findFirst({
    where: { code: String(code).toUpperCase(), isActive: true },
  });

  if (!coupon) {
    res.status(404);
    throw new Error('Invalid coupon code');
  }

  const products = await loadCartProducts(items);
  const result = calculateCouponDiscount({
    coupon,
    subtotal: Number(subtotal),
    products,
    userId: req.user?.id || req.user?._id,
  });

  res.json({
    success: true,
    coupon: {
      code: coupon.code,
      discountType: coupon.discountType,
      value: coupon.value,
      applicableSubtotal: result.applicableSubtotal,
    },
    discount: result.discount,
    finalAmount: result.finalAmount,
  });
});

const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ success: true, coupons: coupons.map((c) => ({ ...c, _id: c.id })) });
});

const createCoupon = asyncHandler(async (req, res) => {
  const { code, discountType, value, expiry } = req.body;
  if (!code || !discountType || !value || !expiry) { res.status(400); throw new Error('Required fields missing'); }

  const exists = await prisma.coupon.findUnique({ where: { code: String(code).toUpperCase() } });
  if (exists) { res.status(400); throw new Error('Coupon code already exists'); }

  const coupon = await prisma.coupon.create({
    data: {
      code: String(code).toUpperCase(),
      ...normalizeCouponData(req.body),
    },
  });

  res.status(201).json({ success: true, coupon: { ...coupon, _id: coupon.id } });
});

const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await prisma.coupon.findUnique({ where: { id: req.params.id } });
  if (!coupon) { res.status(404); throw new Error('Coupon not found'); }

  const data = normalizeCouponData(req.body);
  const updated = await prisma.coupon.update({ where: { id: req.params.id }, data });
  res.json({ success: true, coupon: { ...updated, _id: updated.id } });
});

const deleteCoupon = asyncHandler(async (req, res) => {
  await prisma.coupon.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Coupon deleted' });
});

module.exports = { validateCoupon, getCoupons, createCoupon, updateCoupon, deleteCoupon };

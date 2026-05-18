const asyncHandler = require('express-async-handler');
const prisma = require('../config/prisma');

const validateCoupon = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;
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

  const now = new Date();
  if (coupon.expiry < now) { res.status(400); throw new Error('Coupon has expired'); }
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) { res.status(400); throw new Error('Coupon usage limit reached'); }

  const usedBy = Array.isArray(coupon.usedBy) ? coupon.usedBy : [];
  const userId = req.user.id || req.user._id;
  if (usedBy.includes(userId)) { res.status(400); throw new Error('You have already used this coupon'); }
  if (Number(subtotal) < coupon.minOrderAmount) { res.status(400); throw new Error(`Minimum order amount is ₹${coupon.minOrderAmount}`); }

  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = Math.round((Number(subtotal) * coupon.value) / 100);
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  } else {
    discount = coupon.value;
  }

  res.json({
    success: true,
    coupon: { code: coupon.code, discountType: coupon.discountType, value: coupon.value },
    discount,
    finalAmount: Number(subtotal) - discount,
  });
});

const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ success: true, coupons: coupons.map((c) => ({ ...c, _id: c.id })) });
});

const createCoupon = asyncHandler(async (req, res) => {
  const { code, description, discountType, value, minOrderAmount, maxDiscount, expiry, usageLimit, applicableCategories } = req.body;
  if (!code || !discountType || !value || !expiry) { res.status(400); throw new Error('Required fields missing'); }

  const exists = await prisma.coupon.findUnique({ where: { code: String(code).toUpperCase() } });
  if (exists) { res.status(400); throw new Error('Coupon code already exists'); }

  const coupon = await prisma.coupon.create({
    data: {
      code: String(code).toUpperCase(),
      description: description || '',
      discountType,
      value: Number(value),
      minOrderAmount: Number(minOrderAmount) || 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      expiry: new Date(expiry),
      usageLimit: usageLimit ? Number(usageLimit) : null,
      applicableCategories: applicableCategories || [],
    },
  });

  res.status(201).json({ success: true, coupon: { ...coupon, _id: coupon.id } });
});

const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await prisma.coupon.findUnique({ where: { id: req.params.id } });
  if (!coupon) { res.status(404); throw new Error('Coupon not found'); }

  const fields = ['description', 'discountType', 'value', 'minOrderAmount', 'maxDiscount', 'usageLimit', 'isActive'];
  const data = {};
  fields.forEach((f) => {
    if (req.body[f] !== undefined) data[f] = req.body[f];
  });
  if (req.body.expiry !== undefined) data.expiry = new Date(req.body.expiry);

  const updated = await prisma.coupon.update({ where: { id: req.params.id }, data });
  res.json({ success: true, coupon: { ...updated, _id: updated.id } });
});

const deleteCoupon = asyncHandler(async (req, res) => {
  await prisma.coupon.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Coupon deleted' });
});

module.exports = { validateCoupon, getCoupons, createCoupon, updateCoupon, deleteCoupon };

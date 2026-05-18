const asyncHandler = require('express-async-handler');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const prisma = require('../config/prisma');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const buildOrderDisplayId = async () => {
  const year = new Date().getFullYear();
  const count = await prisma.order.count();
  return `SJ-${year}-${String(count + 1).padStart(4, '0')}`;
};

const createPayment = asyncHandler(async (req, res) => {
  const { items, shippingAddress, couponCode } = req.body;
  if (!items?.length) {
    res.status(400);
    throw new Error('No items in order');
  }

  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product || !product.isActive) { res.status(400); throw new Error(`Product not available: ${item.productId}`); }
    if (product.stock < item.quantity) { res.status(400); throw new Error(`Insufficient stock for ${product.title}`); }

    const price = product.discountPrice > 0 ? product.discountPrice : product.price;
    const images = Array.isArray(product.images) ? product.images : [];

    orderItems.push({
      product: product.id,
      title: product.title,
      image: images[0]?.url || '',
      price: product.price,
      discountPrice: product.discountPrice,
      quantity: item.quantity,
      total: price * item.quantity,
    });
    subtotal += price * item.quantity;
  }

  let discount = 0;
  if (couponCode) {
    const coupon = await prisma.coupon.findFirst({ where: { code: String(couponCode).toUpperCase(), isActive: true } });
    if (coupon) {
      const now = new Date();
      const usedBy = Array.isArray(coupon.usedBy) ? coupon.usedBy : [];
      const userId = req.user.id || req.user._id;

      if (coupon.expiry < now) throw new Error('Coupon expired');
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new Error('Coupon usage limit reached');
      if (usedBy.includes(userId)) throw new Error('You have already used this coupon');
      if (subtotal < coupon.minOrderAmount) throw new Error(`Minimum order ₹${coupon.minOrderAmount} required`);

      if (coupon.discountType === 'percentage') {
        discount = Math.round((subtotal * coupon.value) / 100);
        if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
      } else {
        discount = coupon.value;
      }
    }
  }

  const shippingCharge = subtotal - discount >= 999 ? 0 : 60;
  const totalAmount = subtotal - discount + shippingCharge;

  const rzpOrder = await razorpay.orders.create({
    amount: Math.round(totalAmount * 100),
    currency: 'INR',
    receipt: `sj_${Date.now()}`,
  });

  const order = await prisma.order.create({
    data: {
      orderId: await buildOrderDisplayId(),
      userId: req.user.id || req.user._id,
      items: orderItems,
      shippingAddress,
      subtotal,
      discount,
      couponCode: couponCode?.toUpperCase() || '',
      shippingCharge,
      totalAmount,
      razorpayOrderId: rzpOrder.id,
      paymentMethod: 'razorpay',
      paymentStatus: 'pending',
    },
  });

  res.status(201).json({
    success: true,
    order: { _id: order.id, orderId: order.orderId, totalAmount, razorpayOrderId: rzpOrder.id },
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  });
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

  const generated = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (generated !== razorpaySignature) {
    res.status(400);
    throw new Error('Payment verification failed');
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.userId !== (req.user.id || req.user._id)) { res.status(403); throw new Error('Access denied'); }
  if (order.razorpayOrderId !== razorpayOrderId) { res.status(400); throw new Error('Order mismatch'); }
  if (order.paymentStatus === 'paid') { res.status(400); throw new Error('Order already paid'); }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'paid',
      orderStatus: 'confirmed',
      razorpayPaymentId,
      razorpaySignature,
    },
  });

  const orderItems = Array.isArray(order.items) ? order.items : [];
  await prisma.$transaction(
    orderItems.map((item) =>
      prisma.product.update({
        where: { id: item.product },
        data: { stock: { decrement: item.quantity }, soldCount: { increment: item.quantity } },
      })
    )
  );

  if (order.couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: order.couponCode } });
    if (coupon) {
      const usedBy = Array.isArray(coupon.usedBy) ? [...coupon.usedBy] : [];
      if (!usedBy.includes(req.user.id || req.user._id)) usedBy.push(req.user.id || req.user._id);
      await prisma.coupon.update({
        where: { code: order.couponCode },
        data: { usedCount: { increment: 1 }, usedBy },
      });
    }
  }

  res.json({ success: true, order: { ...updatedOrder, _id: updatedOrder.id } });
});

const getMyOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const pageNum = Number(page);
  const limitNum = Number(limit);

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId: req.user.id || req.user._id },
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.order.count({ where: { userId: req.user.id || req.user._id } }),
  ]);

  res.json({
    success: true,
    orders: orders.map((o) => ({ ...o, _id: o.id })),
    pagination: { page: pageNum, total, pages: Math.ceil(total / limitNum) },
  });
});

const getOrder = asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.userId !== (req.user.id || req.user._id) && req.user.role === 'customer') {
    res.status(403);
    throw new Error('Access denied');
  }

  res.json({ success: true, order: { ...order, _id: order.id, user: { ...order.user, _id: order.user.id } } });
});

const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, paymentStatus, search } = req.query;
  const pageNum = Number(page);
  const limitNum = Number(limit);

  const where = {
    ...(status ? { orderStatus: status } : {}),
    ...(paymentStatus ? { paymentStatus } : {}),
    ...(search ? { orderId: { contains: String(search), mode: 'insensitive' } } : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.order.count({ where }),
  ]);

  res.json({
    success: true,
    orders: orders.map((o) => ({ ...o, _id: o.id, user: o.user ? { ...o.user, _id: o.user.id } : null })),
    pagination: { page: pageNum, total, pages: Math.ceil(total / limitNum) },
  });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus, trackingNumber, notes } = req.body;
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) { res.status(404); throw new Error('Order not found'); }

  const updated = await prisma.order.update({
    where: { id: req.params.id },
    data: {
      ...(orderStatus ? { orderStatus } : {}),
      ...(trackingNumber ? { trackingNumber } : {}),
      ...(notes ? { notes } : {}),
      ...(orderStatus === 'delivered' ? { deliveredAt: new Date() } : {}),
    },
  });

  res.json({ success: true, order: { ...updated, _id: updated.id } });
});

const getOrderStats = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [total, todayOrders, monthOrders, pending, delivered, paidOrders] = await Promise.all([
    prisma.order.count({ where: { paymentStatus: 'paid' } }),
    prisma.order.count({ where: { paymentStatus: 'paid', createdAt: { gte: today } } }),
    prisma.order.count({ where: { paymentStatus: 'paid', createdAt: { gte: monthStart } } }),
    prisma.order.count({ where: { orderStatus: 'placed' } }),
    prisma.order.count({ where: { orderStatus: 'delivered' } }),
    prisma.order.findMany({ where: { paymentStatus: 'paid' }, select: { totalAmount: true } }),
  ]);

  const totalRevenue = paidOrders.reduce((sum, row) => sum + row.totalAmount, 0);

  res.json({
    success: true,
    stats: {
      totalOrders: total,
      todayOrders,
      monthOrders,
      totalRevenue,
      pendingOrders: pending,
      deliveredOrders: delivered,
    },
  });
});

module.exports = { createPayment, verifyPayment, getMyOrders, getOrder, getAllOrders, updateOrderStatus, getOrderStats };

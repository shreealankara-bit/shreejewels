const asyncHandler = require('express-async-handler');
const axios = require('axios');
const nodemailer = require('nodemailer');
const prisma = require('../config/prisma');
const { calculateCouponDiscount } = require('../utils/couponRules');

// ── Cashfree REST API client ───────────────────────────────────────────────────
const CF_BASE =
  process.env.CASHFREE_ENV === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';

const CF_VERSION = '2023-08-01';

const cfHeaders = () => ({
  'x-client-id': process.env.CASHFREE_APP_ID,
  'x-client-secret': process.env.CASHFREE_SECRET_KEY,
  'x-api-version': CF_VERSION,
  'Content-Type': 'application/json',
});

// ── Create Cashfree order ──────────────────────────────────────────────────────
const cfCreateOrder = async (payload) => {
  const res = await axios.post(`${CF_BASE}/orders`, payload, { headers: cfHeaders() });
  return res.data; // { order_id, payment_session_id, ... }
};

// ── Fetch payments for a Cashfree order ───────────────────────────────────────
const cfGetPayments = async (cfOrderId) => {
  const res = await axios.get(`${CF_BASE}/orders/${cfOrderId}/payments`, { headers: cfHeaders() });
  return res.data; // array of payment objects
};

// ── Order display ID ───────────────────────────────────────────────────────────
const buildOrderDisplayId = async () => {
  const year = new Date().getFullYear();
  const count = await prisma.order.count();
  return `SJ-${year}-${String(count + 1).padStart(4, '0')}`;
};

// ── Order confirmation email ───────────────────────────────────────────────────
const sendOrderConfirmationEmail = async (order, userEmail, userName) => {
  try {
    const settings = await prisma.siteSettings.findFirst();
    if (!settings?.smtpHost || !settings?.smtpUser || !settings?.smtpPass) return;

    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort || 587,
      secure: settings.smtpPort === 465,
      auth: { user: settings.smtpUser, pass: settings.smtpPass },
    });

    const items = Array.isArray(order.items) ? order.items : [];
    const itemRows = items
      .map(
        (item) => `<tr>
        <td style="padding:8px;border-bottom:1px solid #f0e8d8;">${item.title}</td>
        <td style="padding:8px;border-bottom:1px solid #f0e8d8;text-align:center;">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #f0e8d8;text-align:right;">₹${(item.total || 0).toLocaleString('en-IN')}</td>
      </tr>`
      )
      .join('');

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #f0e8d8;border-radius:8px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#2e1111,#5c2828);padding:24px;text-align:center;">
          <h1 style="color:#e8c97e;margin:0;font-size:22px;">${settings.siteName || 'Shree Jewels'}</h1>
          <p style="color:#f0e8d8;margin:8px 0 0;font-size:14px;">Order Confirmation</p>
        </div>
        <div style="padding:24px;">
          <p style="color:#3d1c1c;font-size:15px;">Dear <strong>${userName}</strong>,</p>
          <p style="color:#5c2828;">Thank you for your order! We have received your order and it is being processed.</p>
          <div style="background:#fdf9f0;border-radius:8px;padding:16px;margin:16px 0;">
            <p style="margin:0;color:#3d1c1c;font-size:14px;"><strong>Order ID:</strong> ${order.orderId}</p>
            <p style="margin:4px 0 0;color:#5c2828;font-size:13px;"><strong>Payment:</strong> ✅ Confirmed via Cashfree</p>
          </div>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <thead><tr style="background:#f5ede0;">
              <th style="padding:10px 8px;text-align:left;color:#3d1c1c;font-size:13px;">Product</th>
              <th style="padding:10px 8px;text-align:center;color:#3d1c1c;font-size:13px;">Qty</th>
              <th style="padding:10px 8px;text-align:right;color:#3d1c1c;font-size:13px;">Amount</th>
            </tr></thead>
            <tbody>${itemRows}</tbody>
          </table>
          <div style="border-top:2px solid #f0e8d8;padding-top:12px;text-align:right;">
            ${order.discount > 0 ? `<p style="color:#5c2828;font-size:13px;margin:4px 0;">Discount: -₹${order.discount.toLocaleString('en-IN')}</p>` : ''}
            ${order.shippingCharge > 0 ? `<p style="color:#5c2828;font-size:13px;margin:4px 0;">Shipping: ₹${order.shippingCharge.toLocaleString('en-IN')}</p>` : '<p style="color:#22c55e;font-size:13px;margin:4px 0;">🚚 Free Shipping</p>'}
            <p style="color:#3d1c1c;font-size:16px;font-weight:bold;margin:4px 0;">Total: ₹${order.totalAmount.toLocaleString('en-IN')}</p>
          </div>
        </div>
        <div style="background:#f5ede0;padding:16px;text-align:center;">
          <p style="color:#5c2828;font-size:12px;margin:0;">© ${new Date().getFullYear()} ${settings.siteName || 'Shree Jewels'}. All rights reserved.</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: settings.smtpFrom || settings.smtpUser,
      to: userEmail,
      subject: `Order Confirmed – ${order.orderId} | ${settings.siteName || 'Shree Jewels'}`,
      html,
    });
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
};

// ── POST /orders/create-payment ────────────────────────────────────────────────
const createPayment = asyncHandler(async (req, res) => {
  const { items, shippingAddress, couponCode } = req.body;
  if (!items?.length) { res.status(400); throw new Error('No items in order'); }

  let subtotal = 0;
  const orderItems = [];
  const couponProducts = [];

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
    couponProducts.push({ product, quantity: item.quantity });
    subtotal += price * item.quantity;
  }

  // Coupon validation
  let discount = 0;
  if (couponCode) {
    const coupon = await prisma.coupon.findFirst({
      where: { code: String(couponCode).toUpperCase(), isActive: true },
    });
    if (!coupon) throw new Error('Invalid coupon code');

    const result = calculateCouponDiscount({
      coupon,
      subtotal,
      products: couponProducts,
      userId: req.user.id,
    });
    discount = result.discount;
  }

  const shippingCharge = subtotal - discount >= 999 ? 0 : 60;
  const totalAmount = subtotal - discount + shippingCharge;

  // Get user info for Cashfree customer_details
  const userRecord = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { name: true, email: true, phone: true },
  });

  // Unique Cashfree order ID
  const cfOrderId = `sj_${Date.now()}`;

  // Call Cashfree API to create order
  const cfOrder = await cfCreateOrder({
    order_id: cfOrderId,
    order_amount: parseFloat(totalAmount.toFixed(2)),
    order_currency: 'INR',
    customer_details: {
      customer_id: req.user.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50),
      customer_name: userRecord?.name || 'Customer',
      customer_email: userRecord?.email || 'customer@example.com',
      customer_phone: (shippingAddress?.phone || userRecord?.phone || '9999999999').replace(/\D/g, '').slice(-10),
    },
  });

  // Save order to DB
  const order = await prisma.order.create({
    data: {
      orderId: await buildOrderDisplayId(),
      userId: req.user.id,
      items: orderItems,
      shippingAddress,
      subtotal,
      discount,
      couponCode: couponCode?.toUpperCase() || '',
      shippingCharge,
      totalAmount,
      cfOrderId,
      paymentMethod: 'cashfree',
      paymentStatus: 'pending',
    },
  });

  res.status(201).json({
    success: true,
    order: { _id: order.id, orderId: order.orderId, totalAmount },
    paymentSessionId: cfOrder.payment_session_id,
    cashfreeOrderId: cfOrderId,
  });
});

// ── POST /orders/verify-payment ────────────────────────────────────────────────
const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, cashfreeOrderId } = req.body;
  if (!orderId || !cashfreeOrderId) { res.status(400); throw new Error('orderId and cashfreeOrderId are required'); }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.userId !== req.user.id) { res.status(403); throw new Error('Access denied'); }
  if (order.cfOrderId !== cashfreeOrderId) { res.status(400); throw new Error('Order ID mismatch'); }
  if (order.paymentStatus === 'paid') { res.status(400); throw new Error('Order already paid'); }

  // Fetch payments from Cashfree
  const payments = await cfGetPayments(cashfreeOrderId);

  if (!Array.isArray(payments) || payments.length === 0) {
    res.status(400); throw new Error('No payment found for this order');
  }

  const successPayment = payments.find((p) => p.payment_status === 'SUCCESS');
  if (!successPayment) { res.status(400); throw new Error('Payment not successful'); }

  // Update DB
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'paid',
      orderStatus: 'confirmed',
      cfPaymentId: String(successPayment.cf_payment_id),
    },
  });

  // Decrement stock atomically
  const orderItems = Array.isArray(order.items) ? order.items : [];
  await prisma.$transaction(
    orderItems.map((item) =>
      prisma.product.update({
        where: { id: item.product },
        data: { stock: { decrement: item.quantity }, soldCount: { increment: item.quantity } },
      })
    )
  );

  // Update coupon usage
  if (order.couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: order.couponCode } });
    if (coupon) {
      const usedBy = Array.isArray(coupon.usedBy) ? [...coupon.usedBy] : [];
      if (!usedBy.includes(req.user.id)) usedBy.push(req.user.id);
      await prisma.coupon.update({
        where: { code: order.couponCode },
        data: { usedCount: { increment: 1 }, usedBy },
      });
    }
  }

  // Send confirmation email (non-blocking)
  const userRecord = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { email: true, name: true },
  });
  if (userRecord) sendOrderConfirmationEmail(updatedOrder, userRecord.email, userRecord.name);

  res.json({ success: true, order: { ...updatedOrder, _id: updatedOrder.id } });
});

// ── GET /orders/my ─────────────────────────────────────────────────────────────
const getMyOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.order.count({ where: { userId: req.user.id } }),
  ]);
  res.json({
    success: true,
    orders: orders.map((o) => ({ ...o, _id: o.id })),
    pagination: { page: pageNum, total, pages: Math.ceil(total / limitNum) },
  });
});

// ── GET /orders/:id ────────────────────────────────────────────────────────────
const getOrder = asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.userId !== req.user.id && req.user.role === 'customer') { res.status(403); throw new Error('Access denied'); }
  res.json({ success: true, order: { ...order, _id: order.id, user: { ...order.user, _id: order.user.id } } });
});

// ── GET /orders/admin/all ──────────────────────────────────────────────────────
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

// ── PUT /orders/admin/:id ──────────────────────────────────────────────────────
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

// ── GET /orders/admin/stats ────────────────────────────────────────────────────
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
    stats: { totalOrders: total, todayOrders, monthOrders, totalRevenue, pendingOrders: pending, deliveredOrders: delivered },
  });
});

module.exports = { createPayment, verifyPayment, getMyOrders, getOrder, getAllOrders, updateOrderStatus, getOrderStats };

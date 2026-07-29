const asyncHandler = require('express-async-handler');
const axios = require('axios');
const nodemailer = require('nodemailer');
const prisma = require('../config/prisma');
const { calculateCouponDiscount } = require('../utils/couponRules');
const crypto = require('crypto');

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
    const resendApiKey = settings?.resendApiKey || process.env.RESEND_API_KEY;
    const smtpFrom = settings?.smtpFrom || process.env.RESEND_FROM_EMAIL || 'no-reply@shreejewels.com';

    if (!resendApiKey) {
      console.error('No Resend API key configured in Settings or .env');
      return;
    }

    const { Resend } = require('resend');
    const resend = new Resend(resendApiKey);

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

    let html = settings.orderEmailTemplate;

    if (!html) {
      // Fallback default template
      html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #f0e8d8;border-radius:8px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#2e1111,#5c2828);padding:24px;text-align:center;">
            <h1 style="color:#e8c97e;margin:0;font-size:22px;">{{siteName}}</h1>
            <p style="color:#f0e8d8;margin:8px 0 0;font-size:14px;">Order Confirmation</p>
          </div>
          <div style="padding:24px;">
            <p style="color:#3d1c1c;font-size:15px;">Dear <strong>{{userName}}</strong>,</p>
            <p style="color:#5c2828;">Thank you for your order! We have received your order and it is being processed.</p>
            <div style="background:#fdf9f0;border-radius:8px;padding:16px;margin:16px 0;">
              <p style="margin:0;color:#3d1c1c;font-size:14px;"><strong>Order ID:</strong> {{orderId}}</p>
              <p style="margin:4px 0 0;color:#5c2828;font-size:13px;"><strong>Payment:</strong> ✅ Confirmed via Cashfree</p>
            </div>
            <table style="width:100%;border-collapse:collapse;margin:16px 0;">
              <thead><tr style="background:#f5ede0;">
                <th style="padding:10px 8px;text-align:left;color:#3d1c1c;font-size:13px;">Product</th>
                <th style="padding:10px 8px;text-align:center;color:#3d1c1c;font-size:13px;">Qty</th>
                <th style="padding:10px 8px;text-align:right;color:#3d1c1c;font-size:13px;">Amount</th>
              </tr></thead>
              <tbody>{{itemRows}}</tbody>
            </table>
            <div style="border-top:2px solid #f0e8d8;padding-top:12px;text-align:right;">
              {{discountLine}}
              {{shippingLine}}
              <p style="color:#3d1c1c;font-size:16px;font-weight:bold;margin:4px 0;">Total: ₹{{totalAmount}}</p>
            </div>
          </div>
          <div style="background:#f5ede0;padding:16px;text-align:center;">
            <p style="color:#5c2828;font-size:12px;margin:0;">© ${new Date().getFullYear()} {{siteName}}. All rights reserved.</p>
          </div>
        </div>
      `;
    }

    // Replace variables
    const discountLine = order.discount > 0 ? `<p style="color:#5c2828;font-size:13px;margin:4px 0;">Discount: -₹${order.discount.toLocaleString('en-IN')}</p>` : '';
    const shippingLine = order.shippingCharge > 0 ? `<p style="color:#5c2828;font-size:13px;margin:4px 0;">Shipping: ₹${order.shippingCharge.toLocaleString('en-IN')}</p>` : '<p style="color:#22c55e;font-size:13px;margin:4px 0;">🚚 Free Shipping</p>';

    html = html.replace(/{{siteName}}/g, settings.siteName || 'Shree Jewels')
               .replace(/{{userName}}/g, userName || 'Customer')
               .replace(/{{orderId}}/g, order.orderId)
               .replace(/{{itemRows}}/g, itemRows)
               .replace(/{{discountLine}}/g, discountLine)
               .replace(/{{shippingLine}}/g, shippingLine)
               .replace(/{{totalAmount}}/g, order.totalAmount.toLocaleString('en-IN'));

    let subject = settings.orderEmailSubject || 'Your Order Confirmation - Shree Jewels';
    subject = subject.replace(/{{orderId}}/g, order.orderId)
                     .replace(/{{siteName}}/g, settings.siteName || 'Shree Jewels');

    await resend.emails.send({
      from: smtpFrom,
      to: userEmail,
      subject,
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
  let customShipping = 0;
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
    
    // Calculate custom shipping per product
    const prodShipping = product.shippingCharge || 0;
    if (prodShipping > 0) {
      if (product.shippingType === 'per_piece') {
        customShipping += prodShipping * item.quantity;
      } else {
        customShipping += prodShipping;
      }
    }
  }

  // Coupon validation
  let discount = 0;
  if (couponCode) {
    const coupon = await prisma.coupon.findFirst({
      where: { code: String(couponCode).toUpperCase(), isActive: true },
    });
    if (!coupon) throw new Error('Invalid coupon code');

    try {
      const result = calculateCouponDiscount({
        coupon,
        subtotal,
        products: couponProducts,
        userId: req.user.id,
      });
      discount = result.discount;
    } catch (couponErr) {
      res.status(400);
      throw new Error(couponErr.message || 'Coupon is not applicable to the selected products');
    }
  }

  // Base shipping is 60 if subtotal - discount < 999, else 0
  const baseShipping = subtotal - discount >= 999 ? 0 : 60;
  const shippingCharge = baseShipping + customShipping;
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

// ── Process Successful Order Helper ────────────────────────────────────────────
const processSuccessfulOrder = async (orderId, cfPaymentId, userId) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch current order state
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('Order not found in transaction');
    if (order.paymentStatus === 'paid') return order; // Already processed

    // 2. Decrement stock atomically and strictly
    const orderItems = Array.isArray(order.items) ? order.items : [];
    for (const item of orderItems) {
      const product = await tx.product.findUnique({ where: { id: item.product } });
      if (!product) throw new Error(`Product not found: ${item.title}`);
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.title}. Available: ${product.stock}, Requested: ${item.quantity}`);
      }
      await tx.product.update({
        where: { id: item.product },
        data: { stock: { decrement: item.quantity }, soldCount: { increment: item.quantity } },
      });
    }

    // 3. Mark order as paid
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'paid',
        orderStatus: 'confirmed',
        cfPaymentId: String(cfPaymentId),
      },
    });

    // 4. Update coupon usage
    if (order.couponCode) {
      const coupon = await tx.coupon.findUnique({ where: { code: order.couponCode } });
      if (coupon) {
        const usedBy = Array.isArray(coupon.usedBy) ? [...coupon.usedBy] : [];
        if (!usedBy.includes(userId)) usedBy.push(userId);
        await tx.coupon.update({
          where: { code: order.couponCode },
          data: { usedCount: { increment: 1 }, usedBy },
        });
      }
    }

    return updatedOrder;
  });
};

// ── POST /orders/verify-payment ────────────────────────────────────────────────
const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, cashfreeOrderId } = req.body;
  if (!orderId || !cashfreeOrderId) { res.status(400); throw new Error('orderId and cashfreeOrderId are required'); }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.userId !== req.user.id) { res.status(403); throw new Error('Access denied'); }
  if (order.cfOrderId !== cashfreeOrderId) { res.status(400); throw new Error('Order ID mismatch'); }
  if (order.paymentStatus === 'paid') { 
    return res.json({ success: true, order: { ...order, _id: order.id } });
  }

  // Fetch payments from Cashfree
  const payments = await cfGetPayments(cashfreeOrderId);

  if (!Array.isArray(payments) || payments.length === 0) {
    res.status(400); throw new Error('No payment found for this order');
  }

  const successPayment = payments.find((p) => p.payment_status === 'SUCCESS');
  if (!successPayment) { res.status(400); throw new Error('Payment not successful'); }

  let updatedOrder;
  try {
    updatedOrder = await processSuccessfulOrder(orderId, successPayment.cf_payment_id, req.user.id);
  } catch (error) {
    res.status(400);
    throw new Error(error.message || 'Error processing order');
  }

  // Send confirmation email (non-blocking)
  const userRecord = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { email: true, name: true },
  });
  if (userRecord) sendOrderConfirmationEmail(updatedOrder, userRecord.email, userRecord.name);

  res.json({ success: true, order: { ...updatedOrder, _id: updatedOrder.id } });
});

// ── POST /orders/webhook (Cashfree Webhook) ──────────────────────────────────
const cashfreeWebhook = asyncHandler(async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    
    if (!signature || !timestamp || !req.rawBody) {
      return res.status(400).send('Missing signature, timestamp, or raw body');
    }

    // Verify signature
    const payload = timestamp + req.rawBody.toString();
    const expectedSignature = crypto
      .createHmac('sha256', process.env.CASHFREE_SECRET_KEY)
      .update(payload)
      .digest('base64');

    if (expectedSignature !== signature) {
      return res.status(401).send('Invalid webhook signature');
    }

    const event = req.body;
    
    // Only process PAYMENT_SUCCESS_WEBHOOK
    if (event.type === 'PAYMENT_SUCCESS_WEBHOOK') {
      const cfOrderId = event.data?.order?.order_id;
      const cfPaymentId = event.data?.payment?.cf_payment_id;

      if (cfOrderId && cfPaymentId) {
        const order = await prisma.order.findFirst({ where: { cfOrderId } });
        if (order && order.paymentStatus === 'pending') {
          // Double check with API to prevent any payload spoofing
          const payments = await cfGetPayments(cfOrderId);
          const successPayment = payments?.find((p) => String(p.cf_payment_id) === String(cfPaymentId) && p.payment_status === 'SUCCESS');
          
          if (successPayment) {
            try {
              const updatedOrder = await processSuccessfulOrder(order.id, successPayment.cf_payment_id, order.userId);
              // Send confirmation email
              const userRecord = await prisma.user.findUnique({
                where: { id: order.userId },
                select: { email: true, name: true },
              });
              if (userRecord) sendOrderConfirmationEmail(updatedOrder, userRecord.email, userRecord.name);
            } catch (err) {
              console.error(`Webhook order processing failed for ${cfOrderId}:`, err.message);
            }
          }
        }
      }
    }

    res.status(200).send('Webhook received');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Webhook processing failed');
  }
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

module.exports = { createPayment, verifyPayment, getMyOrders, getOrder, getAllOrders, updateOrderStatus, getOrderStats, cashfreeWebhook };

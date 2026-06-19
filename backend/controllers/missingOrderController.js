const asyncHandler = require('express-async-handler');
const prisma = require('../config/prisma');

// POST /api/missing-orders  — called from frontend on checkout failure/abandon
const saveMissingOrder = asyncHandler(async (req, res) => {
  const {
    sessionId, userId, name, email, phone,
    items, shippingAddress, subtotal, discount,
    couponCode, totalAmount, reason,
  } = req.body;

  if (!sessionId) { res.status(400); throw new Error('sessionId is required'); }

  // Upsert: if same sessionId exists, update it
  const existing = await prisma.missingOrder.findFirst({
    where: { sessionId },
  });

  let missingOrder;
  if (existing) {
    missingOrder = await prisma.missingOrder.update({
      where: { id: existing.id },
      data: {
        ...(userId !== undefined ? { userId: String(userId) } : {}),
        ...(name !== undefined ? { name } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(items !== undefined ? { items } : {}),
        ...(shippingAddress !== undefined ? { shippingAddress } : {}),
        ...(subtotal !== undefined ? { subtotal: Number(subtotal) } : {}),
        ...(discount !== undefined ? { discount: Number(discount) } : {}),
        ...(couponCode !== undefined ? { couponCode } : {}),
        ...(totalAmount !== undefined ? { totalAmount: Number(totalAmount) } : {}),
        ...(reason !== undefined ? { reason } : {}),
      },
    });
  } else {
    missingOrder = await prisma.missingOrder.create({
      data: {
        sessionId,
        userId: userId ? String(userId) : '',
        name: name || '',
        email: email || '',
        phone: phone || '',
        items: items || [],
        shippingAddress: shippingAddress || {},
        subtotal: Number(subtotal) || 0,
        discount: Number(discount) || 0,
        couponCode: couponCode || '',
        totalAmount: Number(totalAmount) || 0,
        reason: reason || 'abandoned',
      },
    });
  }

  res.status(201).json({ success: true, id: missingOrder.id });
});

// GET /api/missing-orders/admin  — admin: list all
const getAll = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, reason } = req.query;
  const pageNum = Number(page);
  const limitNum = Number(limit);

  const where = {
    ...(reason ? { reason } : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.missingOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.missingOrder.count({ where }),
  ]);

  res.json({
    success: true,
    orders,
    pagination: { page: pageNum, total, pages: Math.ceil(total / limitNum) },
  });
});

// DELETE /api/missing-orders/admin/:id
const remove = asyncHandler(async (req, res) => {
  const existing = await prisma.missingOrder.findUnique({ where: { id: req.params.id } });
  if (!existing) { res.status(404); throw new Error('Missing order not found'); }

  await prisma.missingOrder.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Deleted' });
});

module.exports = { saveMissingOrder, getAll, remove };

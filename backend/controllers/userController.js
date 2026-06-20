const asyncHandler = require('express-async-handler');
const prisma = require('../config/prisma');

const getAllUsers = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20, role } = req.query;
  const roles = role
    ? String(role).split(',').map((value) => value.trim()).filter(Boolean)
    : [];

  const where = {
    ...(roles.length === 1 ? { role: roles[0] } : {}),
    ...(roles.length > 1 ? { role: { in: roles } } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: String(search), mode: 'insensitive' } },
            { email: { contains: String(search), mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const pageNum = Number(page);
  const limitNum = Number(limit);

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limitNum,
      skip: (pageNum - 1) * limitNum,
      include: {
        _count: { select: { orders: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    success: true,
    users: users.map((u) => ({
      ...u,
      _id: u.id,
      password: undefined,
      ordersCount: u._count?.orders || 0,
      _count: undefined,
    })),
    total,
    pagination: { page: pageNum, total, pages: Math.ceil(total / limitNum) },
  });
});

const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive: !user.isActive },
  });

  res.json({ success: true, user: { ...updated, _id: updated.id, password: undefined } });
});

module.exports = { getAllUsers, toggleUserStatus };

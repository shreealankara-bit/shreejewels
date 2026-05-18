const asyncHandler = require('express-async-handler');
const prisma = require('../config/prisma');

const getAllUsers = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 50 } = req.query;

  const where = search
    ? {
        OR: [
          { name: { contains: String(search), mode: 'insensitive' } },
          { email: { contains: String(search), mode: 'insensitive' } },
        ],
      }
    : {};

  const pageNum = Number(page);
  const limitNum = Number(limit);

  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, take: limitNum, skip: (pageNum - 1) * limitNum }),
    prisma.user.count({ where }),
  ]);

  res.json({
    success: true,
    users: users.map((u) => ({ ...u, _id: u.id, password: undefined })),
    total,
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

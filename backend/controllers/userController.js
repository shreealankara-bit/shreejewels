const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');

// ── GET /admin/users ─────────────────────────────────────────────────────────
const getAllUsers = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20, role } = req.query;
  const roles = role ? String(role).split(',').map((v) => v.trim()).filter(Boolean) : [];

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
      include: { _count: { select: { orders: true } } },
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

// ── POST /admin/users ─────────────────────────────────────────────────────────
// Create a new admin or superadmin user
const createAdminUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  if (!name || !email || !password) {
    res.status(400); throw new Error('Name, email, and password are required');
  }

  // Only allow admin and superadmin roles to be created here
  const allowedRoles = ['admin', 'superadmin'];
  if (role && !allowedRoles.includes(role)) {
    res.status(400); throw new Error('Role must be admin or superadmin');
  }

  const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (exists) { res.status(400); throw new Error('A user with this email already exists'); }

  if (password.length < 8) { res.status(400); throw new Error('Password must be at least 8 characters'); }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone || '',
      role: role || 'admin',
      isActive: true,
    },
  });

  res.status(201).json({
    success: true,
    user: { ...user, _id: user.id, password: undefined },
    message: 'Admin user created successfully',
  });
});

// ── PUT /admin/users/:id ──────────────────────────────────────────────────────
// Update admin user details
const updateAdminUser = asyncHandler(async (req, res) => {
  const { name, email, phone, role, isActive, password } = req.body;

  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) { res.status(404); throw new Error('User not found'); }

  // Prevent changing customer to admin here (use dedicated flow)
  const allowedRoles = ['admin', 'superadmin', 'customer'];
  if (role && !allowedRoles.includes(role)) {
    res.status(400); throw new Error('Invalid role');
  }

  // If changing email, check uniqueness
  if (email && email.toLowerCase().trim() !== user.email) {
    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (exists) { res.status(400); throw new Error('Email already in use'); }
  }

  const updateData = {
    ...(name ? { name: name.trim() } : {}),
    ...(email ? { email: email.toLowerCase().trim() } : {}),
    ...(phone !== undefined ? { phone } : {}),
    ...(role ? { role } : {}),
    ...(isActive !== undefined ? { isActive: isActive === true || isActive === 'true' } : {}),
  };

  if (password) {
    if (password.length < 8) { res.status(400); throw new Error('Password must be at least 8 characters'); }
    updateData.password = await bcrypt.hash(password, 12);
  }

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: updateData,
  });

  res.json({
    success: true,
    user: { ...updated, _id: updated.id, password: undefined },
    message: 'User updated successfully',
  });
});

// ── PUT /admin/users/:id/toggle ───────────────────────────────────────────────
const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) { res.status(404); throw new Error('User not found'); }

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive: !user.isActive },
  });

  res.json({ success: true, user: { ...updated, _id: updated.id, password: undefined } });
});

// ── DELETE /admin/users/:id ───────────────────────────────────────────────────
const deleteAdminUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) { res.status(404); throw new Error('User not found'); }

  // Cannot delete yourself
  if (user.id === req.user.id) { res.status(400); throw new Error('You cannot delete your own account'); }

  // Soft delete — deactivate instead of hard delete (preserves order history)
  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });

  res.json({ success: true, message: 'User deactivated successfully', user: { ...updated, _id: updated.id, password: undefined } });
});

module.exports = { getAllUsers, createAdminUser, updateAdminUser, toggleUserStatus, deleteAdminUser };

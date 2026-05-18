const asyncHandler = require('express-async-handler');
const { OAuth2Client } = require('google-auth-library');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { sendTokenResponse } = require('../utils/generateToken');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    res.status(400);
    throw new Error('Google ID token is required');
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const { sub: googleId, email, name, picture } = ticket.getPayload();

  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId }, { email }] },
  });

  if (!user) {
    user = await prisma.user.create({
      data: { name, email, googleId, avatar: picture || '', role: 'customer' },
    });
  } else if (!user.googleId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId, avatar: user.avatar || picture || '' },
    });
  }

  user = await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
  sendTokenResponse(user, 200, res);
});

const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password required');
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.password) {
    res.status(401);
    throw new Error('Invalid credentials');
  }
  if (!user.isActive) {
    res.status(403);
    throw new Error('Account deactivated');
  }
  if (user.role === 'customer') {
    res.status(403);
    throw new Error('Admin access only');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  const updated = await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
  sendTokenResponse(updated, 200, res);
});

const customerLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password required');
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.password) {
    res.status(401);
    throw new Error('Invalid credentials');
  }
  if (!user.isActive) {
    res.status(403);
    throw new Error('Account deactivated');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  const updated = await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
  sendTokenResponse(updated, 200, res);
});

const registerCustomer = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('All fields required');
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    res.status(400);
    throw new Error('Email already registered');
  }

  const hash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, password: hash, role: 'customer' },
  });

  sendTokenResponse(user, 201, res);
});

const getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id || req.user._id } });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const wishlistIds = Array.isArray(user.wishlist) ? user.wishlist : [];
  const wishlistProducts = wishlistIds.length
    ? await prisma.product.findMany({
        where: { id: { in: wishlistIds } },
        select: { id: true, title: true, images: true, price: true, discountPrice: true },
      })
    : [];

  res.json({
    success: true,
    user: {
      ...user,
      _id: user.id,
      wishlist: wishlistProducts.map((p) => ({ ...p, _id: p.id })),
      password: undefined,
    },
  });
});

const logout = asyncHandler(async (req, res) => {
  const sameSite = String(process.env.COOKIE_SAMESITE || 'lax').toLowerCase();
  const normalizedSameSite = ['lax', 'strict', 'none'].includes(sameSite) ? sameSite : 'lax';
  const secureCookie = process.env.NODE_ENV === 'production' || normalizedSameSite === 'none';

  const options = {
    httpOnly: true,
    secure: secureCookie,
    sameSite: normalizedSameSite,
    expires: new Date(0),
    path: '/',
  };

  if (process.env.COOKIE_DOMAIN) {
    options.domain = process.env.COOKIE_DOMAIN;
  }

  res.cookie('token', '', options);
  res.json({ success: true, message: 'Logged out' });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, addresses } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user.id || req.user._id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(addresses !== undefined ? { addresses } : {}),
    },
  });

  res.json({ success: true, user: { ...user, _id: user.id, password: undefined } });
});

module.exports = {
  googleLogin,
  adminLogin,
  customerLogin,
  registerCustomer,
  getMe,
  logout,
  updateProfile,
};

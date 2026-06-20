const asyncHandler = require('express-async-handler');
const { OAuth2Client } = require('google-auth-library');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { generateToken, sendTokenResponse } = require('../utils/generateToken');

const getGoogleCallbackUrl = () =>
  process.env.GOOGLE_CALLBACK_URL || 'https://api.shreealankara.com/api/auth/google/callback';

const getFrontendUrl = () =>
  (process.env.FRONTEND_URL || 'https://shreejewels.vercel.app').replace(/\/+$/, '');

const setAuthCookie = (user, res) => {
  const token = generateToken(user.id || user._id);
  const sameSite = String(process.env.COOKIE_SAMESITE || 'lax').toLowerCase();
  const normalizedSameSite = ['lax', 'strict', 'none'].includes(sameSite) ? sameSite : 'lax';
  const secureCookie = process.env.NODE_ENV === 'production' || normalizedSameSite === 'none';
  const options = {
    httpOnly: true,
    secure: secureCookie,
    sameSite: normalizedSameSite,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  };

  if (process.env.COOKIE_DOMAIN) {
    options.domain = process.env.COOKIE_DOMAIN;
  }

  res.cookie('token', token, options);
};

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const googleOAuthClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  getGoogleCallbackUrl()
);

const findOrCreateGoogleUser = async ({ googleId, email, name, picture }) => {
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

  return prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
};

const startGoogleOAuth = asyncHandler(async (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    res.status(500);
    throw new Error('Google OAuth is not configured');
  }

  const url = googleOAuthClient.generateAuthUrl({
    access_type: 'offline',
    prompt: 'select_account',
    scope: ['openid', 'email', 'profile'],
    redirect_uri: getGoogleCallbackUrl(),
  });

  res.redirect(url);
});

const googleOAuthCallback = asyncHandler(async (req, res) => {
  const { code } = req.query;
  if (!code) {
    res.status(400);
    throw new Error('Google authorization code is required');
  }

  const { tokens } = await googleOAuthClient.getToken({
    code,
    redirect_uri: getGoogleCallbackUrl(),
  });

  if (!tokens.id_token) {
    res.status(400);
    throw new Error('Google ID token was not returned');
  }

  const ticket = await googleOAuthClient.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const { sub: googleId, email, name, picture } = ticket.getPayload();
  const user = await findOrCreateGoogleUser({ googleId, email, name, picture });
  setAuthCookie(user, res);
  res.redirect(`${getFrontendUrl()}/?login=google`);
});

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

  const user = await findOrCreateGoogleUser({ googleId, email, name, picture });
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
  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password) {
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
    data: { name, email, phone, password: hash, role: 'customer' },
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
  startGoogleOAuth,
  googleOAuthCallback,
  googleLogin,
  adminLogin,
  customerLogin,
  registerCustomer,
  getMe,
  logout,
  updateProfile,
};

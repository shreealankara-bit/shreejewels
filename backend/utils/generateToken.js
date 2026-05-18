const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

const resolveSameSite = () => {
  const raw = String(process.env.COOKIE_SAMESITE || 'lax').toLowerCase();
  if (raw === 'strict' || raw === 'none' || raw === 'lax') return raw;
  return 'lax';
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user.id || user._id);
  const sameSite = resolveSameSite();
  const secureCookie = process.env.NODE_ENV === 'production' || sameSite === 'none';

  const options = {
    httpOnly: true,
    secure: secureCookie,
    sameSite,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  };

  if (process.env.COOKIE_DOMAIN) {
    options.domain = process.env.COOKIE_DOMAIN;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      user: {
        _id: user.id || user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        wishlist: user.wishlist || [],
      },
    });
};

module.exports = { generateToken, sendTokenResponse };

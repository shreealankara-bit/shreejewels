const asyncHandler = require('express-async-handler');
const prisma = require('../config/prisma');
const { cloudinary } = require('../config/cloudinary');

// Helper: get or create singleton settings row
const getOrCreateSettings = async () => {
  let settings = await prisma.siteSettings.findFirst();
  if (!settings) {
    settings = await prisma.siteSettings.create({ data: {} });
  }
  return settings;
};

// GET /api/settings  — public (omits SMTP credentials)
const getPublicSettings = asyncHandler(async (req, res) => {
  const s = await getOrCreateSettings();
  const { smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom, ...pub } = s;
  res.json({ success: true, settings: pub });
});

// GET /api/settings/admin  — admin only (full row)
const getAdminSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings();
  res.json({ success: true, settings });
});

// PUT /api/settings/admin  — update settings (text fields)
const updateSettings = asyncHandler(async (req, res) => {
  const {
    siteName, metaTitle, metaDescription, metaKeywords,
    smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom,
    aboutTitle, aboutContent,
  } = req.body;

  const existing = await getOrCreateSettings();

  const updated = await prisma.siteSettings.update({
    where: { id: existing.id },
    data: {
      ...(siteName !== undefined ? { siteName } : {}),
      ...(metaTitle !== undefined ? { metaTitle } : {}),
      ...(metaDescription !== undefined ? { metaDescription } : {}),
      ...(metaKeywords !== undefined ? { metaKeywords } : {}),
      ...(smtpHost !== undefined ? { smtpHost } : {}),
      ...(smtpPort !== undefined ? { smtpPort: Number(smtpPort) } : {}),
      ...(smtpUser !== undefined ? { smtpUser } : {}),
      ...(smtpPass !== undefined ? { smtpPass } : {}),
      ...(smtpFrom !== undefined ? { smtpFrom } : {}),
      ...(aboutTitle !== undefined ? { aboutTitle } : {}),
      ...(aboutContent !== undefined ? { aboutContent } : {}),
    },
  });

  res.json({ success: true, settings: updated });
});

// POST /api/settings/admin/upload-favicon  — upload favicon
const uploadFavicon = asyncHandler(async (req, res) => {
  if (!req.file) { res.status(400); throw new Error('No file uploaded'); }

  const existing = await getOrCreateSettings();

  // Delete old favicon if exists
  if (existing.faviconPublicId) {
    await cloudinary.uploader.destroy(existing.faviconPublicId).catch(() => {});
  }

  const updated = await prisma.siteSettings.update({
    where: { id: existing.id },
    data: {
      faviconUrl: req.file.path,
      faviconPublicId: req.file.filename,
    },
  });

  res.json({ success: true, settings: updated });
});

// POST /api/settings/admin/upload-logo  — upload logo
const uploadLogo = asyncHandler(async (req, res) => {
  if (!req.file) { res.status(400); throw new Error('No file uploaded'); }

  const existing = await getOrCreateSettings();

  if (existing.logoPublicId) {
    await cloudinary.uploader.destroy(existing.logoPublicId).catch(() => {});
  }

  const updated = await prisma.siteSettings.update({
    where: { id: existing.id },
    data: {
      logoUrl: req.file.path,
      logoPublicId: req.file.filename,
    },
  });

  res.json({ success: true, settings: updated });
});

// POST /api/settings/admin/upload-about-image
const uploadAboutImage = asyncHandler(async (req, res) => {
  if (!req.file) { res.status(400); throw new Error('No file uploaded'); }

  const existing = await getOrCreateSettings();

  if (existing.aboutImagePublicId) {
    await cloudinary.uploader.destroy(existing.aboutImagePublicId).catch(() => {});
  }

  const updated = await prisma.siteSettings.update({
    where: { id: existing.id },
    data: {
      aboutImage: req.file.path,
      aboutImagePublicId: req.file.filename,
    },
  });

  res.json({ success: true, settings: updated });
});

module.exports = {
  getPublicSettings,
  getAdminSettings,
  updateSettings,
  uploadFavicon,
  uploadLogo,
  uploadAboutImage,
};

const asyncHandler = require('express-async-handler');
const prisma = require('../config/prisma');
const { cloudinary } = require('../config/cloudinary');

const getBanners = asyncHandler(async (req, res) => {
  const { position } = req.query;

  const now = new Date();
  const banners = await prisma.banner.findMany({
    where: {
      isActive: true,
      ...(position ? { position } : {}),
      OR: [
        { startDate: null, endDate: null },
        { startDate: { lte: now }, endDate: { gte: now } },
        { startDate: null, endDate: { gte: now } },
        { startDate: { lte: now }, endDate: null },
      ],
    },
    orderBy: { order: 'asc' },
  });

  res.json({ success: true, banners: banners.map((b) => ({ ...b, _id: b.id })) });
});

const getAllBanners = asyncHandler(async (req, res) => {
  const banners = await prisma.banner.findMany({ orderBy: { order: 'asc' } });
  res.json({ success: true, banners: banners.map((b) => ({ ...b, _id: b.id })) });
});

const createBanner = asyncHandler(async (req, res) => {
  const { title, subtitle, link, buttonText, position, order, isActive, startDate, endDate, textColor, bgColor } = req.body;
  if (!title || !req.file) { res.status(400); throw new Error('Title and image are required'); }

  const banner = await prisma.banner.create({
    data: {
      title,
      subtitle: subtitle || '',
      link: link || '',
      buttonText: buttonText || 'Shop Now',
      position: position || 'hero',
      order: Number(order) || 0,
      isActive: isActive !== 'false',
      image: req.file.path,
      imagePublicId: req.file.filename,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      textColor: textColor || '#ffffff',
      bgColor: bgColor || '',
    },
  });

  res.status(201).json({ success: true, banner: { ...banner, _id: banner.id } });
});

const updateBanner = asyncHandler(async (req, res) => {
  const banner = await prisma.banner.findUnique({ where: { id: req.params.id } });
  if (!banner) { res.status(404); throw new Error('Banner not found'); }

  if (req.file && banner.imagePublicId) await cloudinary.uploader.destroy(banner.imagePublicId);

  const data = {
    ...(req.body.title !== undefined ? { title: req.body.title } : {}),
    ...(req.body.subtitle !== undefined ? { subtitle: req.body.subtitle } : {}),
    ...(req.body.link !== undefined ? { link: req.body.link } : {}),
    ...(req.body.buttonText !== undefined ? { buttonText: req.body.buttonText } : {}),
    ...(req.body.position !== undefined ? { position: req.body.position } : {}),
    ...(req.body.order !== undefined ? { order: Number(req.body.order) } : {}),
    ...(req.body.isActive !== undefined ? { isActive: req.body.isActive === true || req.body.isActive === 'true' } : {}),
    ...(req.body.startDate !== undefined ? { startDate: req.body.startDate ? new Date(req.body.startDate) : null } : {}),
    ...(req.body.endDate !== undefined ? { endDate: req.body.endDate ? new Date(req.body.endDate) : null } : {}),
    ...(req.body.textColor !== undefined ? { textColor: req.body.textColor } : {}),
    ...(req.body.bgColor !== undefined ? { bgColor: req.body.bgColor } : {}),
    ...(req.file ? { image: req.file.path, imagePublicId: req.file.filename } : {}),
  };

  const updated = await prisma.banner.update({ where: { id: req.params.id }, data });
  res.json({ success: true, banner: { ...updated, _id: updated.id } });
});

const deleteBanner = asyncHandler(async (req, res) => {
  const banner = await prisma.banner.findUnique({ where: { id: req.params.id } });
  if (!banner) { res.status(404); throw new Error('Banner not found'); }

  if (banner.imagePublicId) await cloudinary.uploader.destroy(banner.imagePublicId);
  await prisma.banner.delete({ where: { id: req.params.id } });

  res.json({ success: true, message: 'Banner deleted' });
});

module.exports = { getBanners, getAllBanners, createBanner, updateBanner, deleteBanner };

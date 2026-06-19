const asyncHandler = require('express-async-handler');
const prisma = require('../config/prisma');
const { cloudinary } = require('../config/cloudinary');

// GET /api/testimonials  — public active testimonials
const getActive = asyncHandler(async (req, res) => {
  const testimonials = await prisma.testimonial.findMany({
    where: { isActive: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });
  res.json({ success: true, testimonials });
});

// GET /api/testimonials/admin  — all testimonials (admin)
const getAll = asyncHandler(async (req, res) => {
  const testimonials = await prisma.testimonial.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });
  res.json({ success: true, testimonials });
});

// POST /api/testimonials/admin  — create
const create = asyncHandler(async (req, res) => {
  const { name, location, rating, comment, order, isActive } = req.body;
  if (!name || !comment) { res.status(400); throw new Error('Name and comment are required'); }

  let avatar = '';
  let avatarPublicId = '';
  if (req.file) {
    avatar = req.file.path;
    avatarPublicId = req.file.filename;
  }

  const testimonial = await prisma.testimonial.create({
    data: {
      name,
      location: location || '',
      rating: Number(rating) || 5,
      comment,
      avatar,
      avatarPublicId,
      order: Number(order) || 0,
      isActive: isActive === 'false' ? false : true,
    },
  });

  res.status(201).json({ success: true, testimonial });
});

// PUT /api/testimonials/admin/:id  — update
const update = asyncHandler(async (req, res) => {
  const existing = await prisma.testimonial.findUnique({ where: { id: req.params.id } });
  if (!existing) { res.status(404); throw new Error('Testimonial not found'); }

  let avatar = existing.avatar;
  let avatarPublicId = existing.avatarPublicId;

  if (req.file) {
    if (avatarPublicId) {
      await cloudinary.uploader.destroy(avatarPublicId).catch(() => {});
    }
    avatar = req.file.path;
    avatarPublicId = req.file.filename;
  }

  const { name, location, rating, comment, order, isActive } = req.body;

  const testimonial = await prisma.testimonial.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(location !== undefined ? { location } : {}),
      ...(rating !== undefined ? { rating: Number(rating) } : {}),
      ...(comment !== undefined ? { comment } : {}),
      ...(order !== undefined ? { order: Number(order) } : {}),
      ...(isActive !== undefined ? { isActive: isActive === 'true' || isActive === true } : {}),
      avatar,
      avatarPublicId,
    },
  });

  res.json({ success: true, testimonial });
});

// DELETE /api/testimonials/admin/:id
const remove = asyncHandler(async (req, res) => {
  const existing = await prisma.testimonial.findUnique({ where: { id: req.params.id } });
  if (!existing) { res.status(404); throw new Error('Testimonial not found'); }

  if (existing.avatarPublicId) {
    await cloudinary.uploader.destroy(existing.avatarPublicId).catch(() => {});
  }

  await prisma.testimonial.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Testimonial deleted' });
});

module.exports = { getActive, getAll, create, update, remove };

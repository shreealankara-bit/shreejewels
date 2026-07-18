const asyncHandler = require('express-async-handler');
const prisma = require('../config/prisma');
const { cloudinary } = require('../config/cloudinary');

const slugify = (text) =>
  text.toLowerCase().trim().replace(/[\s_]+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');

const mapCategory = (c) => ({
  ...c,
  _id: c.id,
  parentCategory: c.parentCategory ? { ...c.parentCategory, _id: c.parentCategory.id } : null,
});

// ── GET /categories ─────────────────────────────────────────────────────────
const getCategories = asyncHandler(async (req, res) => {
  const { activeOnly = 'true', flat = 'false' } = req.query;
  const where = activeOnly === 'true' ? { isActive: true } : {};

  if (flat === 'true') {
    const categories = await prisma.category.findMany({
      where,
      include: { parentCategory: { select: { id: true, name: true, slug: true } } },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
    return res.json({ success: true, categories: categories.map(mapCategory) });
  }

  const roots = await prisma.category.findMany({
    where: { ...where, parentCategoryId: null },
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
  });

  const rootIds = roots.map((r) => r.id);
  const subs = await prisma.category.findMany({
    where: { parentCategoryId: { in: rootIds }, ...(activeOnly === 'true' ? { isActive: true } : {}) },
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
  });

  const subMap = new Map();
  for (const s of subs) {
    if (!subMap.has(s.parentCategoryId)) subMap.set(s.parentCategoryId, []);
    subMap.get(s.parentCategoryId).push({ ...s, _id: s.id });
  }

  const categories = roots.map((r) => ({ ...r, _id: r.id, subcategories: subMap.get(r.id) || [] }));
  res.json({ success: true, categories });
});

// ── GET /categories/:slug ────────────────────────────────────────────────────
const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await prisma.category.findUnique({
    where: { slug: req.params.slug },
    include: { parentCategory: { select: { id: true, name: true, slug: true } } },
  });

  if (!category) { res.status(404); throw new Error('Category not found'); }

  const subcategories = await prisma.category.findMany({
    where: { parentCategoryId: category.id, isActive: true },
    orderBy: { order: 'asc' },
  });

  res.json({
    success: true,
    category: mapCategory(category),
    subcategories: subcategories.map((s) => ({ ...s, _id: s.id })),
  });
});

// ── POST /categories/admin ───────────────────────────────────────────────────
const createCategory = asyncHandler(async (req, res) => {
  const {
    name, description, order, isActive,
    metaTitle, metaDescription, metaKeywords,
    // Accept both field names for parent category
    parentCategory, parentCategoryId,
  } = req.body;

  if (!name) { res.status(400); throw new Error('Name is required'); }

  // Resolve parent ID — accept either field name
  const resolvedParentId = parentCategoryId || parentCategory || null;

  // Validate parent exists if provided
  if (resolvedParentId) {
    const parent = await prisma.category.findUnique({ where: { id: resolvedParentId } });
    if (!parent) { res.status(400); throw new Error('Parent category not found'); }
  }

  let slug = slugify(name);
  const exists = await prisma.category.findUnique({ where: { slug } });
  if (exists) slug = `${slug}-${Date.now()}`;

  const category = await prisma.category.create({
    data: {
      name,
      slug,
      description: description || '',
      parentCategoryId: resolvedParentId,
      order: Number(order) || 0,
      isActive: isActive !== false && isActive !== 'false',
      metaTitle: metaTitle || '',
      metaDescription: metaDescription || '',
      metaKeywords: metaKeywords || '',
      image: req.file?.path || '',
      imagePublicId: req.file?.filename || '',
    },
  });

  res.status(201).json({ success: true, category: { ...category, _id: category.id } });
});

// ── PUT /categories/admin/:id ────────────────────────────────────────────────
const updateCategory = asyncHandler(async (req, res) => {
  const existing = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!existing) { res.status(404); throw new Error('Category not found'); }

  if (req.file && existing.imagePublicId) {
    await cloudinary.uploader.destroy(existing.imagePublicId);
  }

  // Resolve parent — accept both field names
  let resolvedParentId = undefined;
  if (req.body.parentCategoryId !== undefined) {
    resolvedParentId = req.body.parentCategoryId || null;
  } else if (req.body.parentCategory !== undefined) {
    resolvedParentId = req.body.parentCategory || null;
  }

  // Prevent circular reference
  if (resolvedParentId && resolvedParentId === req.params.id) {
    res.status(400); throw new Error('A category cannot be its own parent');
  }

  const data = {
    ...(req.body.name !== undefined ? { name: req.body.name, slug: slugify(req.body.name) } : {}),
    ...(req.body.description !== undefined ? { description: req.body.description } : {}),
    ...(resolvedParentId !== undefined ? { parentCategoryId: resolvedParentId } : {}),
    ...(req.body.order !== undefined ? { order: Number(req.body.order) } : {}),
    ...(req.body.isActive !== undefined
      ? { isActive: req.body.isActive === true || req.body.isActive === 'true' }
      : {}),
    ...(req.body.metaTitle !== undefined ? { metaTitle: req.body.metaTitle } : {}),
    ...(req.body.metaDescription !== undefined ? { metaDescription: req.body.metaDescription } : {}),
    ...(req.body.metaKeywords !== undefined ? { metaKeywords: req.body.metaKeywords } : {}),
    ...(req.file ? { image: req.file.path, imagePublicId: req.file.filename } : {}),
  };

  const category = await prisma.category.update({ where: { id: req.params.id }, data });
  res.json({ success: true, category: { ...category, _id: category.id } });
});

// ── DELETE /categories/admin/:id ─────────────────────────────────────────────
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!category) { res.status(404); throw new Error('Category not found'); }

  const productCount = await prisma.product.count({
    where: { OR: [{ categoryId: req.params.id }, { subCategoryId: req.params.id }] },
  });
  if (productCount > 0) {
    res.status(400);
    throw new Error(`Cannot delete: ${productCount} products use this category. Reassign them first.`);
  }

  await prisma.category.deleteMany({ where: { parentCategoryId: req.params.id } });
  if (category.imagePublicId) await cloudinary.uploader.destroy(category.imagePublicId);
  await prisma.category.delete({ where: { id: req.params.id } });

  res.json({ success: true, message: 'Category deleted' });
});

// ── PUT /categories/admin/reorder ────────────────────────────────────────────
const reorderCategories = asyncHandler(async (req, res) => {
  const { items } = req.body;
  await prisma.$transaction(
    items.map(({ id, order }) => prisma.category.update({ where: { id }, data: { order: Number(order) } }))
  );
  res.json({ success: true, message: 'Order updated' });
});

module.exports = { getCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory, reorderCategories };

const asyncHandler = require('express-async-handler');
const prisma = require('../config/prisma');
const { cloudinary } = require('../config/cloudinary');

const slugify = (text) =>
  text.toLowerCase().trim().replace(/[\s_]+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');

const toBool = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return !!value;
};

const mapProduct = (p) => ({
  ...p,
  _id: p.id,
  category: p.category ? { ...p.category, _id: p.category.id } : undefined,
  subCategory: p.subCategory ? { ...p.subCategory, _id: p.subCategory.id } : undefined,
  ratings: {
    average: Number(p.ratingsAverage || 0),
    count: Number(p.ratingsCount || 0),
  },
});

const getProducts = asyncHandler(async (req, res) => {
  const {
    category, subCategory, search, tags, minPrice, maxPrice,
    sort = '-createdAt', page = 1, limit = 20,
    featured, bestseller, newArrival, active = 'true',
  } = req.query;

  const where = {
    ...(active === 'true' ? { isActive: true } : {}),
    ...(category ? { categoryId: category } : {}),
    ...(subCategory ? { subCategoryId: subCategory } : {}),
    ...(featured === 'true' ? { isFeatured: true } : {}),
    ...(bestseller === 'true' ? { isBestseller: true } : {}),
    ...(newArrival === 'true' ? { isNewArrival: true } : {}),
  };

  const allProducts = await prisma.product.findMany({
    where,
    include: {
      category: { select: { id: true, name: true, slug: true } },
      subCategory: { select: { id: true, name: true, slug: true } },
    },
  });

  const searchLower = search ? String(search).toLowerCase() : null;
  const tagList = tags ? String(tags).split(',').map((t) => t.trim().toLowerCase()) : [];
  const min = minPrice ? Number(minPrice) : null;
  const max = maxPrice ? Number(maxPrice) : null;

  const filtered = allProducts.filter((p) => {
    const tagArr = Array.isArray(p.tags) ? p.tags.map((t) => String(t).toLowerCase()) : [];

    if (tagList.length && !tagList.some((t) => tagArr.includes(t))) return false;

    if (searchLower) {
      const hay = `${p.title} ${p.description || ''} ${tagArr.join(' ')}`.toLowerCase();
      if (!hay.includes(searchLower)) return false;
    }

    if (min !== null || max !== null) {
      const effectivePrice = p.discountPrice > 0 ? p.discountPrice : p.price;
      if (min !== null && effectivePrice < min) return false;
      if (max !== null && effectivePrice > max) return false;
    }

    return true;
  });

  const sorters = {
    price_asc: (a, b) => (a.discountPrice > 0 ? a.discountPrice : a.price) - (b.discountPrice > 0 ? b.discountPrice : b.price),
    price_desc: (a, b) => (b.discountPrice > 0 ? b.discountPrice : b.price) - (a.discountPrice > 0 ? a.discountPrice : a.price),
    newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    popular: (a, b) => b.soldCount - a.soldCount,
    rating: (a, b) => b.ratingsAverage - a.ratingsAverage,
    '-createdAt': (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  };

  filtered.sort(sorters[sort] || sorters['-createdAt']);

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const start = (pageNum - 1) * limitNum;
  const paged = filtered.slice(start, start + limitNum);

  res.json({
    success: true,
    products: paged.map(mapProduct),
    pagination: {
      page: pageNum,
      pages: Math.ceil(filtered.length / limitNum),
      total: filtered.length,
      limit: limitNum,
    },
  });
});

const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await prisma.product.findFirst({
    where: { slug: req.params.slug, isActive: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      subCategory: { select: { id: true, name: true, slug: true } },
      reviews: { include: { user: { select: { id: true, name: true, avatar: true } } }, orderBy: { createdAt: 'desc' } },
    },
  });

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const related = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      isActive: true,
    },
    take: 8,
    select: { id: true, title: true, images: true, price: true, discountPrice: true, slug: true, ratingsAverage: true, ratingsCount: true },
  });

  const mapped = mapProduct(product);
  mapped.reviews = product.reviews.map((r) => ({
    _id: r.id,
    user: { _id: r.user.id, name: r.user.name, avatar: r.user.avatar },
    name: r.name,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
  }));

  res.json({ success: true, product: mapped, related: related.map((r) => ({ ...r, _id: r.id, ratings: { average: r.ratingsAverage, count: r.ratingsCount } })) });
});

const createProduct = asyncHandler(async (req, res) => {
  const { title, description, price, discountPrice, category, subCategory, stock, tags, material, weight, sku, isFeatured, isBestseller, isNewArrival, metaTitle, metaDescription, metaKeywords } = req.body;
  if (!title || !price || !category) {
    res.status(400);
    throw new Error('Title, price, and category are required');
  }

  let slug = slugify(title);
  const exists = await prisma.product.findUnique({ where: { slug } });
  if (exists) slug = `${slug}-${Date.now()}`;

  const images = (req.files || []).map((file, i) => ({
    url: file.path,
    publicId: file.filename,
    isDefault: i === 0,
  }));

  const p = Number(price);
  const dp = Number(discountPrice) || 0;
  const discountPercent = dp > 0 && p > 0 ? Math.round(((p - dp) / p) * 100) : 0;

  const product = await prisma.product.create({
    data: {
      title,
      slug,
      description: description || '',
      price: p,
      discountPrice: dp,
      discountPercent,
      categoryId: category,
      subCategoryId: subCategory || null,
      stock: Number(stock) || 0,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim())) : [],
      material: material || '',
      weight: weight || '',
      sku: sku || null,
      images,
      isFeatured: isFeatured === 'true',
      isBestseller: isBestseller === 'true',
      isNewArrival: isNewArrival === 'true',
      metaTitle: metaTitle || '',
      metaDescription: metaDescription || '',
      metaKeywords: metaKeywords || '',
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      subCategory: { select: { id: true, name: true, slug: true } },
    },
  });

  res.status(201).json({ success: true, product: mapProduct(product) });
});

const updateProduct = asyncHandler(async (req, res) => {
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404);
    throw new Error('Product not found');
  }

  let images = Array.isArray(existing.images) ? [...existing.images] : [];
  if (req.files?.length > 0) {
    const newImages = req.files.map((file, i) => ({
      url: file.path,
      publicId: file.filename,
      isDefault: images.length === 0 && i === 0,
    }));
    images.push(...newImages);
  }

  const data = {
    ...(req.body.title !== undefined ? { title: req.body.title, slug: slugify(req.body.title) } : {}),
    ...(req.body.description !== undefined ? { description: req.body.description } : {}),
    ...(req.body.price !== undefined ? { price: Number(req.body.price) } : {}),
    ...(req.body.discountPrice !== undefined ? { discountPrice: Number(req.body.discountPrice) || 0 } : {}),
    ...(req.body.category !== undefined ? { categoryId: req.body.category } : {}),
    ...(req.body.subCategory !== undefined ? { subCategoryId: req.body.subCategory || null } : {}),
    ...(req.body.stock !== undefined ? { stock: Number(req.body.stock) } : {}),
    ...(req.body.material !== undefined ? { material: req.body.material } : {}),
    ...(req.body.weight !== undefined ? { weight: req.body.weight } : {}),
    ...(req.body.sku !== undefined ? { sku: req.body.sku || null } : {}),
    ...(req.body.metaTitle !== undefined ? { metaTitle: req.body.metaTitle } : {}),
    ...(req.body.metaDescription !== undefined ? { metaDescription: req.body.metaDescription } : {}),
    ...(req.body.metaKeywords !== undefined ? { metaKeywords: req.body.metaKeywords } : {}),
    ...(req.body.tags !== undefined ? { tags: Array.isArray(req.body.tags) ? req.body.tags : req.body.tags.split(',').map((t) => t.trim()) } : {}),
    ...(req.body.isFeatured !== undefined ? { isFeatured: toBool(req.body.isFeatured) } : {}),
    ...(req.body.isBestseller !== undefined ? { isBestseller: toBool(req.body.isBestseller) } : {}),
    ...(req.body.isNewArrival !== undefined ? { isNewArrival: toBool(req.body.isNewArrival) } : {}),
    ...(req.body.isActive !== undefined ? { isActive: toBool(req.body.isActive) } : {}),
    ...(req.files?.length ? { images } : {}),
  };

  const finalPrice = data.price !== undefined ? data.price : existing.price;
  const finalDiscount = data.discountPrice !== undefined ? data.discountPrice : existing.discountPrice;
  data.discountPercent = finalDiscount > 0 && finalPrice > 0 ? Math.round(((finalPrice - finalDiscount) / finalPrice) * 100) : 0;

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data,
    include: {
      category: { select: { id: true, name: true, slug: true } },
      subCategory: { select: { id: true, name: true, slug: true } },
    },
  });

  res.json({ success: true, product: mapProduct(product) });
});

const deleteProductImage = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const { publicId } = req.params;
  await cloudinary.uploader.destroy(publicId);

  let images = Array.isArray(product.images) ? product.images.filter((img) => img.publicId !== publicId) : [];
  if (images.length > 0) images[0].isDefault = true;

  const updated = await prisma.product.update({
    where: { id: req.params.id },
    data: { images },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      subCategory: { select: { id: true, name: true, slug: true } },
    },
  });

  res.json({ success: true, product: mapProduct(updated) });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const images = Array.isArray(product.images) ? product.images : [];
  await Promise.all(images.map((img) => cloudinary.uploader.destroy(img.publicId)));

  await prisma.productReview.deleteMany({ where: { productId: req.params.id } });
  await prisma.product.delete({ where: { id: req.params.id } });

  res.json({ success: true, message: 'Product deleted' });
});

const addReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const productId = req.params.id;
  const userId = req.user.id || req.user._id;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const alreadyReviewed = await prisma.productReview.findUnique({ where: { productId_userId: { productId, userId } } });
  if (alreadyReviewed) {
    res.status(400);
    throw new Error('Already reviewed');
  }

  await prisma.productReview.create({
    data: {
      productId,
      userId,
      name: req.user.name,
      rating: Number(rating),
      comment: comment || '',
    },
  });

  const allReviews = await prisma.productReview.findMany({ where: { productId }, select: { rating: true } });
  const ratingsCount = allReviews.length;
  const ratingsAverage = ratingsCount ? allReviews.reduce((sum, r) => sum + r.rating, 0) / ratingsCount : 0;

  await prisma.product.update({
    where: { id: productId },
    data: { ratingsCount, ratingsAverage },
  });

  res.status(201).json({ success: true, message: 'Review added' });
});

const toggleWishlist = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const productId = req.params.id;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const wishlist = Array.isArray(user.wishlist) ? [...user.wishlist] : [];

  const idx = wishlist.findIndex((id) => String(id) === String(productId));
  if (idx === -1) wishlist.push(productId);
  else wishlist.splice(idx, 1);

  const updated = await prisma.user.update({ where: { id: userId }, data: { wishlist } });
  res.json({ success: true, wishlist: updated.wishlist, added: idx === -1 });
});

const getProductStats = asyncHandler(async (req, res) => {
  const [total, active, outOfStock, featured] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { stock: 0, isActive: true } }),
    prisma.product.count({ where: { isFeatured: true } }),
  ]);

  res.json({ success: true, stats: { total, active, outOfStock, featured } });
});

module.exports = {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductImage,
  addReview,
  toggleWishlist,
  getProductStats,
};

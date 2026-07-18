type CategoryLike = {
  _id?: string;
  id?: string;
  name?: string;
  slug?: string;
  subcategories?: CategoryLike[];
};

const normalise = (value = '') => value.toLowerCase().replace(/\s+/g, ' ').trim();

export const getCategoryId = (categories: CategoryLike[], names: string[]) => {
  const wanted = names.map(normalise);
  const stack = [...categories];

  while (stack.length) {
    const category = stack.shift();
    if (!category) continue;
    if (wanted.includes(normalise(category.name))) return category._id || category.id || '';
    if (category.subcategories?.length) stack.push(...category.subcategories);
  }

  return '';
};

export const getCategorySlug = (categories: CategoryLike[], names: string[]) => {
  const wanted = names.map(normalise);
  const stack = [...categories];

  while (stack.length) {
    const category = stack.shift();
    if (!category) continue;
    if (wanted.includes(normalise(category.name))) return category.slug || category._id || category.id || '';
    if (category.subcategories?.length) stack.push(...category.subcategories);
  }

  return '';
};

export const categoryHref = (categories: CategoryLike[], names: string[], fallback = '/products') => {
  const slugOrId = getCategorySlug(categories, names);
  if (!slugOrId) return fallback;
  // If it's a slug (doesn't start with c), use /collections
  return slugOrId.startsWith('c') ? `/products?category=${encodeURIComponent(slugOrId)}` : `/collections/${encodeURIComponent(slugOrId)}`;
};

export const subCategoryHref = (parent: CategoryLike, sub: CategoryLike) => {
  const parentId = parent._id || parent.id || '';
  const subId = sub._id || sub.id || '';
  const params = new URLSearchParams();

  if (parentId) params.set('category', parentId);
  if (subId) params.set('subCategory', subId);

  return `/products?${params.toString()}`;
};


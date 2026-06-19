const toArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

const toLowerArray = (value) => toArray(value).map((item) => String(item).trim().toLowerCase()).filter(Boolean);

const effectivePrice = (product) => (Number(product.discountPrice) > 0 ? Number(product.discountPrice) : Number(product.price));

const productMatchesType = (product, type) => {
  if (type === 'featured') return Boolean(product.isFeatured);
  if (type === 'bestseller') return Boolean(product.isBestseller);
  if (type === 'newArrival') return Boolean(product.isNewArrival);
  return false;
};

const productMatchesCoupon = (product, coupon) => {
  const categories = toArray(coupon.applicableCategories);
  const productTypes = toArray(coupon.applicableProductTypes);
  const productTags = toLowerArray(coupon.applicableProductTags);
  const tags = toLowerArray(product.tags);
  const price = effectivePrice(product);

  if (categories.length) {
    const productCategoryIds = [product.categoryId, product.subCategoryId].filter(Boolean);
    if (!categories.some((id) => productCategoryIds.includes(id))) return false;
  }

  if (productTypes.length && !productTypes.some((type) => productMatchesType(product, type))) return false;
  if (productTags.length && !productTags.some((tag) => tags.includes(tag))) return false;
  if (coupon.minProductPrice !== null && coupon.minProductPrice !== undefined && price < Number(coupon.minProductPrice)) return false;
  if (coupon.maxProductPrice !== null && coupon.maxProductPrice !== undefined && price > Number(coupon.maxProductPrice)) return false;

  return true;
};

const calculateCouponDiscount = ({ coupon, subtotal, products = [], userId }) => {
  const now = new Date();
  const usedBy = toArray(coupon.usedBy);

  if (coupon.expiry < now) throw new Error('Coupon has expired');
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new Error('Coupon usage limit reached');
  if (userId && usedBy.includes(userId)) throw new Error('You have already used this coupon');
  if (Number(subtotal) < Number(coupon.minOrderAmount || 0)) throw new Error(`Minimum order amount is ₹${coupon.minOrderAmount}`);

  const hasProductRules =
    toArray(coupon.applicableCategories).length > 0 ||
    toArray(coupon.applicableProductTypes).length > 0 ||
    toArray(coupon.applicableProductTags).length > 0 ||
    coupon.minProductPrice !== null && coupon.minProductPrice !== undefined ||
    coupon.maxProductPrice !== null && coupon.maxProductPrice !== undefined;

  const applicableSubtotal = hasProductRules
    ? products.reduce((sum, item) => {
      if (!productMatchesCoupon(item.product, coupon)) return sum;
      return sum + effectivePrice(item.product) * Number(item.quantity || 1);
    }, 0)
    : Number(subtotal);

  if (hasProductRules && applicableSubtotal <= 0) {
    throw new Error('Coupon is not applicable to the selected products');
  }

  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = Math.round((applicableSubtotal * Number(coupon.value)) / 100);
    if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount));
  } else {
    discount = Number(coupon.value);
  }

  discount = Math.max(0, Math.min(discount, applicableSubtotal, Number(subtotal)));

  return {
    discount,
    applicableSubtotal,
    finalAmount: Number(subtotal) - discount,
  };
};

module.exports = {
  calculateCouponDiscount,
  productMatchesCoupon,
};

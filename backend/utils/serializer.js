const withMongoId = (record) => {
  if (!record) return record;
  const cloned = { ...record, _id: record.id };
  return cloned;
};

const serializeCategory = (category) => withMongoId(category);

const serializeProduct = (product) => {
  const p = withMongoId(product);
  if (!p) return p;
  return {
    ...p,
    category: p.category ? withMongoId(p.category) : p.category,
    subCategory: p.subCategory ? withMongoId(p.subCategory) : p.subCategory,
    ratings: {
      average: Number(p.ratingsAverage || 0),
      count: Number(p.ratingsCount || 0),
    },
  };
};

const serializeUser = (user) => withMongoId(user);
const serializeOrder = (order) => ({ ...withMongoId(order), user: order.user ? withMongoId(order.user) : order.user });
const serializeBanner = (banner) => withMongoId(banner);
const serializeCoupon = (coupon) => withMongoId(coupon);

module.exports = {
  withMongoId,
  serializeCategory,
  serializeProduct,
  serializeUser,
  serializeOrder,
  serializeBanner,
  serializeCoupon,
};

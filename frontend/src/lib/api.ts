import axios from 'axios';

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const resolveApiUrl = () => {
  if (typeof window === 'undefined') return RAW_API_URL;
  const isLocalhostHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  if (!isLocalhostHost && /^https?:\/\/localhost(:\d+)?/i.test(RAW_API_URL)) {
    return '/api';
  }
  return RAW_API_URL;
};

const api = axios.create({
  baseURL: resolveApiUrl(),
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    // Removed aggressive global redirect on 401. 
    // Individual components will handle their own auth redirects if necessary.
    return Promise.reject(error);
  }
);

// In-memory cache for GET requests to make navigation instant
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds cache to keep it extremely fresh but snappy

const originalGet = api.get;
const originalPost = api.post;
const originalPut = api.put;
const originalDelete = api.delete;

(api as any).get = function (url: string, config?: any) {
  // Only cache on client side
  if (typeof window !== 'undefined') {
    const key = `${url}?${config?.params ? JSON.stringify(config.params) : ''}`;
    const cached = cache.get(key);
    const now = Date.now();
    if (cached && now - cached.timestamp < CACHE_TTL) {
      return Promise.resolve(cached.data);
    }
    return originalGet.call(this, url, config).then((res) => {
      cache.set(key, { data: res, timestamp: Date.now() });
      return res;
    });
  }
  return originalGet.call(this, url, config);
};

(api as any).post = function (url: string, data?: any, config?: any) {
  if (typeof window !== 'undefined') cache.clear();
  return originalPost.call(this, url, data, config);
};

(api as any).put = function (url: string, data?: any, config?: any) {
  if (typeof window !== 'undefined') cache.clear();
  return originalPut.call(this, url, data, config);
};

(api as any).delete = function (url: string, config?: any) {
  if (typeof window !== 'undefined') cache.clear();
  return originalDelete.call(this, url, config);
};

export default api;


// ===================== AUTH =====================
export const authAPI = {
  googleLogin: (idToken: string) => api.post('/auth/google', { idToken }),
  adminLogin: (email: string, password: string) => api.post('/auth/login', { email, password }),
  login: (email: string, password: string) => api.post('/auth/login/customer', { email, password }),
  register: (name: string, email: string, password: string) => api.post('/auth/register', { name, email, password }),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  updateProfile: (data: object) => api.put('/auth/profile', data),
};

// ===================== PRODUCTS =====================
export const productAPI = {
  getAll: (params?: object) => api.get('/products', { params }),
  getBySlug: (slug: string) => api.get(`/products/${slug}`),
  toggleWishlist: (id: string) => api.post(`/products/${id}/wishlist`),
  addReview: (id: string, data: object) => api.post(`/products/${id}/reviews`, data),
  // Admin
  create: (formData: FormData) => api.post('/products/admin/create', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, formData: FormData) => api.put(`/products/admin/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) => api.delete(`/products/admin/${id}`),
  deleteImage: (id: string, publicId: string) => api.delete(`/products/admin/${id}/images/${publicId}`),
  getStats: () => api.get('/products/admin/stats'),
};

// ===================== CATEGORIES =====================
export const categoryAPI = {
  getAll: (params?: object) => api.get('/categories', { params }),
  getBySlug: (slug: string) => api.get(`/categories/${slug}`),
  // Admin
  create: (formData: FormData) => api.post('/categories/admin', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, formData: FormData) => api.put(`/categories/admin/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) => api.delete(`/categories/admin/${id}`),
  reorder: (items: { id: string; order: number }[]) => api.put('/categories/admin/reorder', { items }),
};

// ===================== ORDERS =====================
export const orderAPI = {
  createPayment: (data: object) => api.post('/orders/create-payment', data),
  verifyPayment: (data: object) => api.post('/orders/verify-payment', data),
  getMyOrders: (params?: object) => api.get('/orders/my', { params }),
  getOrder: (id: string) => api.get(`/orders/${id}`),
  // Admin
  getAllOrders: (params?: object) => api.get('/orders/admin/all', { params }),
  updateOrder: (id: string, data: object) => api.put(`/orders/admin/${id}`, data),
  getStats: () => api.get('/orders/admin/stats'),
};

// ===================== COUPONS =====================
export const couponAPI = {
  validate: (code: string, subtotal: number, items?: { productId: string; quantity: number }[]) => api.post('/coupons/validate', { code, subtotal, items }),
  // Admin
  getAll: () => api.get('/coupons/admin'),
  create: (data: object) => api.post('/coupons/admin', data),
  update: (id: string, data: object) => api.put(`/coupons/admin/${id}`, data),
  delete: (id: string) => api.delete(`/coupons/admin/${id}`),
};

// ===================== BANNERS =====================
export const bannerAPI = {
  getActive: (position?: string) => api.get('/banners', { params: { position } }),
  // Admin
  getAll: () => api.get('/banners/admin'),
  create: (formData: FormData) => api.post('/banners/admin', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, formData: FormData) => api.put(`/banners/admin/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) => api.delete(`/banners/admin/${id}`),
};

// ===================== SITE SETTINGS =====================
export const settingsAPI = {
  getPublic: () => api.get('/settings'),
  getAdmin: () => api.get('/settings/admin'),
  update: (data: object) => api.put('/settings/admin', data),
  uploadFavicon: (formData: FormData) => api.post('/settings/admin/upload-favicon', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadLogo: (formData: FormData) => api.post('/settings/admin/upload-logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadAboutImage: (formData: FormData) => api.post('/settings/admin/upload-about-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// ===================== TESTIMONIALS =====================
export const testimonialAPI = {
  getActive: () => api.get('/testimonials'),
  // Admin
  getAll: () => api.get('/testimonials/admin'),
  create: (formData: FormData) => api.post('/testimonials/admin', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, formData: FormData) => api.put(`/testimonials/admin/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) => api.delete(`/testimonials/admin/${id}`),
};

// ===================== MISSING ORDERS =====================
export const missingOrderAPI = {
  save: (data: object) => api.post('/missing-orders', data),
  // Admin
  getAll: (params?: object) => api.get('/missing-orders/admin', { params }),
  delete: (id: string) => api.delete(`/missing-orders/admin/${id}`),
};

// ===================== ADMIN CUSTOMERS =====================
export const adminCustomerAPI = {
  getAll: (params?: object) => api.get('/admin/users', { params }),
};

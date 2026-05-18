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
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

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
  validate: (code: string, subtotal: number) => api.post('/coupons/validate', { code, subtotal }),
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

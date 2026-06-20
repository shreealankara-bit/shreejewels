'use client';
import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X, Search, Upload, Filter } from 'lucide-react';
import { productAPI, categoryAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface Product {
  _id: string;
  title: string;
  price: number;
  discountPrice: number;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  isNewArrival: boolean;
  images: { url: string }[];
  category: { name: string } | null;
  subCategory: { name: string } | null;
}

const EMPTY_FORM = {
  title: '', description: '', price: '', discountPrice: '', stock: '',
  category: '', subCategory: '', tags: '', material: '', weight: '', sku: '',
  isFeatured: false, isBestseller: false, isNewArrival: false, isActive: true,
  metaTitle: '', metaDescription: '', metaKeywords: '',
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      // Admin needs to see ALL products (active + hidden) — pass no active filter
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      // filterActive: '' = all, 'true' = only active, 'false' = only hidden
      if (filterActive !== '') params.active = filterActive;
      const res = await productAPI.getAll(params);
      setProducts(res.data.products || []);
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, [page, search, filterActive]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    categoryAPI.getAll({ activeOnly: 'false', flat: 'true' })
      .then(res => setCategories(res.data.categories || []))
      .catch(() => {});
  }, []);

  // Update subcategories when parent category changes
  useEffect(() => {
    if (form.category) {
      const subs = categories.filter((c: any) => c.parentCategory?._id === form.category || c.parentCategory === form.category);
      setSubCategories(subs);
    } else {
      setSubCategories([]);
    }
  }, [form.category, categories]);

  const openCreate = () => {
    setEditProduct(null);
    setForm(EMPTY_FORM);
    setImageFiles([]);
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditProduct(product);
    setForm({
      title: product.title,
      description: '',
      price: product.price.toString(),
      discountPrice: product.discountPrice.toString(),
      stock: product.stock.toString(),
      category: (product.category as any)?._id || '',
      subCategory: (product.subCategory as any)?._id || '',
      tags: '',
      material: '',
      weight: '',
      sku: '',
      isFeatured: product.isFeatured,
      isBestseller: product.isBestseller,
      isNewArrival: product.isNewArrival,
      isActive: product.isActive,
      metaTitle: (product as any).metaTitle || '',
      metaDescription: (product as any).metaDescription || '',
      metaKeywords: (product as any).metaKeywords || '',
    });
    setImageFiles([]);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.price || !form.category) { toast.error('Title, price, and category are required'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v.toString()));
      imageFiles.forEach(f => fd.append('images', f));

      if (editProduct) {
        await productAPI.update(editProduct._id, fd);
        toast.success('Product updated');
      } else {
        await productAPI.create(fd);
        toast.success('Product created');
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    // Optimistically remove from UI immediately
    setProducts(prev => prev.filter(p => p._id !== id));
    setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
    setDeleteId(null);
    try {
      await productAPI.delete(id);
      toast.success('Product deleted');
      // Refresh from server to get accurate count/pagination
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Delete failed');
      // Revert on failure
      fetchProducts();
    }
  };

  const topCategories = categories.filter((c: any) => !c.parentCategory);

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-display text-charcoal-900">Products</h1>
          <p className="text-sm text-charcoal-500 mt-0.5">{pagination.total} total products</p>
        </div>
        <button onClick={openCreate} id="create-product-btn" className="flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-white text-sm font-medium px-4 py-2.5 transition-colors">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-charcoal-100 text-charcoal-900 text-sm pl-9 pr-4 py-2.5 focus:outline-none focus:border-gold-400 placeholder-charcoal-400"
          />
        </div>
      </div>

      {/* MOBILE: Card list */}
      <div className="sm:hidden space-y-2 mb-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white border border-charcoal-100 p-3 flex gap-3 animate-pulse">
              <div className="w-14 h-16 bg-cream-100 flex-shrink-0 rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-cream-100 rounded w-3/4" />
                <div className="h-3 bg-cream-100 rounded w-1/2" />
                <div className="h-3 bg-cream-100 rounded w-1/3" />
              </div>
            </div>
          ))
        ) : products.length === 0 ? (
          <div className="text-center py-10 text-charcoal-500 bg-white border border-charcoal-100">
            No products found.
            <button onClick={openCreate} className="block mx-auto text-gold-500 mt-2">+ Add first product</button>
          </div>
        ) : products.map(product => (
          <div key={product._id} className="bg-white border border-charcoal-100 p-3 flex gap-3">
            <div className="relative w-14 h-16 flex-shrink-0 bg-cream-50 rounded overflow-hidden">
              {product.images[0] && <Image src={product.images[0].url} alt={product.title} fill className="object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-charcoal-900 line-clamp-1">{product.title}</p>
              <p className="text-xs text-charcoal-500">{product.category?.name || '—'}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-semibold text-gold-500">₹{(product.discountPrice || product.price).toLocaleString()}</span>
                <span className={`text-xs ${product.stock === 0 ? 'text-red-400' : product.stock <= 5 ? 'text-yellow-500' : 'text-green-500'}`}>
                  Stock: {product.stock}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 ${product.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                  {product.isActive ? 'Active' : 'Hidden'}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1 flex-shrink-0">
              <button onClick={() => openEdit(product)} className="p-2 text-charcoal-500 hover:text-charcoal-900 hover:bg-charcoal-50 rounded transition-colors">
                <Pencil size={15} />
              </button>
              <button onClick={() => setDeleteId(product._id)} className="p-2 text-charcoal-500 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* DESKTOP: Table */}
      <div className="hidden sm:block bg-white border border-charcoal-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[850px]">
            <thead className="bg-cream-50 border-b border-charcoal-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs text-charcoal-500 uppercase tracking-wider">Product</th>
                <th className="text-left px-4 py-3 text-xs text-charcoal-500 uppercase tracking-wider">Category</th>
                <th className="text-left px-4 py-3 text-xs text-charcoal-500 uppercase tracking-wider">Price</th>
                <th className="text-left px-4 py-3 text-xs text-charcoal-500 uppercase tracking-wider">Stock</th>
                <th className="text-left px-4 py-3 text-xs text-charcoal-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs text-charcoal-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-4 bg-cream-100 rounded w-3/4" /></td>
                    {Array.from({ length: 5 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-cream-100 rounded w-2/3" /></td>)}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-charcoal-500">No products found. <button onClick={openCreate} className="text-gold-400 hover:underline">Add one →</button></td></tr>
              ) : (
                products.map(product => (
                  <tr key={product._id} className="hover:bg-cream-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-12 flex-shrink-0 bg-cream-50">
                          {product.images[0] && <Image src={product.images[0].url} alt={product.title} fill className="object-cover" />}
                        </div>
                        <div>
                          <p className="text-charcoal-900 font-medium line-clamp-1">{product.title}</p>
                          <div className="flex gap-1 mt-0.5">
                            {product.isFeatured && <span className="text-[10px] bg-gold-100 text-gold-600 px-1.5 py-0.5">Featured</span>}
                            {product.isBestseller && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5">Bestseller</span>}
                            {product.isNewArrival && <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5">New</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-charcoal-600">{product.category?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <p className="text-gold-500 font-semibold">₹{(product.discountPrice || product.price).toLocaleString()}</p>
                      {product.discountPrice > 0 && <p className="text-xs text-charcoal-400 line-through">₹{product.price.toLocaleString()}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${product.stock === 0 ? 'text-red-400' : product.stock <= 5 ? 'text-yellow-500' : 'text-green-500'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs px-2 py-0.5 ${product.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                        {product.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(product)} id={`edit-${product._id}`} className="p-1.5 text-charcoal-500 hover:text-charcoal-900 hover:bg-charcoal-50 rounded transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteId(product._id)} id={`delete-${product._id}`} className="p-1.5 text-charcoal-500 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center gap-1 p-4 border-t border-charcoal-100">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 text-xs transition-colors ${p === page ? 'bg-gold-500 text-white' : 'bg-cream-50 text-charcoal-600 hover:bg-charcoal-50'}`}>{p}</button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile pagination */}
      {pagination.pages > 1 && (
        <div className="sm:hidden flex justify-center gap-1 mt-3">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 text-xs rounded transition-colors ${p === page ? 'bg-gold-500 text-white' : 'bg-white border border-charcoal-100 text-charcoal-600'}`}>{p}</button>
          ))}
        </div>
      )}

      {/* Product Modal */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50" onClick={() => setModalOpen(false)} />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="fixed inset-0 sm:inset-4 md:inset-8 lg:inset-12 bg-white border border-charcoal-100 z-50 flex flex-col overflow-hidden sm:rounded-sm"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200">
                <h2 className="text-lg font-display text-charcoal-900">{editProduct ? 'Edit Product' : 'Add New Product'}</h2>
                <button onClick={() => setModalOpen(false)} className="text-charcoal-600 hover:text-charcoal-900"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left col */}
                <div className="space-y-4">
                  {[
                    { label: 'Title *', key: 'title', type: 'text' },
                    { label: 'Price (₹) *', key: 'price', type: 'number' },
                    { label: 'Discount Price (₹)', key: 'discountPrice', type: 'number' },
                    { label: 'Stock *', key: 'stock', type: 'number' },
                    { label: 'SKU', key: 'sku', type: 'text' },
                    { label: 'Tags (comma separated)', key: 'tags', type: 'text' },
                  ].map(({ label, key, type }) => (
                    <div key={key}>
                      <label className="block text-xs text-charcoal-600 mb-1.5 uppercase tracking-wide">{label}</label>
                      <input
                        type={type}
                        value={form[key as keyof typeof form] as string}
                        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                        className="w-full bg-cream-50 border border-cream-200 text-charcoal-900 text-sm px-3 py-2.5 focus:outline-none focus:border-gold-400 placeholder-charcoal-500"
                      />
                    </div>
                  ))}

                  {/* Category selects */}
                  <div>
                    <label className="block text-xs text-charcoal-600 mb-1.5 uppercase tracking-wide">Category *</label>
                    <select
                      value={form.category}
                      onChange={e => setForm(p => ({ ...p, category: e.target.value, subCategory: '' }))}
                      className="w-full bg-cream-50 border border-cream-200 text-charcoal-900 text-sm px-3 py-2.5 focus:outline-none focus:border-gold-400"
                    >
                      <option value="">Select category</option>
                      {topCategories.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>

                  {subCategories.length > 0 && (
                    <div>
                      <label className="block text-xs text-charcoal-600 mb-1.5 uppercase tracking-wide">Sub Category</label>
                      <select
                        value={form.subCategory}
                        onChange={e => setForm(p => ({ ...p, subCategory: e.target.value }))}
                        className="w-full bg-cream-50 border border-cream-200 text-charcoal-900 text-sm px-3 py-2.5 focus:outline-none focus:border-gold-400"
                      >
                        <option value="">Select sub-category</option>
                        {subCategories.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                {/* Right col */}
                <div className="space-y-4">
                  {/* Description */}
                  <div>
                    <label className="block text-xs text-charcoal-600 mb-1.5 uppercase tracking-wide">Description</label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                      rows={4}
                      className="w-full bg-cream-50 border border-cream-200 text-charcoal-900 text-sm px-3 py-2.5 focus:outline-none focus:border-gold-400 placeholder-charcoal-500 resize-none"
                      placeholder="Product description..."
                    />
                  </div>

                  {/* Images */}
                  <div>
                    <label className="block text-xs text-charcoal-600 mb-1.5 uppercase tracking-wide">
                      Product Images — 1st image = main, 2nd image = hover
                    </label>

                    {/* Existing images when editing */}
                    {editProduct && editProduct.images.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-charcoal-500 mb-1.5">Current images (new uploads will be appended):</p>
                        <div className="flex gap-2 flex-wrap">
                          {editProduct.images.map((img, i) => (
                            <div key={i} className="relative w-14 h-16 border border-cream-200">
                              <Image src={img.url} alt="" fill className="object-cover" />
                              {i === 0 && (
                                <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] bg-gold-500 text-white py-0.5">Main</span>
                              )}
                              {i === 1 && (
                                <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] bg-charcoal-700 text-white py-0.5">Hover</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* New file selection */}
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-cream-200 hover:border-gold-500 p-5 cursor-pointer transition-colors">
                      <Upload size={22} className="text-charcoal-500 mb-2" />
                      <span className="text-sm text-charcoal-500">Click to upload images</span>
                      <span className="text-xs text-charcoal-600 mt-1">JPG, PNG, WebP • Max 5MB each • Multiple allowed</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={e => setImageFiles(Array.from(e.target.files || []))}
                      />
                    </label>

                    {/* Preview selected files */}
                    {imageFiles.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-charcoal-500 mb-2">{imageFiles.length} new image(s) selected:</p>
                        <div className="flex gap-2 flex-wrap">
                          {imageFiles.map((file, i) => (
                            <div key={i} className="relative w-14 h-16 border border-cream-200 group/img">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`preview-${i}`}
                                className="w-full h-full object-cover"
                              />
                              {i === 0 && (
                                <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] bg-gold-500 text-white py-0.5">Main</span>
                              )}
                              {i === 1 && (
                                <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] bg-charcoal-700 text-white py-0.5">Hover</span>
                              )}
                              <button
                                type="button"
                                onClick={() => setImageFiles(prev => prev.filter((_, fi) => fi !== i))}
                                className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SEO Meta Fields */}
                  <div className="border-t border-cream-200 pt-4 space-y-4">
                    <p className="text-xs font-semibold text-charcoal-500 uppercase tracking-widest">SEO Meta (Product Level)</p>
                    {[
                      { label: 'Meta Title', key: 'metaTitle', placeholder: 'SEO title for this product' },
                      { label: 'Meta Description', key: 'metaDescription', placeholder: 'SEO description for this product' },
                      { label: 'Meta Keywords (comma separated)', key: 'metaKeywords', placeholder: 'gold ring, diamond, jewellery' },
                    ].map(({ label, key, placeholder }) => (
                      <div key={key}>
                        <label className="block text-xs text-charcoal-600 mb-1.5 uppercase tracking-wide">{label}</label>
                        <input
                          type="text"
                          value={form[key as keyof typeof form] as string}
                          onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="w-full bg-cream-50 border border-cream-200 text-charcoal-900 text-sm px-3 py-2.5 focus:outline-none focus:border-gold-400 placeholder-charcoal-400"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Checkboxes */}
                  <div className="space-y-2 pt-2">
                    {[
                      { key: 'isFeatured', label: 'Featured Product' },
                      { key: 'isBestseller', label: 'Bestseller' },
                      { key: 'isNewArrival', label: 'New Arrival' },
                      { key: 'isActive', label: 'Active (Visible on site)' },
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form[key as keyof typeof form] as boolean}
                          onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))}
                          className="w-4 h-4 accent-gold-500"
                        />
                        <span className="text-sm text-charcoal-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-cream-200 flex gap-3 justify-end">
                <button onClick={() => setModalOpen(false)} className="px-5 py-2.5 text-sm text-charcoal-600 hover:text-charcoal-900 border border-cream-200 hover:border-charcoal-600 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} id="save-product-btn" className="px-6 py-2.5 text-sm bg-gold-500 hover:bg-gold-600 text-white font-medium transition-colors disabled:opacity-50">
                  {saving ? 'Saving...' : editProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteId && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50" onClick={() => setDeleteId(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-cream-200 p-6 z-50 w-80"
            >
              <h3 className="text-charcoal-900 font-semibold mb-2">Delete Product?</h3>
              <p className="text-sm text-charcoal-600 mb-5">This will permanently delete this product and all its images.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 text-sm border border-cream-200 text-charcoal-600 hover:text-charcoal-900 transition-colors">Cancel</button>
                <button onClick={() => handleDelete(deleteId)} id="confirm-delete-btn" className="flex-1 py-2.5 text-sm bg-red-600 hover:bg-red-700 text-white font-medium transition-colors">Delete</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

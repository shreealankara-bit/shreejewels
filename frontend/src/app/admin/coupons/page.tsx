'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { categoryAPI, couponAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const PRODUCT_TYPES = [
  { value: 'featured', label: 'Featured Products' },
  { value: 'bestseller', label: 'Best Sellers' },
  { value: 'newArrival', label: 'New Arrivals' },
];

const EMPTY_FORM = {
  code: '',
  description: '',
  discountType: 'percentage',
  value: '',
  minOrderAmount: '',
  maxDiscount: '',
  expiry: '',
  usageLimit: '',
  isActive: true,
  applicableCategories: [] as string[],
  applicableProductTypes: [] as string[],
  applicableProductTags: '',
  minProductPrice: '',
  maxProductPrice: '',
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCoupon, setEditCoupon] = useState<any>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try { const res = await couponAPI.getAll(); setCoupons(res.data.coupons || []); }
    catch { toast.error('Failed to load coupons'); }
    finally { setLoading(false); }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await categoryAPI.getAll({ activeOnly: 'false', flat: 'true' });
      setCategories(res.data.categories || []);
    } catch {
      toast.error('Failed to load categories');
    }
  }, []);

  useEffect(() => { fetchCoupons(); fetchCategories(); }, [fetchCoupons, fetchCategories]);

  const openCreate = () => { setEditCoupon(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (c: any) => {
    setEditCoupon(c);
    setForm({
      code: c.code,
      description: c.description || '',
      discountType: c.discountType,
      value: c.value.toString(),
      minOrderAmount: c.minOrderAmount.toString(),
      maxDiscount: c.maxDiscount?.toString() || '',
      expiry: c.expiry?.slice(0, 10) || '',
      usageLimit: c.usageLimit?.toString() || '',
      isActive: c.isActive,
      applicableCategories: Array.isArray(c.applicableCategories) ? c.applicableCategories : [],
      applicableProductTypes: Array.isArray(c.applicableProductTypes) ? c.applicableProductTypes : [],
      applicableProductTags: Array.isArray(c.applicableProductTags) ? c.applicableProductTags.join(', ') : '',
      minProductPrice: c.minProductPrice?.toString() || '',
      maxProductPrice: c.maxProductPrice?.toString() || '',
    });
    setModalOpen(true);
  };

  const toggleArrayValue = (field: 'applicableCategories' | 'applicableProductTypes', value: string) => {
    setForm(p => {
      const current = p[field];
      return {
        ...p,
        [field]: current.includes(value) ? current.filter(item => item !== value) : [...current, value],
      };
    });
  };

  const targetSummary = (c: any) => {
    const parts = [];
    if (Array.isArray(c.applicableCategories) && c.applicableCategories.length) parts.push(`${c.applicableCategories.length} categories`);
    if (Array.isArray(c.applicableProductTypes) && c.applicableProductTypes.length) parts.push(`${c.applicableProductTypes.length} product types`);
    if (Array.isArray(c.applicableProductTags) && c.applicableProductTags.length) parts.push(`${c.applicableProductTags.length} tags`);
    if (c.minProductPrice || c.maxProductPrice) parts.push(`₹${c.minProductPrice || 0}–${c.maxProductPrice || 'any'}`);
    return parts.length ? parts.join(', ') : 'All products';
  };

  const handleSave = async () => {
    if (!form.code || !form.discountType || !form.value || !form.expiry) { toast.error('Code, type, value, and expiry are required'); return; }
    setSaving(true);
    try {
      const data = {
        ...form,
        value: Number(form.value),
        minOrderAmount: Number(form.minOrderAmount) || 0,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        applicableProductTags: form.applicableProductTags.split(',').map(tag => tag.trim()).filter(Boolean),
        minProductPrice: form.minProductPrice ? Number(form.minProductPrice) : null,
        maxProductPrice: form.maxProductPrice ? Number(form.maxProductPrice) : null,
      };
      if (editCoupon) { await couponAPI.update(editCoupon._id, data); toast.success('Coupon updated'); }
      else { await couponAPI.create(data); toast.success('Coupon created'); }
      setModalOpen(false);
      fetchCoupons();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try { await couponAPI.delete(id); toast.success('Coupon deleted'); fetchCoupons(); }
    catch { toast.error('Delete failed'); }
    finally { setDeleteId(null); }
  };

  const toggleActive = async (c: any) => {
    try { await couponAPI.update(c._id, { isActive: !c.isActive }); fetchCoupons(); }
    catch { toast.error('Failed'); }
  };

  const isExpired = (expiry: string) => new Date(expiry) < new Date();

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-display text-charcoal-900">Promo Codes</h1>
          <p className="text-sm text-charcoal-500 mt-0.5">{coupons.length} coupons</p>
        </div>
        <button onClick={openCreate} id="create-coupon-btn" className="flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-white text-sm font-medium px-4 py-2.5 transition-colors">
          <Plus size={16} /> Add Coupon
        </button>
      </div>

      <div className="bg-white border border-cream-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[750px]">
          <thead className="bg-cream-50 border-b border-cream-200">
            <tr>
              {['Code', 'Type', 'Value', 'Applies To', 'Min Order', 'Used', 'Expiry', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-charcoal-600 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-charcoal-800">
            {loading ? Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="animate-pulse"><td colSpan={9} className="px-4 py-4"><div className="h-4 bg-cream-50 rounded w-full" /></td></tr>
            )) : coupons.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-12 text-charcoal-500">No coupons yet</td></tr>
            ) : coupons.map(c => (
              <tr key={c._id} className="hover:bg-cream-50/50 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-mono font-bold text-gold-400 tracking-widest">{c.code}</span>
                  {c.description && <p className="text-xs text-charcoal-500 mt-0.5">{c.description}</p>}
                </td>
                <td className="px-4 py-3 capitalize text-charcoal-600">{c.discountType}</td>
                <td className="px-4 py-3 text-charcoal-900">{c.discountType === 'percentage' ? `${c.value}%` : `₹${c.value}`}</td>
                <td className="px-4 py-3 text-charcoal-600 max-w-44">
                  <span className="line-clamp-2">{targetSummary(c)}</span>
                </td>
                <td className="px-4 py-3 text-charcoal-600">₹{c.minOrderAmount}</td>
                <td className="px-4 py-3 text-charcoal-600">{c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ''}</td>
                <td className="px-4 py-3">
                  <span className={`text-sm ${isExpired(c.expiry) ? 'text-red-400' : 'text-charcoal-700'}`}>
                    {new Date(c.expiry).toLocaleDateString('en-IN')}
                    {isExpired(c.expiry) && <span className="text-xs text-red-400 ml-1">(Expired)</span>}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(c)} className={`text-sm ${c.isActive && !isExpired(c.expiry) ? 'text-green-400' : 'text-charcoal-600'}`}>
                    {c.isActive && !isExpired(c.expiry) ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(c)} className="p-1.5 text-charcoal-600 hover:text-charcoal-900 hover:bg-charcoal-700 transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => setDeleteId(c._id)} className="p-1.5 text-charcoal-600 hover:text-red-400 hover:bg-charcoal-700 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-50" onClick={() => setModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-cream-200 z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-display text-charcoal-900">{editCoupon ? 'Edit Coupon' : 'Create Coupon'}</h2>
                <button onClick={() => setModalOpen(false)} className="text-charcoal-600 hover:text-charcoal-900"><X size={18} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-charcoal-600 mb-1.5 uppercase tracking-wide">Code *</label>
                  <input type="text" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} disabled={!!editCoupon}
                    className="w-full bg-cream-50 border border-cream-200 text-charcoal-900 text-sm px-3 py-2.5 focus:outline-none focus:border-gold-400 uppercase tracking-widest font-mono disabled:opacity-50" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-charcoal-600 mb-1.5 uppercase tracking-wide">Type *</label>
                    <select value={form.discountType} onChange={e => setForm(p => ({ ...p, discountType: e.target.value }))}
                      className="w-full bg-cream-50 border border-cream-200 text-charcoal-900 text-sm px-3 py-2.5 focus:outline-none focus:border-gold-400">
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-charcoal-600 mb-1.5 uppercase tracking-wide">Value *</label>
                    <input type="number" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))}
                      className="w-full bg-cream-50 border border-cream-200 text-charcoal-900 text-sm px-3 py-2.5 focus:outline-none focus:border-gold-400" placeholder={form.discountType === 'percentage' ? '10' : '100'} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-charcoal-600 mb-1.5 uppercase tracking-wide">Min Order (₹)</label>
                    <input type="number" value={form.minOrderAmount} onChange={e => setForm(p => ({ ...p, minOrderAmount: e.target.value }))}
                      className="w-full bg-cream-50 border border-cream-200 text-charcoal-900 text-sm px-3 py-2.5 focus:outline-none focus:border-gold-400" />
                  </div>
                  <div>
                    <label className="block text-xs text-charcoal-600 mb-1.5 uppercase tracking-wide">Max Discount (₹)</label>
                    <input type="number" value={form.maxDiscount} onChange={e => setForm(p => ({ ...p, maxDiscount: e.target.value }))}
                      className="w-full bg-cream-50 border border-cream-200 text-charcoal-900 text-sm px-3 py-2.5 focus:outline-none focus:border-gold-400" placeholder="No limit" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-charcoal-600 mb-1.5 uppercase tracking-wide">Expiry Date *</label>
                    <input type="date" value={form.expiry} onChange={e => setForm(p => ({ ...p, expiry: e.target.value }))}
                      className="w-full bg-cream-50 border border-cream-200 text-charcoal-900 text-sm px-3 py-2.5 focus:outline-none focus:border-gold-400" />
                  </div>
                  <div>
                    <label className="block text-xs text-charcoal-600 mb-1.5 uppercase tracking-wide">Usage Limit</label>
                    <input type="number" value={form.usageLimit} onChange={e => setForm(p => ({ ...p, usageLimit: e.target.value }))}
                      className="w-full bg-cream-50 border border-cream-200 text-charcoal-900 text-sm px-3 py-2.5 focus:outline-none focus:border-gold-400" placeholder="Unlimited" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-charcoal-600 mb-1.5 uppercase tracking-wide">Description</label>
                  <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    className="w-full bg-cream-50 border border-cream-200 text-charcoal-900 text-sm px-3 py-2.5 focus:outline-none focus:border-gold-400" placeholder="Internal note..." />
                </div>
                <div className="border-t border-cream-200 pt-4 space-y-4">
                  <div>
                    <label className="block text-xs text-charcoal-600 mb-1.5 uppercase tracking-wide">Applicable Categories</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto border border-cream-200 bg-cream-50 p-3">
                      {categories.length === 0 ? (
                        <p className="text-xs text-charcoal-500">No categories found</p>
                      ) : categories.map(category => (
                        <label key={category._id} className="flex items-center gap-2 text-sm text-charcoal-700">
                          <input
                            type="checkbox"
                            checked={form.applicableCategories.includes(category._id)}
                            onChange={() => toggleArrayValue('applicableCategories', category._id)}
                            className="w-4 h-4 accent-gold-500"
                          />
                          <span>{category.parentCategory?.name ? `${category.parentCategory.name} / ` : ''}{category.name}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-charcoal-400 mt-1">Leave empty to allow every category.</p>
                  </div>
                  <div>
                    <label className="block text-xs text-charcoal-600 mb-1.5 uppercase tracking-wide">Product Type</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {PRODUCT_TYPES.map(type => (
                        <label key={type.value} className="flex items-center gap-2 text-sm text-charcoal-700 bg-cream-50 border border-cream-200 px-3 py-2">
                          <input
                            type="checkbox"
                            checked={form.applicableProductTypes.includes(type.value)}
                            onChange={() => toggleArrayValue('applicableProductTypes', type.value)}
                            className="w-4 h-4 accent-gold-500"
                          />
                          <span>{type.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-charcoal-600 mb-1.5 uppercase tracking-wide">Product Tags</label>
                    <input
                      type="text"
                      value={form.applicableProductTags}
                      onChange={e => setForm(p => ({ ...p, applicableProductTags: e.target.value }))}
                      className="w-full bg-cream-50 border border-cream-200 text-charcoal-900 text-sm px-3 py-2.5 focus:outline-none focus:border-gold-400"
                      placeholder="kundan, bridal, earrings"
                    />
                    <p className="text-xs text-charcoal-400 mt-1">Comma separated. Leave empty for all tags.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-charcoal-600 mb-1.5 uppercase tracking-wide">Min Product Price (₹)</label>
                      <input type="number" value={form.minProductPrice} onChange={e => setForm(p => ({ ...p, minProductPrice: e.target.value }))}
                        className="w-full bg-cream-50 border border-cream-200 text-charcoal-900 text-sm px-3 py-2.5 focus:outline-none focus:border-gold-400" placeholder="Any" />
                    </div>
                    <div>
                      <label className="block text-xs text-charcoal-600 mb-1.5 uppercase tracking-wide">Max Product Price (₹)</label>
                      <input type="number" value={form.maxProductPrice} onChange={e => setForm(p => ({ ...p, maxProductPrice: e.target.value }))}
                        className="w-full bg-cream-50 border border-cream-200 text-charcoal-900 text-sm px-3 py-2.5 focus:outline-none focus:border-gold-400" placeholder="Any" />
                    </div>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 accent-gold-500" />
                  <span className="text-sm text-charcoal-700">Active</span>
                </label>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 text-sm border border-cream-200 text-charcoal-600 hover:text-charcoal-900 transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving} id="save-coupon-btn" className="flex-1 py-2.5 text-sm bg-gold-500 hover:bg-gold-600 text-white font-medium transition-colors disabled:opacity-50">
                  {saving ? 'Saving...' : editCoupon ? 'Update' : 'Create'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteId && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-50" onClick={() => setDeleteId(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-cream-200 p-6 z-50 w-80"
            >
              <h3 className="text-charcoal-900 font-semibold mb-2">Delete Coupon?</h3>
              <p className="text-sm text-charcoal-600 mb-5">This will permanently delete the promo code.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 text-sm border border-cream-200 text-charcoal-600 hover:text-charcoal-900 transition-colors">Cancel</button>
                <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 text-sm bg-red-600 hover:bg-red-700 text-white font-medium transition-colors">Delete</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

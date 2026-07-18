'use client';
import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X, GripVertical, Upload, ChevronRight } from 'lucide-react';
import { categoryAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', slug: '', description: '', parentCategory: '', order: '0', isActive: true, metaTitle: '', metaDescription: '', metaKeywords: '' };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCat, setEditCat] = useState<any>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const [treeRes, flatRes] = await Promise.all([
        categoryAPI.getAll({ activeOnly: 'false' }),
        categoryAPI.getAll({ activeOnly: 'false', flat: 'true' }),
      ]);
      setCategories(treeRes.data.categories || []);
      setAllCategories(flatRes.data.categories || []);
    } catch { toast.error('Failed to load categories'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const openCreate = (parentId?: string) => {
    setEditCat(null);
    setForm({ ...EMPTY_FORM, parentCategory: parentId || '' });
    setImageFile(null);
    setModalOpen(true);
  };

  const openEdit = (cat: any) => {
    setEditCat(cat);
    setForm({ name: cat.name, slug: cat.slug || '', description: cat.description || '', parentCategory: cat.parentCategory?._id || '', order: cat.order.toString(), isActive: cat.isActive, metaTitle: cat.metaTitle || '', metaDescription: cat.metaDescription || '', metaKeywords: cat.metaKeywords || '' });
    setImageFile(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('description', form.description);
      if ((form as any).slug) fd.append('slug', (form as any).slug);
      fd.append('parentCategory', form.parentCategory);
      fd.append('order', form.order);
      fd.append('isActive', form.isActive.toString());
      if ((form as any).metaTitle) fd.append('metaTitle', (form as any).metaTitle);
      if ((form as any).metaDescription) fd.append('metaDescription', (form as any).metaDescription);
      if (form.metaKeywords) fd.append('metaKeywords', form.metaKeywords);
      if (imageFile) fd.append('image', imageFile);

      if (editCat) {
        await categoryAPI.update(editCat._id, fd);
        toast.success('Category updated');
      } else {
        await categoryAPI.create(fd);
        toast.success('Category created');
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await categoryAPI.delete(id);
      toast.success('Category deleted');
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally { setDeleteId(null); }
  };

  const toggleActive = async (cat: any) => {
    try {
      const fd = new FormData();
      fd.append('isActive', (!cat.isActive).toString());
      await categoryAPI.update(cat._id, fd);
      toast.success(`Category ${!cat.isActive ? 'enabled' : 'disabled'}`);
      fetchCategories();
    } catch { toast.error('Failed to update'); }
  };

  const rootCategories = categories.filter((c: any) => !c.parentCategory || c.parentCategory === null);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-display text-charcoal-900">Categories</h1>
          <p className="text-sm text-charcoal-500 mt-0.5">{allCategories.length} total categories</p>
        </div>
        <button onClick={() => openCreate()} id="create-category-btn" className="flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-white text-sm font-medium px-4 py-2.5 transition-colors">
          <Plus size={16} /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 bg-cream-50 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {rootCategories.map(cat => (
            <div key={cat._id} className="bg-white border border-cream-200">
              {/* Parent category row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <GripVertical size={16} className="text-charcoal-600" />
                {cat.image ? (
                  <div className="relative w-10 h-10 flex-shrink-0"><Image src={cat.image} alt={cat.name} fill className="object-cover" /></div>
                ) : (
                  <div className="w-10 h-10 bg-cream-50 flex items-center justify-center text-charcoal-500 text-lg font-display">{cat.name.charAt(0)}</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-charcoal-900 font-medium">{cat.name}</p>
                  <p className="text-xs text-charcoal-500">{cat.subcategories?.length || 0} subcategories • Order: {cat.order}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(cat)}
                    className={`text-xs px-2.5 py-1 transition-colors ${cat.isActive ? 'bg-green-900/50 text-green-400 hover:bg-red-900/50 hover:text-red-400' : 'bg-red-900/50 text-red-400 hover:bg-green-900/50 hover:text-green-400'}`}
                  >
                    {cat.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <button onClick={() => openCreate(cat._id)} className="p-1.5 text-charcoal-500 hover:text-gold-400 hover:bg-cream-50 transition-colors" title="Add subcategory">
                    <Plus size={14} />
                  </button>
                  <button onClick={() => openEdit(cat)} className="p-1.5 text-charcoal-500 hover:text-charcoal-900 hover:bg-cream-50 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDeleteId(cat._id)} className="p-1.5 text-charcoal-500 hover:text-red-400 hover:bg-cream-50 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Subcategories */}
              {cat.subcategories?.length > 0 && (
                <div className="border-t border-cream-200 divide-y divide-charcoal-800">
                  {cat.subcategories.map((sub: any) => (
                    <div key={sub._id} className="flex items-center gap-3 px-4 py-2.5 pl-10 bg-cream-50/50">
                      <ChevronRight size={12} className="text-charcoal-600" />
                      <p className="text-sm text-charcoal-700 flex-1">{sub.name}</p>
                      <span className={`text-xs px-2 py-0.5 ${sub.isActive ? 'text-green-500' : 'text-red-500'}`}>{sub.isActive ? '●' : '○'}</span>
                      <button onClick={() => openEdit(sub)} className="p-1 text-charcoal-600 hover:text-charcoal-900 transition-colors"><Pencil size={12} /></button>
                      <button onClick={() => setDeleteId(sub._id)} className="p-1 text-charcoal-600 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-50" onClick={() => setModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-cream-200 z-50 w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-display text-charcoal-900">{editCat ? 'Edit Category' : 'Add Category'}</h2>
                <button onClick={() => setModalOpen(false)} className="text-charcoal-600 hover:text-charcoal-900"><X size={18} /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-charcoal-600 mb-1.5 uppercase tracking-wide">Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full bg-cream-50 border border-cream-200 text-charcoal-900 text-sm px-3 py-2.5 focus:outline-none focus:border-gold-400" />
                </div>
                <div>
                  <label className="block text-xs text-charcoal-600 mb-1.5 uppercase tracking-wide">Custom URL Slug (Optional)</label>
                  <input type="text" value={(form as any).slug || ''} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))}
                    placeholder="e.g. gold-rings"
                    className="w-full bg-cream-50 border border-cream-200 text-charcoal-900 text-sm px-3 py-2.5 focus:outline-none focus:border-gold-400" />
                </div>
                <div>
                  <label className="block text-xs text-charcoal-600 mb-1.5 uppercase tracking-wide">Parent Category</label>
                  <select value={form.parentCategory} onChange={e => setForm(p => ({ ...p, parentCategory: e.target.value }))}
                    className="w-full bg-cream-50 border border-cream-200 text-charcoal-900 text-sm px-3 py-2.5 focus:outline-none focus:border-gold-400">
                    <option value="">None (Root Category)</option>
                    {allCategories.filter(c => !c.parentCategory).map((c: any) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-charcoal-600 mb-1.5 uppercase tracking-wide">Description</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2}
                    className="w-full bg-cream-50 border border-cream-200 text-charcoal-900 text-sm px-3 py-2.5 focus:outline-none focus:border-gold-400 resize-none" />
                </div>
                <div>
                  <label className="block text-xs text-charcoal-600 mb-1.5 uppercase tracking-wide">SEO Title</label>
                  <input type="text" value={(form as any).metaTitle || ''} onChange={e => setForm(p => ({ ...p, metaTitle: e.target.value }))}
                    placeholder="SEO title for this category"
                    className="w-full bg-cream-50 border border-cream-200 text-charcoal-900 text-sm px-3 py-2.5 focus:outline-none focus:border-gold-400" />
                </div>
                <div>
                  <label className="block text-xs text-charcoal-600 mb-1.5 uppercase tracking-wide">SEO Description</label>
                  <textarea value={(form as any).metaDescription || ''} onChange={e => setForm(p => ({ ...p, metaDescription: e.target.value }))} rows={2}
                    placeholder="SEO description for this category"
                    className="w-full bg-cream-50 border border-cream-200 text-charcoal-900 text-sm px-3 py-2.5 focus:outline-none focus:border-gold-400 resize-none" />
                </div>
                <div>
                  <label className="block text-xs text-charcoal-600 mb-1.5 uppercase tracking-wide">SEO Keywords (Comma separated)</label>
                  <input type="text" value={form.metaKeywords} onChange={e => setForm(p => ({ ...p, metaKeywords: e.target.value }))}
                    placeholder="e.g. gold, ring, 24k"
                    className="w-full bg-cream-50 border border-cream-200 text-charcoal-900 text-sm px-3 py-2.5 focus:outline-none focus:border-gold-400" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-charcoal-600 mb-1.5 uppercase tracking-wide">Display Order</label>
                    <input type="number" value={form.order} onChange={e => setForm(p => ({ ...p, order: e.target.value }))}
                      className="w-full bg-cream-50 border border-cream-200 text-charcoal-900 text-sm px-3 py-2.5 focus:outline-none focus:border-gold-400" />
                  </div>
                  <div className="flex items-end pb-2.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 accent-gold-500" />
                      <span className="text-sm text-charcoal-700">Active</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-charcoal-600 mb-1.5 uppercase tracking-wide">Category Image</label>
                  <label className="flex items-center gap-3 border border-dashed border-cream-200 px-4 py-3 cursor-pointer hover:border-gold-500 transition-colors">
                    <Upload size={18} className="text-charcoal-500" />
                    <span className="text-sm text-charcoal-500">{imageFile ? imageFile.name : 'Click to upload image'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => setImageFile(e.target.files?.[0] || null)} />
                  </label>
                  {editCat?.image && !imageFile && (
                    <div className="relative w-16 h-16 mt-2"><Image src={editCat.image} alt="" fill className="object-cover" /></div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 text-sm border border-cream-200 text-charcoal-600 hover:text-charcoal-900 transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving} id="save-category-btn" className="flex-1 py-2.5 text-sm bg-gold-500 hover:bg-gold-600 text-white font-medium transition-colors disabled:opacity-50">
                  {saving ? 'Saving...' : editCat ? 'Update' : 'Create'}
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
              <h3 className="text-charcoal-900 font-semibold mb-2">Delete Category?</h3>
              <p className="text-sm text-charcoal-600 mb-5">This cannot be undone. All subcategories will also be deleted. Products using this category must be reassigned first.</p>
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

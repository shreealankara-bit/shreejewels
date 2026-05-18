'use client';
import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X, Upload, ToggleLeft, ToggleRight } from 'lucide-react';
import { bannerAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const POSITIONS = ['hero', 'homepage_mid', 'category', 'popup', 'sidebar'];
const EMPTY_FORM = { title: '', subtitle: '', link: '', buttonText: 'Shop Now', position: 'hero', order: '0', isActive: true, textColor: '#ffffff', bgColor: '' };

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editBanner, setEditBanner] = useState<any>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bannerAPI.getAll();
      setBanners(res.data.banners || []);
    } catch { toast.error('Failed to load banners'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  const openCreate = () => { setEditBanner(null); setForm(EMPTY_FORM); setImageFile(null); setModalOpen(true); };
  const openEdit = (b: any) => {
    setEditBanner(b);
    setForm({ title: b.title, subtitle: b.subtitle || '', link: b.link || '', buttonText: b.buttonText || 'Shop Now', position: b.position, order: b.order.toString(), isActive: b.isActive, textColor: b.textColor || '#ffffff', bgColor: b.bgColor || '' });
    setImageFile(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title) { toast.error('Title is required'); return; }
    if (!editBanner && !imageFile) { toast.error('Please select an image'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v.toString()));
      if (imageFile) fd.append('image', imageFile);
      if (editBanner) { await bannerAPI.update(editBanner._id, fd); toast.success('Banner updated'); }
      else { await bannerAPI.create(fd); toast.success('Banner created'); }
      setModalOpen(false);
      fetchBanners();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try { await bannerAPI.delete(id); toast.success('Banner deleted'); fetchBanners(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Delete failed'); }
    finally { setDeleteId(null); }
  };

  const toggleActive = async (b: any) => {
    try {
      const fd = new FormData();
      fd.append('isActive', (!b.isActive).toString());
      await bannerAPI.update(b._id, fd);
      toast.success(`Banner ${!b.isActive ? 'activated' : 'deactivated'}`);
      fetchBanners();
    } catch { toast.error('Failed'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-display text-charcoal-900">Banners</h1>
          <p className="text-sm text-charcoal-500 mt-0.5">{banners.length} banners</p>
        </div>
        <button onClick={openCreate} id="create-banner-btn" className="flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-white text-sm font-medium px-4 py-2.5 transition-colors">
          <Plus size={16} /> Add Banner
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-48 bg-cream-50 animate-pulse" />)}
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-16 text-charcoal-500">
          <p className="mb-3">No banners yet</p>
          <button onClick={openCreate} className="text-gold-400 hover:underline text-sm">Add your first banner →</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.map(b => (
            <div key={b._id} className="bg-white border border-cream-200 overflow-hidden">
              <div className="relative h-36">
                <Image src={b.image} alt={b.title} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <p className="text-charcoal-900 font-medium text-sm">{b.title}</p>
                  <span className="text-xs text-charcoal-700 bg-cream-50/80 px-1.5 py-0.5">{b.position}</span>
                </div>
              </div>
              <div className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-charcoal-500">Order: {b.order}</p>
                  {b.link && <p className="text-xs text-gold-500 truncate max-w-32">{b.link}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActive(b)} className={`text-sm ${b.isActive ? 'text-green-400' : 'text-charcoal-600'}`}>
                    {b.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  </button>
                  <button onClick={() => openEdit(b)} className="p-1.5 text-charcoal-600 hover:text-charcoal-900 hover:bg-cream-50 transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => setDeleteId(b._id)} className="p-1.5 text-charcoal-600 hover:text-red-400 hover:bg-cream-50 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
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
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-cream-200 z-50 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-display text-charcoal-900">{editBanner ? 'Edit Banner' : 'Add Banner'}</h2>
                <button onClick={() => setModalOpen(false)} className="text-charcoal-600 hover:text-charcoal-900"><X size={18} /></button>
              </div>

              <div className="space-y-4">
                {[{ label: 'Title *', key: 'title', type: 'text' }, { label: 'Subtitle', key: 'subtitle', type: 'text' }, { label: 'Link URL', key: 'link', type: 'text' }, { label: 'Button Text', key: 'buttonText', type: 'text' }].map(({ label, key, type }) => (
                  <div key={key}>
                    <label className="block text-xs text-charcoal-600 mb-1.5 uppercase tracking-wide">{label}</label>
                    <input type={type} value={form[key as keyof typeof form] as string} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                      className="w-full bg-cream-50 border border-cream-200 text-charcoal-900 text-sm px-3 py-2.5 focus:outline-none focus:border-gold-400" />
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-charcoal-600 mb-1.5 uppercase tracking-wide">Position</label>
                    <select value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))}
                      className="w-full bg-cream-50 border border-cream-200 text-charcoal-900 text-sm px-3 py-2.5 focus:outline-none focus:border-gold-400">
                      {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-charcoal-600 mb-1.5 uppercase tracking-wide">Display Order</label>
                    <input type="number" value={form.order} onChange={e => setForm(p => ({ ...p, order: e.target.value }))}
                      className="w-full bg-cream-50 border border-cream-200 text-charcoal-900 text-sm px-3 py-2.5 focus:outline-none focus:border-gold-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-charcoal-600 mb-1.5 uppercase tracking-wide">Banner Image {!editBanner && '*'}</label>
                  <label className="flex items-center gap-3 border border-dashed border-cream-200 px-4 py-4 cursor-pointer hover:border-gold-500 transition-colors">
                    <Upload size={20} className="text-charcoal-500" />
                    <span className="text-sm text-charcoal-500">{imageFile ? imageFile.name : editBanner ? 'Click to replace image' : 'Click to upload image'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => setImageFile(e.target.files?.[0] || null)} />
                  </label>
                  {editBanner?.image && !imageFile && (
                    <div className="relative h-24 mt-2 w-full"><Image src={editBanner.image} alt="" fill className="object-cover" /></div>
                  )}
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 accent-gold-500" />
                  <span className="text-sm text-charcoal-700">Active</span>
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 text-sm border border-cream-200 text-charcoal-600 hover:text-charcoal-900 transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving} id="save-banner-btn" className="flex-1 py-2.5 text-sm bg-gold-500 hover:bg-gold-600 text-white font-medium transition-colors disabled:opacity-50">
                  {saving ? 'Saving...' : editBanner ? 'Update' : 'Create'}
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
              <h3 className="text-charcoal-900 font-semibold mb-2">Delete Banner?</h3>
              <p className="text-sm text-charcoal-600 mb-5">This will delete the banner and its image from Cloudinary.</p>
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

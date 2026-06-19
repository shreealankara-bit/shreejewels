'use client';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X, Upload, Star, MapPin, Hash } from 'lucide-react';
import { testimonialAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface Testimonial {
  _id: string;
  name: string;
  location?: string;
  rating: number;
  comment: string;
  order: number;
  isActive: boolean;
  avatar?: string;
}

const EMPTY_FORM = {
  name: '',
  location: '',
  rating: 5,
  comment: '',
  order: 0,
  isActive: true,
};

/* ─── Star Selector ───────────────────────────────────────────────── */
function StarSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none transition-transform hover:scale-110"
        >
          <Star
            size={22}
            className={
              star <= (hovered || value)
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-cream-200 text-cream-200'
            }
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-charcoal-500">{value} / 5</span>
    </div>
  );
}

/* ─── Static Star Display ─────────────────────────────────────────── */
function StarDisplay({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={12}
          className={
            star <= value
              ? 'fill-yellow-400 text-yellow-400'
              : 'fill-cream-200 text-cream-200'
          }
        />
      ))}
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */
export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Testimonial | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* fetch ----------------------------------------------------------- */
  const fetchTestimonials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await testimonialAPI.getAll();
      setTestimonials(res.data.testimonials || []);
    } catch {
      toast.error('Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTestimonials(); }, [fetchTestimonials]);

  /* open modals ----------------------------------------------------- */
  const openCreate = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setAvatarFile(null);
    setAvatarPreview(null);
    setModalOpen(true);
  };

  const openEdit = (t: Testimonial) => {
    setEditItem(t);
    setForm({
      name: t.name,
      location: t.location || '',
      rating: t.rating,
      comment: t.comment,
      order: t.order,
      isActive: t.isActive,
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setModalOpen(true);
  };

  /* handle avatar file change --------------------------------------- */
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAvatarFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    } else {
      setAvatarPreview(null);
    }
  };

  /* save ------------------------------------------------------------ */
  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (!form.comment.trim()) { toast.error('Comment is required'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('location', form.location.trim());
      fd.append('rating', form.rating.toString());
      fd.append('comment', form.comment.trim());
      fd.append('order', form.order.toString());
      fd.append('isActive', form.isActive.toString());
      if (avatarFile) fd.append('avatar', avatarFile);

      if (editItem) {
        await testimonialAPI.update(editItem._id, fd);
        toast.success('Testimonial updated');
      } else {
        await testimonialAPI.create(fd);
        toast.success('Testimonial created');
      }
      setModalOpen(false);
      fetchTestimonials();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  /* delete ---------------------------------------------------------- */
  const handleDelete = async (id: string) => {
    try {
      await testimonialAPI.delete(id);
      toast.success('Testimonial deleted');
      fetchTestimonials();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleteId(null);
    }
  };

  /* close modal ----------------------------------------------------- */
  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  /* ─── Render ────────────────────────────────────────────────────── */
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-display text-charcoal-900">Testimonials</h1>
          <p className="text-sm text-charcoal-500 mt-0.5">
            {testimonials.length} {testimonials.length === 1 ? 'testimonial' : 'testimonials'}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-white text-sm font-medium px-4 py-2.5 transition-colors"
        >
          <Plus size={16} /> Add Testimonial
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 bg-cream-50 animate-pulse rounded-sm" />
          ))}
        </div>
      ) : testimonials.length === 0 ? (
        <div className="text-center py-16 text-charcoal-500">
          <p className="mb-3">No testimonials yet</p>
          <button onClick={openCreate} className="text-gold-400 hover:underline text-sm">
            Add your first testimonial →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testimonials.map((t) => (
            <div
              key={t._id}
              className="bg-white border border-cream-200 p-4 flex flex-col gap-3"
            >
              {/* Top row: avatar + name + location + rating */}
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="relative flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-cream-100 border border-cream-200">
                  {t.avatar ? (
                    <Image src={t.avatar} alt={t.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-charcoal-400 text-sm font-semibold uppercase">
                      {t.name.charAt(0)}
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-charcoal-900 truncate">{t.name}</p>
                  {t.location && (
                    <p className="text-xs text-charcoal-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={11} className="flex-shrink-0" />
                      {t.location}
                    </p>
                  )}
                  <div className="mt-1">
                    <StarDisplay value={t.rating} />
                  </div>
                </div>
                {/* Badges */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 uppercase tracking-wide ${
                      t.isActive
                        ? 'bg-green-50 text-green-600 border border-green-200'
                        : 'bg-cream-50 text-charcoal-400 border border-cream-200'
                    }`}
                  >
                    {t.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-[10px] text-charcoal-400 flex items-center gap-0.5">
                    <Hash size={9} />
                    {t.order}
                  </span>
                </div>
              </div>

              {/* Comment */}
              <p className="text-xs text-charcoal-600 leading-relaxed line-clamp-3 border-t border-cream-100 pt-3">
                &ldquo;{t.comment}&rdquo;
              </p>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 border-t border-cream-100 pt-2">
                <button
                  onClick={() => openEdit(t)}
                  className="flex items-center gap-1.5 text-xs text-charcoal-600 hover:text-charcoal-900 px-2.5 py-1.5 hover:bg-cream-50 transition-colors"
                >
                  <Pencil size={13} /> Edit
                </button>
                <button
                  onClick={() => setDeleteId(t._id)}
                  className="flex items-center gap-1.5 text-xs text-charcoal-600 hover:text-red-500 px-2.5 py-1.5 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add / Edit Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {modalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50"
              onClick={closeModal}
            />
            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 bg-white border border-charcoal-100 z-50 flex flex-col overflow-hidden sm:w-[520px] sm:max-h-[90vh] sm:rounded-sm"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-cream-100 flex-shrink-0">
                <h2 className="text-base font-display text-charcoal-900">
                  {editItem ? 'Edit Testimonial' : 'Add Testimonial'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-charcoal-500 hover:text-charcoal-900 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal body */}
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

                {/* Name */}
                <div>
                  <label className="block text-xs text-charcoal-600 mb-1.5 uppercase tracking-wide">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Customer name"
                    className="w-full bg-cream-50 border border-cream-200 text-charcoal-900 text-sm px-3 py-2.5 focus:outline-none focus:border-gold-400"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs text-charcoal-600 mb-1.5 uppercase tracking-wide">
                    Location
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                    placeholder="e.g. Mumbai, India"
                    className="w-full bg-cream-50 border border-cream-200 text-charcoal-900 text-sm px-3 py-2.5 focus:outline-none focus:border-gold-400"
                  />
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-xs text-charcoal-600 mb-2 uppercase tracking-wide">
                    Rating
                  </label>
                  <StarSelector
                    value={form.rating}
                    onChange={(v) => setForm((p) => ({ ...p, rating: v }))}
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-xs text-charcoal-600 mb-1.5 uppercase tracking-wide">
                    Comment *
                  </label>
                  <textarea
                    rows={4}
                    value={form.comment}
                    onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))}
                    placeholder="Customer's review..."
                    className="w-full bg-cream-50 border border-cream-200 text-charcoal-900 text-sm px-3 py-2.5 focus:outline-none focus:border-gold-400 resize-none"
                  />
                </div>

                {/* Order + Is Active */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-charcoal-600 mb-1.5 uppercase tracking-wide">
                      Display Order
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.order}
                      onChange={(e) => setForm((p) => ({ ...p, order: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-cream-50 border border-cream-200 text-charcoal-900 text-sm px-3 py-2.5 focus:outline-none focus:border-gold-400"
                    />
                  </div>
                  <div className="flex flex-col justify-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                        className="w-4 h-4 accent-gold-500"
                      />
                      <span className="text-sm text-charcoal-700">Active</span>
                    </label>
                  </div>
                </div>

                {/* Avatar upload */}
                <div>
                  <label className="block text-xs text-charcoal-600 mb-1.5 uppercase tracking-wide">
                    Avatar
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center gap-3 border border-dashed border-cream-200 px-4 py-3.5 cursor-pointer hover:border-gold-400 transition-colors text-left"
                  >
                    <Upload size={18} className="text-charcoal-400 flex-shrink-0" />
                    <span className="text-sm text-charcoal-500 truncate">
                      {avatarFile
                        ? avatarFile.name
                        : editItem?.avatar
                        ? 'Click to replace avatar'
                        : 'Click to upload avatar (optional)'}
                    </span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />

                  {/* Preview */}
                  {(avatarPreview || (!avatarFile && editItem?.avatar)) && (
                    <div className="mt-3 flex items-center gap-3">
                      <div className="relative w-14 h-14 rounded-full overflow-hidden border border-cream-200 flex-shrink-0">
                        <Image
                          src={avatarPreview || editItem!.avatar!}
                          alt="Avatar preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                      {avatarPreview && avatarFile && (
                        <button
                          type="button"
                          onClick={() => {
                            setAvatarFile(null);
                            setAvatarPreview(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="text-xs text-charcoal-500 hover:text-red-500 transition-colors flex items-center gap-1"
                        >
                          <X size={12} /> Remove
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex gap-3 px-5 py-4 border-t border-cream-100 flex-shrink-0">
                <button
                  onClick={closeModal}
                  disabled={saving}
                  className="flex-1 py-2.5 text-sm border border-cream-200 text-charcoal-600 hover:text-charcoal-900 transition-colors disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 text-sm bg-gold-500 hover:bg-gold-600 text-white font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving…' : editItem ? 'Update' : 'Create'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Delete Confirmation ────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50"
              onClick={() => setDeleteId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-cream-200 p-6 z-50 w-80 sm:rounded-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                  <Trash2 size={16} className="text-red-500" />
                </div>
                <h3 className="text-charcoal-900 font-semibold">Delete Testimonial?</h3>
              </div>
              <p className="text-sm text-charcoal-500 mb-5">
                This action cannot be undone. The testimonial will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-2.5 text-sm border border-cream-200 text-charcoal-600 hover:text-charcoal-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteId)}
                  className="flex-1 py-2.5 text-sm bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

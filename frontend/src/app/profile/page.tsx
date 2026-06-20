'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, isLoggedIn, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });

  useEffect(() => {
    if (!loading && !isLoggedIn) router.push('/auth/login?redirect=/profile');
  }, [loading, isLoggedIn, router]);

  useEffect(() => {
    if (user) setForm({ name: user.name || '', phone: user.phone || '' });
  }, [user]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const res = await authAPI.updateProfile(form);
      updateUser(res.data.user);
      toast.success('Profile updated');
    } catch {
      toast.error('Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-gold-500">Loading...</div></div>;
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-gold-600 mb-3">Account</p>
      <h1 className="font-display text-3xl text-charcoal-900 mb-2">My Profile</h1>
      <p className="text-sm text-charcoal-500 mb-8">Keep your contact details updated for order and delivery support.</p>

      <form onSubmit={handleSubmit} className="bg-white border border-charcoal-100 p-5 sm:p-6 space-y-4">
        <div>
          <label className="block text-xs text-charcoal-600 font-medium mb-1.5 uppercase tracking-wide">Full Name</label>
          <input
            className="input-field"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block text-xs text-charcoal-600 font-medium mb-1.5 uppercase tracking-wide">Phone Number</label>
          <input
            className="input-field"
            type="tel"
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            minLength={10}
            required
          />
        </div>
        <div>
          <label className="block text-xs text-charcoal-600 font-medium mb-1.5 uppercase tracking-wide">Email Address</label>
          <input className="input-field bg-cream-50" value={user.email} disabled />
        </div>
        <button type="submit" disabled={saving} className="btn-gold w-full py-3 disabled:opacity-60">
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </main>
  );
}


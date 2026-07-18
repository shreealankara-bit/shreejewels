'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Pencil, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminCustomerAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'admin',
    isActive: true,
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminCustomerAPI.getAll({ search, role: 'admin,superadmin' });
      setUsers(res.data.users || []);
    } catch {
      toast.error('Failed to load admin users');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const delay = setTimeout(fetchUsers, 300);
    return () => clearTimeout(delay);
  }, [fetchUsers]);

  const openCreate = () => {
    setEditUser(null);
    setForm({ name: '', email: '', phone: '', password: '', role: 'admin', isActive: true });
    setModalOpen(true);
  };

  const openEdit = (user: any) => {
    setEditUser(user);
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      password: '', // blank on edit
      role: user.role,
      isActive: user.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || (!editUser && !form.password)) {
      toast.error('Name, email, and password are required');
      return;
    }
    if (form.password && form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      if (editUser) {
        await adminCustomerAPI.update(editUser._id, form);
        toast.success('Admin updated');
      } else {
        await adminCustomerAPI.create(form);
        toast.success('Admin created');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this admin user?')) return;
    try {
      await adminCustomerAPI.delete(id);
      toast.success('Admin deactivated');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      await adminCustomerAPI.toggleStatus(id);
      toast.success('Status updated');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-display text-charcoal-900">Admin Users</h1>
          <p className="text-sm text-charcoal-500 mt-0.5">{users.length} admin user{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded-md text-sm font-medium transition-colors">
          <Plus size={16} /> New Admin
        </button>
      </div>

      <div className="relative mb-5 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-500" />
        <input type="text" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-white border border-cream-200 text-charcoal-900 text-sm pl-9 pr-4 py-2.5 focus:outline-none focus:border-gold-400 placeholder-charcoal-500" />
      </div>

      <div className="bg-white border border-cream-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[650px]">
          <thead className="bg-cream-50 border-b border-cream-200">
            <tr>
              {['User', 'Role', 'Joined', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-charcoal-600 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-100">
            {loading ? Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="animate-pulse"><td colSpan={5} className="px-4 py-4"><div className="h-4 bg-cream-50 rounded" /></td></tr>
            )) : users.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-charcoal-500">No admin users found</td></tr>
            ) : users.map(user => (
              <tr key={user._id} className="hover:bg-cream-50 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="text-charcoal-900 font-medium">{user.name}</p>
                    <p className="text-xs text-charcoal-500">{user.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded capitalize ${user.role === 'superadmin' ? 'bg-gold-100 text-gold-700' : 'bg-blue-100 text-blue-700'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-charcoal-500 text-xs">{new Date(user.createdAt).toLocaleDateString('en-IN')}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleStatus(user._id)} className={`text-xs px-2 py-0.5 rounded-full cursor-pointer ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {user.isActive ? 'Active' : 'Deactivated'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(user)} className="p-1.5 text-charcoal-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer" title="Edit">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDelete(user._id)} className="p-1.5 text-charcoal-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer" title="Deactivate">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalOpen(false)}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm cursor-pointer" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 bg-white sm:rounded-lg shadow-xl sm:max-w-md w-full max-h-screen overflow-y-auto flex flex-col">
              
              <div className="flex items-center justify-between p-4 border-b border-cream-100 sticky top-0 bg-white z-10">
                <h3 className="text-lg font-medium text-charcoal-900">{editUser ? 'Edit Admin' : 'New Admin'}</h3>
                <button onClick={() => setModalOpen(false)} className="text-charcoal-400 hover:text-charcoal-600 p-1 cursor-pointer"><X size={20} /></button>
              </div>

              <form onSubmit={handleSave} className="p-4 space-y-4">
                <div>
                  <label className="block text-xs text-charcoal-600 mb-1">Name <span className="text-red-500">*</span></label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full bg-cream-50 border border-cream-200 text-sm px-3 py-2 rounded focus:outline-none focus:border-gold-400" />
                </div>
                <div>
                  <label className="block text-xs text-charcoal-600 mb-1">Email <span className="text-red-500">*</span></label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required className="w-full bg-cream-50 border border-cream-200 text-sm px-3 py-2 rounded focus:outline-none focus:border-gold-400" />
                </div>
                <div>
                  <label className="block text-xs text-charcoal-600 mb-1">Phone</label>
                  <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-cream-50 border border-cream-200 text-sm px-3 py-2 rounded focus:outline-none focus:border-gold-400" />
                </div>
                <div>
                  <label className="block text-xs text-charcoal-600 mb-1">Password {editUser && '(Leave blank to keep current)'} {!editUser && <span className="text-red-500">*</span>}</label>
                  <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required={!editUser} className="w-full bg-cream-50 border border-cream-200 text-sm px-3 py-2 rounded focus:outline-none focus:border-gold-400" />
                </div>
                <div>
                  <label className="block text-xs text-charcoal-600 mb-1">Role</label>
                  <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full bg-cream-50 border border-cream-200 text-sm px-3 py-2 rounded focus:outline-none focus:border-gold-400">
                    <option value="admin">Admin</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                </div>
                {editUser && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} className="rounded text-gold-500 focus:ring-gold-500" />
                    <span className="text-sm text-charcoal-700">Account Active</span>
                  </label>
                )}

                <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white">
                  <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-charcoal-600 hover:bg-cream-100 rounded transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-gold-500 hover:bg-gold-600 text-white rounded font-medium transition-colors disabled:opacity-50 cursor-pointer">
                    {saving ? 'Saving...' : 'Save Admin'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

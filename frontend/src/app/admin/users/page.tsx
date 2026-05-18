'use client';
import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/users', { params: { search } })
      .then(res => setUsers(res.data.users || []))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-display text-charcoal-900">Users</h1>
          <p className="text-sm text-charcoal-500 mt-0.5">{users.length} customers</p>
        </div>
      </div>

      <div className="relative mb-5 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-500" />
        <input type="text" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-white border border-cream-200 text-charcoal-900 text-sm pl-9 pr-4 py-2.5 focus:outline-none focus:border-gold-400 placeholder-charcoal-500" />
      </div>

      <div className="bg-white border border-cream-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream-50 border-b border-cream-200">
            <tr>
              {['User', 'Role', 'Login Method', 'Joined', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-charcoal-600 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-charcoal-800">
            {loading ? Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="animate-pulse"><td colSpan={5} className="px-4 py-4"><div className="h-4 bg-cream-50 rounded" /></td></tr>
            )) : users.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-charcoal-500">No users found</td></tr>
            ) : users.map(user => (
              <tr key={user._id} className="hover:bg-cream-50/50 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="text-charcoal-900 font-medium">{user.name}</p>
                    <p className="text-xs text-charcoal-500">{user.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 capitalize ${user.role === 'superadmin' ? 'bg-gold-900/30 text-gold-400' : user.role === 'admin' ? 'bg-blue-900/30 text-blue-400' : 'bg-cream-50 text-charcoal-600'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-charcoal-600 text-xs">{user.googleId ? '🔵 Google' : '📧 Email'}</td>
                <td className="px-4 py-3 text-charcoal-500 text-xs">{new Date(user.createdAt).toLocaleDateString('en-IN')}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs ${user.isActive ? 'text-green-400' : 'text-red-400'}`}>{user.isActive ? 'Active' : 'Blocked'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

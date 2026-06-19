'use client';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, User } from 'lucide-react';
import { adminCustomerAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface Customer {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  addresses?: any[];
  wishlist?: any[];
}

interface Pagination {
  page: number;
  total: number;
  pages: number;
}

const ROLE_OPTIONS = ['all', 'customer', 'admin'] as const;

function roleBadge(role: string) {
  if (role === 'admin')
    return 'bg-gold-100 text-gold-600';
  return 'bg-blue-100 text-blue-600';
}

function statusBadge(isActive: boolean) {
  return isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500';
}

function fmt(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function fmtTime(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input
  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 400);
  };

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 20 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filterRole && filterRole !== 'all') params.role = filterRole;
      const res = await adminCustomerAPI.getAll(params);
      setCustomers(res.data.users || []);
      setPagination(res.data.pagination || { page: 1, total: 0, pages: 1 });
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filterRole]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Cleanup debounce on unmount
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const skeletonRows = Array.from({ length: 8 });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-display text-charcoal-900">Customers</h1>
          <p className="text-sm text-charcoal-500 mt-0.5">
            {loading ? '—' : `${pagination.total} registered customer${pagination.total !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-white border border-cream-200 text-charcoal-900 text-sm pl-9 pr-4 py-2.5 focus:outline-none focus:border-gold-400 placeholder-charcoal-400"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => { setFilterRole(e.target.value); setPage(1); }}
          className="bg-white border border-cream-200 text-charcoal-900 text-sm px-3 py-2.5 focus:outline-none focus:border-gold-400 capitalize"
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>{r === 'all' ? 'All Roles' : r.charAt(0).toUpperCase() + r.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* ── Desktop Table ── */}
      <div className="hidden sm:block bg-white border border-charcoal-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[750px]">
            <thead className="bg-cream-50 border-b border-cream-200">
              <tr>
                {['Name', 'Email', 'Phone', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-charcoal-600 uppercase tracking-wider font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {loading
                ? skeletonRows.map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="h-4 bg-cream-50 rounded w-full" />
                      </td>
                    </tr>
                  ))
                : customers.length === 0
                ? (
                    <tr>
                      <td colSpan={7} className="text-center py-14 text-charcoal-400">
                        No customers found
                      </td>
                    </tr>
                  )
                : customers.map((c) => (
                    <tr key={c._id} className="hover:bg-cream-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-cream-100 flex items-center justify-center flex-shrink-0">
                            <User size={14} className="text-charcoal-500" />
                          </div>
                          <span className="font-medium text-charcoal-900 truncate max-w-[140px]">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-charcoal-600 truncate max-w-[180px]">{c.email}</td>
                      <td className="px-4 py-3 text-charcoal-600">{c.phone || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs px-2 py-0.5 capitalize font-medium ${roleBadge(c.role)}`}>
                          {c.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs px-2 py-0.5 font-medium ${statusBadge(c.isActive)}`}>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-charcoal-500 text-xs whitespace-nowrap">{fmt(c.createdAt)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedCustomer(c)}
                          className="text-xs text-gold-600 hover:text-gold-700 hover:underline font-medium transition-colors"
                        >
                          View Details →
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center gap-1 p-4 border-t border-cream-200">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 h-8 text-xs bg-cream-50 text-charcoal-600 hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === pagination.pages || Math.abs(p - page) <= 2)
              .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === 'ellipsis' ? (
                  <span key={`el-${idx}`} className="w-8 h-8 flex items-center justify-center text-xs text-charcoal-400">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`w-8 h-8 text-xs transition-colors ${
                      p === page
                        ? 'bg-gold-500 text-white'
                        : 'bg-cream-50 text-charcoal-600 hover:bg-cream-100'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="px-3 h-8 text-xs bg-cream-50 text-charcoal-600 hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* ── Mobile Cards ── */}
      <div className="sm:hidden space-y-3">
        {loading
          ? skeletonRows.map((_, i) => (
              <div key={i} className="bg-white border border-cream-200 p-4 animate-pulse">
                <div className="h-4 bg-cream-50 rounded w-1/2 mb-2" />
                <div className="h-3 bg-cream-50 rounded w-3/4" />
              </div>
            ))
          : customers.length === 0
          ? (
              <div className="text-center py-14 text-charcoal-400 text-sm">No customers found</div>
            )
          : customers.map((c) => (
              <div key={c._id} className="bg-white border border-cream-200 p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-cream-100 flex items-center justify-center flex-shrink-0">
                      <User size={14} className="text-charcoal-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-charcoal-900 truncate">{c.name}</p>
                      <p className="text-xs text-charcoal-500 truncate">{c.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCustomer(c)}
                    className="text-xs text-gold-600 hover:underline font-medium flex-shrink-0"
                  >
                    View →
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  <span className={`text-xs px-2 py-0.5 font-medium capitalize ${roleBadge(c.role)}`}>{c.role}</span>
                  <span className={`text-xs px-2 py-0.5 font-medium ${statusBadge(c.isActive)}`}>
                    {c.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs text-charcoal-400">Joined {fmt(c.createdAt)}</span>
                </div>
              </div>
            ))}

        {/* Mobile Pagination */}
        {pagination.pages > 1 && !loading && (
          <div className="flex justify-center gap-2 pt-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-xs bg-white border border-cream-200 text-charcoal-600 disabled:opacity-40"
            >
              ← Prev
            </button>
            <span className="px-4 py-2 text-xs text-charcoal-500">
              {page} / {pagination.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="px-4 py-2 text-xs bg-white border border-cream-200 text-charcoal-600 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* ── Customer Detail Modal ── */}
      <AnimatePresence>
        {selectedCustomer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setSelectedCustomer(null)}
            />
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 60 }}
              transition={{ type: 'spring', damping: 24, stiffness: 260 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white border-l border-cream-200 z-50 flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-cream-200 flex-shrink-0">
                <div>
                  <h2 className="text-lg font-display text-charcoal-900">Customer Details</h2>
                  <p className="text-xs text-charcoal-500 mt-0.5 truncate max-w-[260px]">{selectedCustomer.email}</p>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-charcoal-400 hover:text-charcoal-900 transition-colors"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
                {/* Avatar + Name */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-cream-100 flex items-center justify-center flex-shrink-0">
                    <User size={24} className="text-charcoal-400" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-charcoal-900">{selectedCustomer.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 font-medium capitalize ${roleBadge(selectedCustomer.role)}`}>
                        {selectedCustomer.role}
                      </span>
                      <span className={`text-xs px-2 py-0.5 font-medium ${statusBadge(selectedCustomer.isActive)}`}>
                        {selectedCustomer.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="space-y-0 border border-cream-200 divide-y divide-cream-100">
                  {[
                    { label: 'Full Name', value: selectedCustomer.name },
                    { label: 'Email', value: selectedCustomer.email },
                    { label: 'Phone', value: selectedCustomer.phone || '—' },
                    { label: 'Role', value: selectedCustomer.role },
                    { label: 'Account Status', value: selectedCustomer.isActive ? 'Active' : 'Inactive' },
                    { label: 'Joined', value: fmtTime(selectedCustomer.createdAt) },
                    { label: 'Last Login', value: fmtTime(selectedCustomer.lastLogin) },
                    { label: 'Wishlist Items', value: String(selectedCustomer.wishlist?.length ?? 0) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex gap-3 px-4 py-3">
                      <span className="text-xs text-charcoal-400 uppercase tracking-wide w-28 flex-shrink-0 pt-0.5">
                        {label}
                      </span>
                      <span className="text-sm text-charcoal-800 break-all">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Addresses */}
                <div>
                  <h3 className="text-xs text-charcoal-500 uppercase tracking-wide mb-2">
                    Addresses ({selectedCustomer.addresses?.length ?? 0})
                  </h3>
                  {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 ? (
                    <pre className="bg-cream-50 border border-cream-200 text-charcoal-700 text-xs p-3 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                      {JSON.stringify(selectedCustomer.addresses, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-sm text-charcoal-400">No addresses saved.</p>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-4 border-t border-cream-200 flex-shrink-0">
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="w-full py-2.5 border border-cream-200 text-charcoal-700 hover:bg-cream-50 text-sm font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

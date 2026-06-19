'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Eye, AlertTriangle, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { missingOrderAPI } from '@/lib/api';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

type Reason = 'abandoned' | 'payment_failed';

interface ShippingAddress {
  fullName?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

interface OrderItem {
  title?: string;
  productTitle?: string;
  name?: string;
  quantity: number;
  qty?: number;
  price: number;
  total?: number;
}

interface MissingOrder {
  _id: string;
  id?: string;
  sessionId?: string;
  userId?: string;
  name?: string;
  email?: string;
  phone?: string;
  items: OrderItem[];
  shippingAddress?: ShippingAddress;
  subtotal?: number;
  discount?: number;
  couponCode?: string;
  totalAmount: number;
  reason: Reason;
  createdAt: string;
}

interface Pagination {
  page: number;
  total: number;
  pages: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REASON_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Reasons' },
  { value: 'abandoned', label: 'Abandoned Cart' },
  { value: 'payment_failed', label: 'Payment Failed' },
];

const REASON_BADGE: Record<Reason, string> = {
  abandoned: 'bg-yellow-100 text-yellow-700',
  payment_failed: 'bg-red-100 text-red-600',
};

const REASON_LABEL: Record<Reason, string> = {
  abandoned: 'Abandoned',
  payment_failed: 'Payment Failed',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getItemTitle(item: OrderItem): string {
  return item.title || item.productTitle || item.name || 'Unknown Product';
}

function getItemQty(item: OrderItem): number {
  return item.quantity ?? item.qty ?? 1;
}

function getItemTotal(item: OrderItem): number {
  if (item.total != null) return item.total;
  return item.price * getItemQty(item);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatCurrency(n?: number): string {
  if (n == null) return '—';
  return `₹${n.toLocaleString('en-IN')}`;
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({
  order,
  onClose,
  onDelete,
}: {
  order: MissingOrder;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(order._id || order.id || '');
    setDeleting(false);
    onClose();
  };

  const addr = order.shippingAddress;
  const hasAddress =
    addr && (addr.fullName || addr.line1 || addr.city);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, x: 64 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 64 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white border-l border-cream-200 z-50 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-cream-200 flex-shrink-0">
          <div>
            <h2 className="text-lg font-display text-charcoal-900">Order Details</h2>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-xs px-2 py-0.5 font-medium ${REASON_BADGE[order.reason] || 'bg-cream-100 text-charcoal-600'}`}
              >
                {REASON_LABEL[order.reason] || order.reason}
              </span>
              <span className="text-xs text-charcoal-400">{formatDate(order.createdAt)}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-charcoal-400 hover:text-charcoal-900 transition-colors mt-0.5"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

          {/* Customer Info */}
          <section>
            <h3 className="text-[11px] uppercase tracking-widest text-charcoal-400 font-semibold mb-3">
              Customer
            </h3>
            <div className="space-y-1">
              {order.name && (
                <p className="text-charcoal-900 font-medium">{order.name}</p>
              )}
              {order.email && (
                <p className="text-sm text-charcoal-600">{order.email}</p>
              )}
              {order.phone && (
                <p className="text-sm text-charcoal-500">{order.phone}</p>
              )}
              {!order.name && !order.email && !order.phone && (
                <p className="text-sm text-charcoal-400 italic">Guest — no contact info</p>
              )}
              {order.sessionId && (
                <p className="text-[11px] text-charcoal-400 font-mono mt-1 break-all">
                  Session: {order.sessionId}
                </p>
              )}
            </div>
          </section>

          {/* Items */}
          <section>
            <h3 className="text-[11px] uppercase tracking-widest text-charcoal-400 font-semibold mb-3">
              Items ({order.items?.length ?? 0})
            </h3>
            {order.items && order.items.length > 0 ? (
              <div className="space-y-2.5">
                {order.items.map((item, i) => {
                  const qty = getItemQty(item);
                  const total = getItemTotal(item);
                  return (
                    <div key={i} className="flex items-start justify-between gap-3 text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="text-charcoal-900 truncate">{getItemTitle(item)}</p>
                        <p className="text-xs text-charcoal-500">
                          {qty} × {formatCurrency(item.price)}
                        </p>
                      </div>
                      <span className="text-charcoal-900 font-medium flex-shrink-0">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-charcoal-400 italic">No items recorded</p>
            )}

            {/* Totals */}
            <div className="border-t border-cream-200 mt-4 pt-4 space-y-1.5">
              {order.subtotal != null && (
                <div className="flex justify-between text-sm text-charcoal-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
              )}
              {order.discount != null && order.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>
                    Discount{order.couponCode ? ` (${order.couponCode})` : ''}
                  </span>
                  <span>−{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-charcoal-900 text-base pt-1">
                <span>Total</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </section>

          {/* Shipping Address */}
          {hasAddress && (
            <section>
              <h3 className="text-[11px] uppercase tracking-widest text-charcoal-400 font-semibold mb-3">
                Shipping Address
              </h3>
              <div className="text-sm text-charcoal-700 space-y-0.5">
                {addr!.fullName && <p className="font-medium">{addr!.fullName}</p>}
                {addr!.phone && <p className="text-charcoal-500">{addr!.phone}</p>}
                {addr!.line1 && (
                  <p>
                    {addr!.line1}
                    {addr!.line2 ? `, ${addr!.line2}` : ''}
                  </p>
                )}
                {(addr!.city || addr!.state || addr!.pincode) && (
                  <p>
                    {[addr!.city, addr!.state].filter(Boolean).join(', ')}
                    {addr!.pincode ? ` − ${addr!.pincode}` : ''}
                  </p>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Footer — delete */}
        <div className="px-5 py-4 border-t border-cream-200 flex-shrink-0">
          {confirmDelete ? (
            <div className="flex items-center gap-3">
              <p className="text-sm text-charcoal-700 flex-1">Delete this record?</p>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-sm text-charcoal-500 hover:text-charcoal-900 px-3 py-2 transition-colors"
              >
                No
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-sm bg-red-500 hover:bg-red-600 text-white px-4 py-2 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-red-300 text-red-500 hover:bg-red-50 text-sm font-medium transition-colors"
            >
              <Trash2 size={15} />
              Delete Record
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MissingOrdersPage() {
  const [orders, setOrders] = useState<MissingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [reason, setReason] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<MissingOrder | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 20 };
      if (reason !== 'all') params.reason = reason;
      const res = await missingOrderAPI.getAll(params);
      setOrders(res.data.orders || []);
      setPagination(res.data.pagination || { page: 1, total: 0, pages: 1 });
    } catch {
      toast.error('Failed to load missing orders');
    } finally {
      setLoading(false);
    }
  }, [page, reason]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await missingOrderAPI.delete(id);
      toast.success('Record deleted');
      fetchOrders();
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Inline row delete confirmation state ───────────────────────────────────
  const [confirmRowId, setConfirmRowId] = useState<string | null>(null);

  // ─── Render ──────────────────────────────────────────────────────────────────

  const skeletonRows = Array.from({ length: 8 });

  return (
    <div>
      {/* Page heading */}
      <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-display text-charcoal-900 flex items-center gap-2">
            <AlertTriangle size={18} className="text-yellow-500" />
            Missing Orders
          </h1>
          <p className="text-sm text-charcoal-500 mt-0.5">
            Abandoned checkouts and failed payments.
            {!loading && (
              <span className="ml-1 text-charcoal-400">
                {pagination.total} record{pagination.total !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {REASON_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setReason(opt.value); setPage(1); }}
              className={`text-xs px-3 py-2 border transition-colors ${
                reason === opt.value
                  ? 'bg-gold-500 border-gold-500 text-white'
                  : 'bg-white border-cream-200 text-charcoal-600 hover:border-gold-300 hover:text-charcoal-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── DESKTOP TABLE ── */}
      <div className="hidden md:block bg-white border border-cream-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[780px]">
          <thead className="bg-cream-50 border-b border-cream-200">
            <tr>
              {['Date', 'Customer', 'Items', 'Amount', 'Reason', 'Actions'].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-xs text-charcoal-500 uppercase tracking-wider font-semibold"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-100">
            {loading ? (
              skeletonRows.map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-3.5 bg-cream-100 rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-charcoal-400">
                  <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
                  <p>No missing orders found</p>
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const rowId = order._id || order.id || '';
                const isConfirming = confirmRowId === rowId;
                const isDeleting = deletingId === rowId;

                return (
                  <tr key={rowId} className="hover:bg-cream-50/60 transition-colors">
                    {/* Date */}
                    <td className="px-4 py-3 text-charcoal-500 text-xs whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3">
                      <p className="text-charcoal-900 font-medium truncate max-w-[140px]">
                        {order.name || <span className="text-charcoal-400 italic">Guest</span>}
                      </p>
                      {order.email && (
                        <p className="text-xs text-charcoal-500 truncate max-w-[140px]">{order.email}</p>
                      )}
                    </td>

                    {/* Items count */}
                    <td className="px-4 py-3 text-charcoal-600 text-sm">
                      {order.items?.length ?? 0}{' '}
                      <span className="text-charcoal-400 text-xs">
                        item{(order.items?.length ?? 0) !== 1 ? 's' : ''}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 font-semibold text-charcoal-900 whitespace-nowrap">
                      {formatCurrency(order.totalAmount)}
                    </td>

                    {/* Reason badge */}
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2.5 py-1 font-medium whitespace-nowrap ${
                          REASON_BADGE[order.reason] || 'bg-cream-100 text-charcoal-600'
                        }`}
                      >
                        {REASON_LABEL[order.reason] || order.reason}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      {isConfirming ? (
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <span className="text-xs text-charcoal-600">Are you sure?</span>
                          <button
                            onClick={() => setConfirmRowId(null)}
                            className="text-xs text-charcoal-500 hover:text-charcoal-900 px-2 py-1 border border-cream-200 transition-colors"
                          >
                            No
                          </button>
                          <button
                            onClick={async () => {
                              setConfirmRowId(null);
                              await handleDelete(rowId);
                            }}
                            disabled={isDeleting}
                            className="text-xs text-white bg-red-500 hover:bg-red-600 px-2 py-1 transition-colors disabled:opacity-50"
                          >
                            {isDeleting ? '…' : 'Yes'}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-xs text-gold-500 hover:text-gold-600 flex items-center gap-1 transition-colors"
                          >
                            <Eye size={13} />
                            View
                          </button>
                          <span className="text-cream-300">|</span>
                          <button
                            onClick={() => setConfirmRowId(rowId)}
                            className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors"
                            disabled={isDeleting}
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-cream-200">
            <p className="text-xs text-charcoal-500">
              Page {pagination.page} of {pagination.pages} · {pagination.total} records
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 text-charcoal-500 hover:text-charcoal-900 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={16} />
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
                    <span key={`el-${idx}`} className="px-1 text-charcoal-400 text-xs">
                      …
                    </span>
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
                className="p-1.5 text-charcoal-500 hover:text-charcoal-900 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MOBILE CARD LIST ── */}
      <div className="md:hidden space-y-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-cream-200 p-4 animate-pulse space-y-2">
              <div className="h-3 bg-cream-100 rounded w-1/3" />
              <div className="h-4 bg-cream-100 rounded w-2/3" />
              <div className="h-3 bg-cream-100 rounded w-1/2" />
            </div>
          ))
        ) : orders.length === 0 ? (
          <div className="bg-white border border-cream-200 py-16 text-center text-charcoal-400">
            <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No missing orders found</p>
          </div>
        ) : (
          orders.map((order) => {
            const rowId = order._id || order.id || '';
            const isConfirming = confirmRowId === rowId;
            const isDeleting = deletingId === rowId;

            return (
              <div
                key={rowId}
                className="bg-white border border-cream-200 p-4 space-y-3"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-charcoal-900 font-medium truncate">
                      {order.name || <span className="text-charcoal-400 italic text-sm">Guest</span>}
                    </p>
                    {order.email && (
                      <p className="text-xs text-charcoal-500 truncate">{order.email}</p>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 font-medium flex-shrink-0 ${
                      REASON_BADGE[order.reason] || 'bg-cream-100 text-charcoal-600'
                    }`}
                  >
                    {REASON_LABEL[order.reason] || order.reason}
                  </span>
                </div>

                {/* Meta row */}
                <div className="flex items-center gap-4 text-xs text-charcoal-500">
                  <span>{formatDate(order.createdAt)}</span>
                  <span>
                    {order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? 's' : ''}
                  </span>
                  <span className="font-semibold text-charcoal-900">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>

                {/* Actions */}
                {isConfirming ? (
                  <div className="flex items-center gap-2 pt-1">
                    <p className="text-sm text-charcoal-700 flex-1">Delete this record?</p>
                    <button
                      onClick={() => setConfirmRowId(null)}
                      className="text-xs px-3 py-1.5 border border-cream-200 text-charcoal-600 hover:text-charcoal-900 transition-colors"
                    >
                      No
                    </button>
                    <button
                      onClick={async () => {
                        setConfirmRowId(null);
                        await handleDelete(rowId);
                      }}
                      disabled={isDeleting}
                      className="text-xs px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
                    >
                      {isDeleting ? '…' : 'Yes, Delete'}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 border-t border-cream-100 pt-2.5">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="flex items-center gap-1.5 text-xs text-gold-500 hover:text-gold-600 font-medium transition-colors"
                    >
                      <Eye size={13} />
                      View Details
                    </button>
                    <span className="text-cream-300 text-sm">|</span>
                    <button
                      onClick={() => setConfirmRowId(rowId)}
                      disabled={isDeleting}
                      className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 font-medium transition-colors disabled:opacity-40"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Mobile pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between py-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 text-sm text-charcoal-600 hover:text-charcoal-900 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={16} />
              Prev
            </button>
            <span className="text-xs text-charcoal-500">
              {page} / {pagination.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="flex items-center gap-1 text-sm text-charcoal-600 hover:text-charcoal-900 disabled:opacity-30 transition-colors"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selectedOrder && (
          <DetailModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onDelete={async (id) => {
              await handleDelete(id);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

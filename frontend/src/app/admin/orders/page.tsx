'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search } from 'lucide-react';
import { orderAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
const STATUS_COLORS: Record<string, string> = {
  placed: 'text-yellow-400 bg-yellow-900/30',
  confirmed: 'text-blue-400 bg-blue-900/30',
  processing: 'text-purple-400 bg-purple-900/30',
  shipped: 'text-cyan-400 bg-cyan-900/30',
  out_for_delivery: 'text-orange-400 bg-orange-900/30',
  delivered: 'text-green-400 bg-green-900/30',
  cancelled: 'text-red-400 bg-red-900/30',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [updateForm, setUpdateForm] = useState({ orderStatus: '', trackingNumber: '', notes: '' });
  const [updating, setUpdating] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      const res = await orderAPI.getAllOrders(params);
      setOrders(res.data.orders || []);
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, [page, search, filterStatus]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const openOrder = (order: any) => {
    setSelectedOrder(order);
    setUpdateForm({ orderStatus: order.orderStatus, trackingNumber: order.trackingNumber || '', notes: order.notes || '' });
  };

  const handleUpdate = async () => {
    if (!selectedOrder) return;
    setUpdating(true);
    try {
      await orderAPI.updateOrder(selectedOrder._id, updateForm);
      toast.success('Order updated');
      setSelectedOrder(null);
      fetchOrders();
    } catch { toast.error('Update failed'); }
    finally { setUpdating(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-display text-charcoal-900">Orders</h1>
          <p className="text-sm text-charcoal-500 mt-0.5">{pagination.total} total orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-500" />
          <input type="text" placeholder="Search by order ID..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-cream-200 text-charcoal-900 text-sm pl-9 pr-4 py-2.5 focus:outline-none focus:border-gold-400 placeholder-charcoal-500" />
        </div>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          className="bg-white border border-cream-200 text-charcoal-900 text-sm px-3 py-2.5 focus:outline-none focus:border-gold-400">
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-cream-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-cream-50 border-b border-cream-200">
            <tr>
              {['Order ID', 'Customer', 'Items', 'Amount', 'Payment', 'Status', 'Date', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-charcoal-600 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-charcoal-800">
            {loading ? Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="animate-pulse"><td colSpan={8} className="px-4 py-4"><div className="h-4 bg-cream-50 rounded" /></td></tr>
            )) : orders.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-charcoal-500">No orders found</td></tr>
            ) : orders.map(order => (
              <tr key={order._id} className="hover:bg-cream-50/50 transition-colors">
                <td className="px-4 py-3 font-mono text-gold-400 text-xs">{order.orderId}</td>
                <td className="px-4 py-3">
                  <p className="text-charcoal-900">{order.user?.name || 'Guest'}</p>
                  <p className="text-xs text-charcoal-500">{order.user?.email}</p>
                </td>
                <td className="px-4 py-3 text-charcoal-600">{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</td>
                <td className="px-4 py-3 font-semibold text-charcoal-900">₹{order.totalAmount?.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 ${order.paymentStatus === 'paid' ? 'bg-green-900/30 text-green-400' : order.paymentStatus === 'failed' ? 'bg-red-900/30 text-red-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                    {order.paymentStatus}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 capitalize ${STATUS_COLORS[order.orderStatus] || 'text-charcoal-600'}`}>
                    {order.orderStatus?.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-charcoal-500 text-xs">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                <td className="px-4 py-3">
                  <button onClick={() => openOrder(order)} className="text-xs text-gold-400 hover:underline">Manage →</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {pagination.pages > 1 && (
          <div className="flex justify-center gap-1 p-4 border-t border-cream-200">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 text-xs transition-colors ${p === page ? 'bg-gold-500 text-charcoal-900' : 'bg-cream-50 text-charcoal-600 hover:bg-charcoal-700'}`}>{p}</button>
            ))}
          </div>
        )}
      </div>

      {/* Order detail modal */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-50" onClick={() => setSelectedOrder(null)} />
            <motion.div initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white border-l border-cream-200 z-50 flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-cream-200">
                <div>
                  <h2 className="text-lg font-display text-charcoal-900">Order Details</h2>
                  <p className="text-xs text-gold-400 font-mono">{selectedOrder.orderId}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="text-charcoal-600 hover:text-charcoal-900"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                {/* Customer */}
                <div>
                  <h3 className="text-xs text-charcoal-500 uppercase tracking-wide mb-2">Customer</h3>
                  <p className="text-charcoal-900">{selectedOrder.user?.name}</p>
                  <p className="text-sm text-charcoal-600">{selectedOrder.user?.email}</p>
                </div>

                {/* Items */}
                <div>
                  <h3 className="text-xs text-charcoal-500 uppercase tracking-wide mb-2">Items</h3>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-charcoal-700 truncate flex-1 mr-3">{item.title} × {item.quantity}</span>
                        <span className="text-charcoal-900 flex-shrink-0">₹{item.total?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-cream-200 mt-3 pt-3 space-y-1">
                    <div className="flex justify-between text-sm text-charcoal-600"><span>Shipping</span><span>₹{selectedOrder.shippingCharge}</span></div>
                    {selectedOrder.discount > 0 && <div className="flex justify-between text-sm text-green-400"><span>Discount ({selectedOrder.couponCode})</span><span>-₹{selectedOrder.discount}</span></div>}
                    <div className="flex justify-between font-bold text-charcoal-900"><span>Total</span><span>₹{selectedOrder.totalAmount?.toLocaleString()}</span></div>
                  </div>
                </div>

                {/* Shipping address */}
                <div>
                  <h3 className="text-xs text-charcoal-500 uppercase tracking-wide mb-2">Shipping Address</h3>
                  <div className="text-sm text-charcoal-700 space-y-0.5">
                    <p>{selectedOrder.shippingAddress?.fullName}</p>
                    <p>{selectedOrder.shippingAddress?.phone}</p>
                    <p>{selectedOrder.shippingAddress?.line1}{selectedOrder.shippingAddress?.line2 ? `, ${selectedOrder.shippingAddress.line2}` : ''}</p>
                    <p>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pincode}</p>
                  </div>
                </div>

                {/* Update status */}
                <div className="space-y-3">
                  <h3 className="text-xs text-charcoal-500 uppercase tracking-wide">Update Order</h3>
                  <div>
                    <label className="block text-xs text-charcoal-600 mb-1.5">Status</label>
                    <select value={updateForm.orderStatus} onChange={e => setUpdateForm(p => ({ ...p, orderStatus: e.target.value }))}
                      className="w-full bg-cream-50 border border-cream-200 text-charcoal-900 text-sm px-3 py-2.5 focus:outline-none focus:border-gold-400">
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-charcoal-600 mb-1.5">Tracking Number</label>
                    <input type="text" value={updateForm.trackingNumber} onChange={e => setUpdateForm(p => ({ ...p, trackingNumber: e.target.value }))}
                      className="w-full bg-cream-50 border border-cream-200 text-charcoal-900 text-sm px-3 py-2.5 focus:outline-none focus:border-gold-400" />
                  </div>
                  <div>
                    <label className="block text-xs text-charcoal-600 mb-1.5">Notes</label>
                    <textarea value={updateForm.notes} onChange={e => setUpdateForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                      className="w-full bg-cream-50 border border-cream-200 text-charcoal-900 text-sm px-3 py-2.5 focus:outline-none focus:border-gold-400 resize-none" />
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-cream-200">
                <button onClick={handleUpdate} disabled={updating} id="update-order-btn" className="w-full py-3 bg-gold-500 hover:bg-gold-600 text-white font-medium text-sm transition-colors disabled:opacity-50">
                  {updating ? 'Updating...' : 'Update Order'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

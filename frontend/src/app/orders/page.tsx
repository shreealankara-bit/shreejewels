'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { orderAPI } from '@/lib/api';
import { Package, ChevronRight } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  placed: 'text-yellow-600 bg-yellow-50',
  confirmed: 'text-blue-600 bg-blue-50',
  processing: 'text-purple-600 bg-purple-50',
  shipped: 'text-cyan-600 bg-cyan-50',
  out_for_delivery: 'text-orange-600 bg-orange-50',
  delivered: 'text-green-600 bg-green-50',
  cancelled: 'text-red-600 bg-red-50',
};

export default function OrdersPage() {
  const { isLoggedIn, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !isLoggedIn) router.push('/auth/login?redirect=/orders');
    if (isLoggedIn) {
      orderAPI.getMyOrders().then(res => setOrders(res.data.orders || [])).catch(() => {}).finally(() => setFetching(false));
    }
  }, [loading, isLoggedIn]);

  if (loading || fetching) return <div className="min-h-screen flex items-center justify-center"><div className="text-gold-500">Loading...</div></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-2xl text-charcoal-900 mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <Package size={60} className="text-charcoal-200 mx-auto mb-4" />
          <p className="font-display text-xl text-charcoal-600 mb-2">No orders yet</p>
          <p className="text-sm text-charcoal-400 mb-5">Start shopping to see your orders here</p>
          <Link href="/products" className="btn-gold">Browse Products</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Link key={order._id} href={`/orders/${order._id}`} className="block bg-white border border-charcoal-100 hover:border-gold-300 p-4 transition-colors group">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="font-mono text-sm font-bold text-gold-600">{order.orderId}</p>
                  <p className="text-xs text-charcoal-500 mt-0.5">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-medium px-2.5 py-1 capitalize ${STATUS_COLORS[order.orderStatus] || 'text-charcoal-500 bg-charcoal-50'}`}>
                    {order.orderStatus?.replace(/_/g, ' ')}
                  </span>
                  <span className="font-semibold text-charcoal-900">₹{order.totalAmount?.toLocaleString()}</span>
                  <ChevronRight size={16} className="text-charcoal-400 group-hover:text-gold-500 transition-colors" />
                </div>
              </div>
              <p className="text-sm text-charcoal-500 mt-2">{order.items?.length} item(s)</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

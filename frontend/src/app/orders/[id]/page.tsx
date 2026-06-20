'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { orderAPI } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  placed: 'text-yellow-600 bg-yellow-50',
  confirmed: 'text-blue-600 bg-blue-50',
  processing: 'text-purple-600 bg-purple-50',
  shipped: 'text-cyan-600 bg-cyan-50',
  out_for_delivery: 'text-orange-600 bg-orange-50',
  delivered: 'text-green-600 bg-green-50',
  cancelled: 'text-red-600 bg-red-50',
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const { loading, isLoggedIn } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !isLoggedIn) router.push(`/auth/login?redirect=/orders/${id}`);
  }, [loading, isLoggedIn, router, id]);

  useEffect(() => {
    if (!isLoggedIn) return;
    orderAPI.getOrder(id)
      .then((res) => setOrder(res.data.order))
      .catch(() => setOrder(null))
      .finally(() => setFetching(false));
  }, [isLoggedIn, id]);

  if (loading || fetching) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-gold-500">Loading...</div></div>;
  }

  if (!order) {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <Package size={56} className="text-charcoal-200 mx-auto mb-4" />
        <h1 className="font-display text-2xl text-charcoal-800 mb-2">Order not found</h1>
        <Link href="/orders" className="btn-gold mt-4 inline-block">Back to Orders</Link>
      </main>
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const status = order.orderStatus || 'placed';

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/orders" className="inline-flex items-center gap-2 text-sm text-charcoal-500 hover:text-gold-600 mb-6">
        <ArrowLeft size={16} /> Back to orders
      </Link>

      <div className="bg-white border border-charcoal-100 p-5 sm:p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-gold-600 mb-2">Order Details</p>
            <h1 className="font-display text-2xl text-charcoal-900">{order.orderId}</h1>
            <p className="text-sm text-charcoal-500 mt-1">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <span className={`text-xs font-medium px-3 py-1.5 capitalize ${STATUS_COLORS[status] || 'text-charcoal-500 bg-charcoal-50'}`}>
            {status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_280px] gap-6">
        <section className="bg-white border border-charcoal-100 p-5 sm:p-6">
          <h2 className="font-display text-xl text-charcoal-900 mb-4">Items</h2>
          <div className="space-y-4">
            {items.map((item: any, index: number) => (
              <div key={`${item.productId || item.title}-${index}`} className="flex justify-between gap-4 border-b border-charcoal-100 pb-4 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium text-charcoal-800">{item.title || item.name || 'Product'}</p>
                  <p className="text-xs text-charcoal-500 mt-1">Qty: {item.quantity || 1}</p>
                </div>
                <p className="font-semibold text-charcoal-900">₹{Number(item.price || item.discountPrice || 0).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </section>

        <aside className="bg-white border border-charcoal-100 p-5 sm:p-6 h-fit">
          <h2 className="font-display text-xl text-charcoal-900 mb-4">Summary</h2>
          <div className="space-y-2 text-sm text-charcoal-600">
            <div className="flex justify-between"><span>Subtotal</span><span>₹{Number(order.subtotal || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Discount</span><span>₹{Number(order.discount || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>₹{Number(order.shippingCharge || 0).toLocaleString()}</span></div>
            <div className="flex justify-between border-t border-charcoal-100 pt-3 mt-3 font-semibold text-charcoal-900">
              <span>Total</span><span>₹{Number(order.totalAmount || 0).toLocaleString()}</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}


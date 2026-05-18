'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { orderAPI, productAPI } from '@/lib/api';
import { ShoppingCart, Package, TrendingUp, DollarSign, AlertCircle, Clock } from 'lucide-react';

interface Stats {
  totalOrders: number;
  todayOrders: number;
  monthOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  deliveredOrders: number;
}

interface ProductStats {
  total: number;
  active: number;
  outOfStock: number;
  featured: number;
}

export default function AdminDashboard() {
  const [orderStats, setOrderStats] = useState<Stats | null>(null);
  const [productStats, setProductStats] = useState<ProductStats | null>(null);

  useEffect(() => {
    orderAPI.getStats().then(res => setOrderStats(res.data.stats)).catch(() => {});
    productAPI.getStats().then(res => setProductStats(res.data.stats)).catch(() => {});
  }, []);

  const StatCard = ({ title, value, sub, icon: Icon, color, href }: any) => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-charcoal-200 p-5 rounded-sm shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-charcoal-500 uppercase tracking-wider mb-1">{title}</p>
          <p className={`text-2xl font-bold ${color || 'text-charcoal-900'}`}>{value ?? '—'}</p>
          {sub && <p className="text-xs text-charcoal-500 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 flex items-center justify-center rounded-sm bg-opacity-20 ${color ? 'bg-current' : 'bg-gold-500 bg-opacity-10'}`}>
          <Icon size={20} className={color || 'text-gold-400'} />
        </div>
      </div>
      {href && <Link href={href} className="text-xs text-gold-500 hover:underline mt-3 inline-block">View details →</Link>}
    </motion.div>
  );

  const QUICK_ACTIONS = [
    { label: '+ Add Product', href: '/admin/products?action=new', color: 'bg-gold-500 hover:bg-gold-600' },
    { label: '+ Add Category', href: '/admin/categories?action=new', color: 'bg-cream-100 hover:bg-cream-200 text-charcoal-900 border border-charcoal-200' },
    { label: '+ Add Banner', href: '/admin/banners?action=new', color: 'bg-cream-100 hover:bg-cream-200 text-charcoal-900 border border-charcoal-200' },
    { label: '+ Add Coupon', href: '/admin/coupons?action=new', color: 'bg-cream-100 hover:bg-cream-200 text-charcoal-900 border border-charcoal-200' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-display text-charcoal-900">Dashboard</h1>
        <p className="text-sm text-charcoal-500 mt-1">Welcome to your ShreeJewels admin panel</p>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        {QUICK_ACTIONS.map(a => (
          <Link key={a.href} href={a.href} className={`${a.color} ${a.color.includes('text-charcoal') ? '' : 'text-white'} text-sm font-medium px-4 py-2.5 transition-colors`}>{a.label}</Link>
        ))}
      </div>

      {/* Order stats */}
      <h2 className="text-xs text-charcoal-500 uppercase tracking-widest mb-4">Orders & Revenue</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard title="Total Revenue" value={orderStats ? `₹${orderStats.totalRevenue.toLocaleString()}` : null} icon={DollarSign} color="text-gold-600" href="/admin/orders" />
        <StatCard title="Total Orders" value={orderStats?.totalOrders} icon={ShoppingCart} href="/admin/orders" />
        <StatCard title="Today's Orders" value={orderStats?.todayOrders} icon={TrendingUp} color="text-blue-600" />
        <StatCard title="This Month" value={orderStats?.monthOrders} icon={TrendingUp} color="text-purple-600" />
        <StatCard title="Pending" value={orderStats?.pendingOrders} icon={Clock} color="text-yellow-600" href="/admin/orders?status=placed" />
        <StatCard title="Delivered" value={orderStats?.deliveredOrders} icon={ShoppingCart} color="text-gold-600" />
      </div>

      {/* Product stats */}
      <h2 className="text-xs text-charcoal-500 uppercase tracking-widest mb-4">Products</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Products" value={productStats?.total} icon={Package} href="/admin/products" />
        <StatCard title="Active" value={productStats?.active} icon={Package} color="text-gold-600" />
        <StatCard title="Out of Stock" value={productStats?.outOfStock} icon={AlertCircle} color="text-red-600" href="/admin/products?stock=0" />
        <StatCard title="Featured" value={productStats?.featured} icon={Package} color="text-gold-500" />
      </div>

      {/* Navigation cards */}
      <h2 className="text-xs text-charcoal-500 uppercase tracking-widest mb-4">Quick Access</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Products', href: '/admin/products', icon: Package },
          { label: 'Categories', href: '/admin/categories', icon: Package },
          { label: 'Banners', href: '/admin/banners', icon: Package },
          { label: 'Coupons', href: '/admin/coupons', icon: Package },
          { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
          { label: 'Users', href: '/admin/users', icon: Package },
        ].map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href} className="bg-white border border-charcoal-200 hover:border-gold-300 shadow-sm hover:shadow-md p-4 text-center transition-all group">
            <Icon size={24} className="text-charcoal-400 group-hover:text-gold-500 mx-auto mb-2 transition-colors" />
            <p className="text-sm text-charcoal-600 group-hover:text-charcoal-900 font-medium transition-colors">{label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

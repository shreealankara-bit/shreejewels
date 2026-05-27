'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { orderAPI, productAPI } from '@/lib/api';
import {
  ShoppingCart, Package, TrendingUp, DollarSign,
  AlertCircle, Clock, Tag, Image as ImageIcon, Ticket, Users, CheckCircle, BarChart2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

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
  const { user } = useAuth();
  const [orderStats, setOrderStats] = useState<Stats | null>(null);
  const [productStats, setProductStats] = useState<ProductStats | null>(null);

  useEffect(() => {
    orderAPI.getStats().then(res => setOrderStats(res.data.stats)).catch(() => {});
    productAPI.getStats().then(res => setProductStats(res.data.stats)).catch(() => {});
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const StatCard = ({ title, value, sub, icon: Icon, color = '', href }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white border border-charcoal-100 p-4 sm:p-5 rounded-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs text-charcoal-500 uppercase tracking-wider mb-1 truncate">{title}</p>
          <p className={`text-xl sm:text-2xl font-bold ${color || 'text-charcoal-900'}`}>
            {value ?? <span className="inline-block w-12 h-6 bg-cream-100 rounded animate-pulse" />}
          </p>
          {sub && <p className="text-xs text-charcoal-500 mt-1">{sub}</p>}
        </div>
        <div className={`w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 flex items-center justify-center rounded-sm ${color ? 'bg-current/10' : 'bg-gold-500/10'}`}>
          <Icon size={18} className={color || 'text-gold-400'} />
        </div>
      </div>
      {href && (
        <Link href={href} className="text-xs text-gold-500 hover:underline mt-3 inline-block">
          View details →
        </Link>
      )}
    </motion.div>
  );

  const QUICK_ACTIONS = [
    { label: '+ Add Product', href: '/admin/products?action=new', icon: Package, primary: true },
    { label: '+ Add Category', href: '/admin/categories?action=new', icon: Tag, primary: false },
    { label: '+ Add Banner', href: '/admin/banners?action=new', icon: ImageIcon, primary: false },
    { label: '+ Add Coupon', href: '/admin/coupons?action=new', icon: Ticket, primary: false },
  ];

  const NAV_CARDS = [
    { label: 'Products', href: '/admin/products', icon: Package, badge: productStats?.total },
    { label: 'Categories', href: '/admin/categories', icon: Tag, badge: null },
    { label: 'Banners', href: '/admin/banners', icon: ImageIcon, badge: null },
    { label: 'Coupons', href: '/admin/coupons', icon: Ticket, badge: null },
    { label: 'Orders', href: '/admin/orders', icon: ShoppingCart, badge: orderStats?.pendingOrders, badgeColor: 'bg-yellow-500' },
    { label: 'Users', href: '/admin/users', icon: Users, badge: null },
  ];

  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs text-charcoal-500 uppercase tracking-widest mb-1">{greeting}</p>
        <h1 className="text-xl sm:text-2xl font-display text-charcoal-900">{user?.name} 👋</h1>
        <p className="text-sm text-charcoal-500 mt-0.5">Here's your ShreeJewels store at a glance</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 mb-8">
        {QUICK_ACTIONS.map(a => (
          <Link
            key={a.href}
            href={a.href}
            className={`
              flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium px-3 sm:px-4 py-2.5 transition-all
              ${a.primary
                ? 'bg-gold-500 hover:bg-gold-600 text-white'
                : 'bg-white border border-charcoal-200 hover:border-gold-300 text-charcoal-700 hover:text-charcoal-900'
              }
            `}
          >
            <a.icon size={13} />
            <span className="truncate">{a.label}</span>
          </Link>
        ))}
      </div>

      {/* Revenue highlight */}
      {orderStats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-charcoal-900 to-charcoal-800 text-white p-5 sm:p-6 mb-6 rounded-sm"
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs text-charcoal-300 uppercase tracking-widest mb-1">Total Revenue</p>
              <p className="text-3xl sm:text-4xl font-bold text-gold-400">₹{orderStats.totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-charcoal-400 mt-1">{orderStats.totalOrders} orders • {orderStats.deliveredOrders} delivered</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-charcoal-300 mb-1">
                <TrendingUp size={14} className="text-green-400" />
                Today: <span className="text-white font-semibold">{orderStats.todayOrders}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-charcoal-300">
                <BarChart2 size={14} className="text-blue-400" />
                This month: <span className="text-white font-semibold">{orderStats.monthOrders}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Order stats */}
      <p className="text-[10px] text-charcoal-400 uppercase tracking-widest mb-3 font-semibold">Orders</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
        <StatCard title="Pending" value={orderStats?.pendingOrders} icon={Clock} color="text-yellow-600" href="/admin/orders?status=placed" />
        <StatCard title="Delivered" value={orderStats?.deliveredOrders} icon={CheckCircle} color="text-green-600" />
        <StatCard title="Today" value={orderStats?.todayOrders} icon={TrendingUp} color="text-blue-600" />
        <StatCard title="This Month" value={orderStats?.monthOrders} icon={BarChart2} color="text-purple-600" />
      </div>

      {/* Product stats */}
      <p className="text-[10px] text-charcoal-400 uppercase tracking-widest mb-3 font-semibold">Products</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard title="Total" value={productStats?.total} icon={Package} href="/admin/products" />
        <StatCard title="Active" value={productStats?.active} icon={Package} color="text-gold-600" />
        <StatCard title="Out of Stock" value={productStats?.outOfStock} icon={AlertCircle} color="text-red-500" href="/admin/products?stock=0" />
        <StatCard title="Featured" value={productStats?.featured} icon={Package} color="text-gold-500" />
      </div>

      {/* Quick access nav cards */}
      <p className="text-[10px] text-charcoal-400 uppercase tracking-widest mb-3 font-semibold">Quick Access</p>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
        {NAV_CARDS.map(({ label, href, icon: Icon, badge, badgeColor }) => (
          <Link
            key={href}
            href={href}
            className="bg-white border border-charcoal-100 hover:border-gold-300 hover:shadow-md p-3 sm:p-4 text-center transition-all group relative"
          >
            {badge != null && badge > 0 && (
              <span className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[9px] font-bold text-white rounded-full ${badgeColor || 'bg-charcoal-500'}`}>
                {badge}
              </span>
            )}
            <Icon size={20} className="text-charcoal-400 group-hover:text-gold-500 mx-auto mb-2 transition-colors" />
            <p className="text-[11px] sm:text-xs text-charcoal-600 group-hover:text-charcoal-900 font-medium transition-colors leading-tight">{label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

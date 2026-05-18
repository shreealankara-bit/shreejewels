'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, Package, Tag, Image as ImageIcon, Ticket, ShoppingCart, Users, LogOut, Menu, X, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: Tag },
  { href: '/admin/banners', label: 'Banners', icon: ImageIcon },
  { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/users', label: 'Users', icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) router.push('/auth/login?redirect=/admin');
  }, [loading, user, isAdmin]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-cream-50 text-gold-500">Loading admin...</div>;
  if (!user || !isAdmin) return null;

  return (
    <div className="flex h-screen bg-cream-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative z-50 h-full w-64 bg-white border-r border-charcoal-200 flex flex-col transition-transform duration-300`}>
        {/* Logo */}
          <div className="p-5 border-b border-charcoal-200 flex items-center justify-between">
          <div>
            <Link href="/admin">
              <Image src="/Logo_Main.png" alt="Shree Alankara" width={160} height={80} className="h-20 w-auto object-contain" />
            </Link>
            <p className="text-xs text-charcoal-500 mt-0.5">Admin Panel</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-charcoal-600"><X size={18} /></button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-5 py-3 text-sm text-charcoal-600 hover:text-charcoal-900 hover:bg-cream-50 transition-colors group"
            >
              <Icon size={17} className="group-hover:text-gold-500 transition-colors" />
              {label}
              <ChevronRight size={13} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </nav>

        {/* User + logout */}
        <div className="border-t border-charcoal-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center text-white text-sm font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-charcoal-900 font-medium truncate">{user.name}</p>
              <p className="text-xs text-charcoal-500 capitalize">{user.role}</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-sm text-charcoal-500 hover:text-red-400 transition-colors">
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay (mobile) */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-charcoal-200 px-5 py-3.5 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-charcoal-600 hover:text-charcoal-900">
            <Menu size={22} />
          </button>
          <div className="flex-1">
            <p className="text-sm text-charcoal-500">Welcome back, <span className="text-charcoal-900 font-medium">{user.name}</span></p>
          </div>
          <Link href="/" target="_blank" className="text-xs text-gold-500 hover:underline hidden sm:block">View Site →</Link>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-cream-50 p-5 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

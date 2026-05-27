'use client';
import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard, Package, Tag, Image as ImageIcon,
  Ticket, ShoppingCart, Users, LogOut, Menu, X,
  ChevronRight, ExternalLink
} from 'lucide-react';
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

// Only first 5 shown in bottom tab bar on mobile
const BOTTOM_TAB_ITEMS = NAV_ITEMS.slice(0, 5);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) router.push('/auth/login?redirect=/admin');
  }, [loading, user, isAdmin]);

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-cream-50 gap-3">
      <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-charcoal-500">Loading admin panel...</p>
    </div>
  );
  if (!user || !isAdmin) return null;

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  return (
    <div className="flex h-screen bg-cream-50 overflow-hidden">

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        fixed lg:relative z-50 h-full w-64 bg-white border-r border-charcoal-100
        flex flex-col transition-transform duration-300 ease-in-out shadow-xl lg:shadow-none
      `}>
        {/* Logo */}
        <div className="px-5 py-4 border-b border-charcoal-100 flex items-center justify-between">
          <Link href="/admin">
            <Image src="/Logo_Main.png" alt="ShreeJewels" width={140} height={70} className="h-14 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-gold-500/10 text-gold-600 font-bold px-2 py-0.5 rounded uppercase tracking-wider">Admin</span>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-charcoal-500 hover:text-charcoal-900 p-1">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex items-center gap-3 px-4 py-3 mx-2 rounded-md text-sm transition-all group mb-0.5
                  ${active
                    ? 'bg-gold-500/10 text-gold-600 font-semibold'
                    : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-charcoal-50'
                  }
                `}
              >
                <Icon size={17} className={active ? 'text-gold-500' : 'group-hover:text-gold-400 transition-colors'} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight size={13} className="text-gold-400" />}
              </Link>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="border-t border-charcoal-100 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-charcoal-900 font-semibold truncate">{user.name}</p>
              <p className="text-xs text-charcoal-500 capitalize">{user.role}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/" target="_blank" className="flex items-center gap-1.5 text-xs text-charcoal-500 hover:text-gold-500 transition-colors">
              <ExternalLink size={12} /> View Site
            </Link>
            <span className="text-charcoal-300">|</span>
            <button onClick={logout} className="flex items-center gap-1.5 text-xs text-charcoal-500 hover:text-red-500 transition-colors">
              <LogOut size={12} /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* ── MOBILE OVERLAY ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="bg-white border-b border-charcoal-100 px-4 py-3 flex items-center gap-3 lg:gap-4 flex-shrink-0">
          {/* Hamburger (mobile) */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-charcoal-700 hover:text-charcoal-900 p-1 -ml-1"
            aria-label="Open sidebar"
          >
            <Menu size={22} />
          </button>

          {/* Mobile logo */}
          <Link href="/admin" className="lg:hidden">
            <Image src="/Logo_Main.png" alt="ShreeJewels" width={100} height={50} className="h-9 w-auto object-contain" />
          </Link>

          {/* Page title area */}
          <div className="flex-1 hidden lg:block">
            <p className="text-sm text-charcoal-500">
              Welcome back, <span className="text-charcoal-900 font-semibold">{user.name}</span>
            </p>
          </div>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 text-xs text-gold-500 hover:text-gold-600 border border-gold-200 hover:border-gold-400 px-3 py-1.5 transition-all"
            >
              <ExternalLink size={12} /> View Site
            </Link>
            {/* Mobile user avatar */}
            <div className="lg:hidden w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white text-xs font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content — extra bottom padding on mobile for tab bar */}
        <main className="flex-1 overflow-y-auto bg-cream-50 p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
          {children}
        </main>

        {/* ── MOBILE BOTTOM TAB BAR ── */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-charcoal-100 z-30 flex items-stretch shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          {BOTTOM_TAB_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 px-1 text-center transition-colors min-w-0
                  ${active ? 'text-gold-500' : 'text-charcoal-400 hover:text-charcoal-700'}
                `}
              >
                <div className={`relative p-1 rounded-lg transition-colors ${active ? 'bg-gold-500/10' : ''}`}>
                  <Icon size={20} />
                  {active && (
                    <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-gold-500 rounded-full" />
                  )}
                </div>
                <span className="text-[10px] font-medium leading-none truncate w-full text-center">{label}</span>
              </Link>
            );
          })}
          {/* "More" button to open sidebar with remaining items */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 px-1 text-charcoal-400 hover:text-charcoal-700 transition-colors"
          >
            <div className="p-1 rounded-lg">
              <Menu size={20} />
            </div>
            <span className="text-[10px] font-medium leading-none">More</span>
          </button>
        </nav>
      </div>
    </div>
  );
}

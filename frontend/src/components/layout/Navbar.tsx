'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, User, Heart, Menu, X, ChevronDown } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { categoryAPI } from '@/lib/api';
import { categoryHref, subCategoryHref } from '@/lib/categoryLinks';
import { useRouter } from 'next/navigation';

interface Category {
  _id: string;
  name: string;
  slug: string;
  subcategories?: Category[];
}

export default function Navbar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { cartCount, toggleCart } = useCart();
  const { user, isLoggedIn, logout } = useAuth();
  const searchRef = useRef<HTMLInputElement>(null);
  const [announcementIndex, setAnnouncementIndex] = useState(0);

  const announcements = [
    '✨ Free Shipping on Orders Above ₹999',
    '🎁 At ₹1299: Free Jewellery Organiser',
    '💎 Use Code SHREE10 for 10% off your first order',
  ];

  useEffect(() => {
    const timer = setInterval(() => setAnnouncementIndex(i => (i + 1) % announcements.length), 3500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    categoryAPI.getAll({ activeOnly: 'true', flat: 'false' })
      .then(res => setCategories(res.data.categories || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  const westernHref = categoryHref(categories, ['Western', 'Western Collection'], '/products?search=western');
  const traditionalHref = categoryHref(categories, ['Traditional / Indo Western', 'Traditional', 'Traditional Jewellery'], '/products?search=traditional');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      {/* Announcement bar */}
      <div className="announcement-bar">
        <div className="announcement-inner">
          <button className="announcement-arrow" onClick={() => setAnnouncementIndex(i => (i - 1 + announcements.length) % announcements.length)}>‹</button>
          <AnimatePresence mode="wait">
            <motion.span
              key={announcementIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="announcement-text"
            >
              {announcements[announcementIndex]}
            </motion.span>
          </AnimatePresence>
          <button className="announcement-arrow" onClick={() => setAnnouncementIndex(i => (i + 1) % announcements.length)}>›</button>
        </div>
      </div>

      <header className={`navbar-root ${scrolled ? 'navbar-scrolled' : ''}`}>
        <div className="navbar-inner">
          {/* Mobile: hamburger */}
          <button id="mobile-menu-btn" className="navbar-mobile-trigger" onClick={() => setMobileOpen(true)}>
            <Menu size={22} />
          </button>

          {/* Logo */}
          <Link href="/" className="navbar-logo">
            <Image src="/Logo_Main.png" alt="Shree Alankara" width={240} height={120} className="h-24 w-auto object-contain" style={{width:'auto'}} priority />
          </Link>

          {/* Desktop nav */}
          <nav className="navbar-nav">
            <Link href="/" className="nav-link">Home</Link>

            {/* Shop By Category with mega dropdown */}
            <div
              className="nav-dropdown-wrapper"
              onMouseEnter={() => setActiveMenu('cats')}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <button className="nav-link nav-link-btn">
                Shop By Category <ChevronDown size={13} className={`nav-chevron ${activeMenu === 'cats' ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {activeMenu === 'cats' && categories.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.18 }}
                    className="nav-mega-dropdown"
                  >
                    <div className="mega-grid">
                      {categories.map(cat => (
                        <div key={cat._id} className="mega-col">
                          <Link href={`/products?category=${cat._id}`} className="mega-heading">
                            {cat.name}
                          </Link>
                          {cat.subcategories?.slice(0, 6).map(sub => (
                            <Link key={sub._id} href={subCategoryHref(cat, sub)} className="mega-link">
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href="/products?newArrival=true" className="nav-link">New Launch</Link>
            <Link href={westernHref} className="nav-link">Western</Link>
            <Link href={traditionalHref} className="nav-link">Traditional</Link>
            <Link href="/products?bestseller=true" className="nav-link">Best Sellers</Link>
          </nav>

          {/* Right icons */}
          <div className="navbar-actions">
            <button id="search-btn" className="nav-icon-btn" onClick={() => setSearchOpen(s => !s)} aria-label="Search">
              <Search size={19} />
            </button>

            <div className="relative">
              <button id="user-menu-btn" className="nav-icon-btn" onClick={() => setUserMenuOpen(s => !s)} aria-label="Account">
                {user?.avatar ? (
                  <Image src={user.avatar} alt={user.name} width={26} height={26} className="rounded-full" />
                ) : (
                  <User size={19} />
                )}
              </button>
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                    className="user-dropdown"
                    onMouseLeave={() => setUserMenuOpen(false)}
                  >
                    {isLoggedIn ? (
                      <>
                        <div className="user-dropdown-header">
                          <p className="user-dropdown-name">{user?.name}</p>
                          <p className="user-dropdown-email">{user?.email}</p>
                        </div>
                        {[
                          { label: 'My Orders', href: '/orders' },
                          { label: 'Wishlist', href: '/wishlist' },
                          { label: 'My Profile', href: '/profile' },
                        ].map(l => (
                          <Link key={l.href} href={l.href} onClick={() => setUserMenuOpen(false)} className="user-dropdown-link">{l.label}</Link>
                        ))}
                        <button onClick={() => { logout(); setUserMenuOpen(false); }} className="user-dropdown-link text-red-500 w-full text-left">Sign Out</button>
                      </>
                    ) : (
                      <>
                        <Link href="/auth/login" onClick={() => setUserMenuOpen(false)} className="user-dropdown-link font-medium">Sign In</Link>
                        <Link href="/auth/login?tab=register" onClick={() => setUserMenuOpen(false)} className="user-dropdown-link">Create Account</Link>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href="/wishlist" className="nav-icon-btn relative" aria-label="Wishlist">
              <Heart size={19} />
            </Link>

            <button id="cart-btn" className="nav-icon-btn relative" onClick={toggleCart} aria-label="Cart">
              <ShoppingBag size={19} />
              {cartCount > 0 && (
                <motion.span key={cartCount} initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="nav-cart-badge">
                  {cartCount > 9 ? '9+' : cartCount}
                </motion.span>
              )}
            </button>
          </div>
        </div>

        {/* Search bar dropdown */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="search-bar-container"
            >
              <form onSubmit={handleSearch} className="search-form">
                <Search size={17} className="search-icon" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search earrings, necklaces, kundan sets..."
                  className="search-input"
                />
                <button type="submit" className="search-submit">Search</button>
                <button type="button" onClick={() => setSearchOpen(false)} className="search-close"><X size={16} /></button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="mobile-overlay" onClick={() => setMobileOpen(false)} />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.28 }}
              className="mobile-drawer"
            >
              <div className="mobile-drawer-header">
                <Link href="/" onClick={() => setMobileOpen(false)}>
                  <Image src="/Logo_Main.png" alt="Shree Alankara" width={180} height={90} className="h-16 w-auto object-contain" style={{width:'auto'}} />
                </Link>
                <button onClick={() => setMobileOpen(false)}><X size={20} /></button>
              </div>

              {isLoggedIn ? (
                <div className="mobile-user-block">
                  <p className="font-medium text-charcoal-800 text-sm">{user?.name}</p>
                  <p className="text-xs text-charcoal-500">{user?.email}</p>
                </div>
              ) : (
                <div className="mobile-auth-block">
                  <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="mobile-signin-btn">Sign In</Link>
                  <Link href="/auth/login?tab=register" onClick={() => setMobileOpen(false)} className="mobile-register-link">Create Account</Link>
                </div>
              )}

              <nav className="mobile-nav">
                {[
                  { label: 'Home', href: '/' },
                  { label: 'New Launch', href: '/products?newArrival=true' },
                  { label: 'Western Jewellery', href: westernHref },
                  { label: 'Traditional Jewellery', href: traditionalHref },
                  { label: 'Best Sellers', href: '/products?bestseller=true' },
                  { label: 'All Products', href: '/products' },
                ].map(l => (
                  <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="mobile-nav-link">{l.label}</Link>
                ))}
                <div className="mobile-nav-divider" />
                {categories.map(cat => (
                  <div key={cat._id}>
                    <Link href={`/products?category=${cat._id}`} onClick={() => setMobileOpen(false)} className="mobile-nav-link mobile-nav-cat">{cat.name}</Link>
                    {cat.subcategories?.map(sub => (
                      <Link key={sub._id} href={subCategoryHref(cat, sub)} onClick={() => setMobileOpen(false)} className="mobile-nav-sub">— {sub.name}</Link>
                    ))}
                  </div>
                ))}
              </nav>

              {isLoggedIn && (
                <div className="mobile-drawer-footer">
                  <Link href="/orders" onClick={() => setMobileOpen(false)} className="mobile-nav-link">My Orders</Link>
                  <Link href="/wishlist" onClick={() => setMobileOpen(false)} className="mobile-nav-link">Wishlist</Link>
                  <button onClick={() => { logout(); setMobileOpen(false); }} className="mobile-nav-link text-red-500 w-full text-left">Sign Out</button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

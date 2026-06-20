'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { categoryAPI } from '@/lib/api';
import { categoryHref } from '@/lib/categoryLinks';

export default function Footer() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919876543210';
  const [categories, setCategories] = useState<any[]>([]);
  const westernHref = categoryHref(categories, ['Western', 'Western Collection'], '/products?search=western');
  const traditionalHref = categoryHref(categories, ['Traditional / Indo Western', 'Traditional', 'Traditional Jewellery'], '/products?search=traditional');

  useEffect(() => {
    categoryAPI.getAll({ activeOnly: 'true', flat: 'false' })
      .then(res => setCategories(res.data.categories || []))
      .catch(() => {});
  }, []);

  return (
    <footer className="footer-root">
      <div className="footer-top">
        {/* Brand */}
        <div>
          <div className="footer-logo">
            <Link href="/">
              <Image src="/Logo_Main.png" alt="Shree Alankara" width={220} height={110} className="h-20 w-auto object-contain" />
            </Link>
          </div>
          <p className="footer-desc">Premium jewellery for every occasion — from everyday elegance to bridal splendour. Crafted with love, delivered with care.</p>
          <div className="footer-social">
            <a href="https://instagram.com/shreealankara" target="_blank" rel="noreferrer" className="footer-social-icon" aria-label="Instagram">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="20" x="2" y="2" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </a>
            <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" className="footer-social-icon" aria-label="WhatsApp">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
            </a>
          </div>
        </div>

        {/* Shop */}
        <div>
          <p className="footer-heading">Shop</p>
          {[
            ['Western Jewellery', westernHref],
            ['Traditional', traditionalHref],
            ['New Arrivals', '/products?newArrival=true'],
            ['Best Sellers', '/products?bestseller=true'],
            ['All Products', '/products'],
          ].map(([l, h]) => <Link key={h} href={h} className="footer-link">{l}</Link>)}
        </div>

        {/* Help */}
        <div>
          <p className="footer-heading">Help</p>
          {[
            ['My Orders', '/orders'],
            ['FAQ', '/faq'],
            ['Shipping Policy', '/shipping'],
            ['Returns & Refunds', '/returns'],
            ['Contact Us', '/contact'],
            ['Privacy Policy', '/privacy'],
            ['Terms of Service', '/terms'],
          ].map(([l, h]) => <Link key={h} href={h} className="footer-link">{l}</Link>)}
        </div>

        {/* Contact */}
        <div>
          <p className="footer-heading">Contact</p>
          <p className="footer-link" style={{ cursor: 'default' }}>📍 Hyderabad, Telangana</p>
          <a href="tel:+919876543210" className="footer-link">📞 +91 98765 43210</a>
          <a href="mailto:shreealankara@gmail.com" className="footer-link">✉️ shreealankara@gmail.com</a>
          <div style={{ marginTop: 16 }}>
            <p className="footer-heading" style={{ marginBottom: 8 }}>We Accept</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['UPI', 'Visa', 'Mastercard', 'RuPay', 'NetBanking'].map(p => (
                <span key={p} style={{ fontSize: '.68rem', background: '#2a2a2a', color: '#888', padding: '2px 8px', borderRadius: 2 }}>{p}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} ShreeJewels. All rights reserved.</span>
        <a
          href="https://www.staffarc.in/"
          target="_blank"
          rel="noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'inherit', textDecoration: 'none', opacity: 0.75, transition: 'opacity 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.75')}
        >
          Made with{' '}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#e25555" style={{ flexShrink: 0 }}>
            <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/>
          </svg>
          {' '}by <strong style={{ marginLeft: 4 }}>StaffArc</strong>
        </a>
      </div>
    </footer>
  );
}

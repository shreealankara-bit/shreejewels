'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { bannerAPI } from '@/lib/api';

const SLIDES = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1600&h=750&fit=crop&crop=center',
    tagline: 'New Collection 2024',
    title: 'Everyday\nSparkle',
    subtitle: 'Free shipping on orders above ₹999',
    cta: 'Shop Now',
    href: '/products',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1600&h=750&fit=crop&crop=center',
    tagline: 'Western Jewellery',
    title: 'Modern\nElegance',
    subtitle: 'Handcrafted pieces for every day',
    cta: 'Shop Western',
    href: '/products?section=western',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=1600&h=750&fit=crop&crop=center',
    tagline: 'Traditional Collection',
    title: 'Timeless\nGrace',
    subtitle: 'Kundan, Jadau & Indo-Western sets',
    cta: 'Explore Traditional',
    href: '/products?section=traditional',
  },
];

export default function HeroBanner() {
  const [slides, setSlides] = useState(SLIDES);
  const [current, setCurrent] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    bannerAPI.getActive('hero').then(res => {
      const b = res.data.banners;
      if (b?.length) setSlides(b.map((x: any) => ({ id: x._id, image: x.image, tagline: 'ShreeJewels', title: x.title, subtitle: x.subtitle, cta: x.buttonText || 'Shop Now', href: x.link || '/products' })));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setCurrent(c => (c + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [auto, slides.length]);

  const go = (n: number) => { setAuto(false); setCurrent((current + n + slides.length) % slides.length); };

  return (
    <div className="hero-root" style={{ height: 'clamp(320px, 65vw, 680px)' }}>
      {slides.map((s, i) => (
        <div key={s.id} className={`hero-slide ${i === current ? 'hero-slide-active' : 'hero-slide-inactive'}`}>
          <Image src={s.image} alt={s.title} fill className="hero-img" priority={i === 0} sizes="100vw" />
          <div className="hero-overlay" />
        </div>
      ))}

      <div className="hero-content">
        <div className="hero-inner">
          <AnimatePresence mode="wait">
            <motion.div key={current} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .5 }} className="hero-copy">
              <p className="hero-tagline">{slides[current].tagline}</p>
              <h1 className="hero-title" style={{ whiteSpace: 'pre-line' }}>{slides[current].title}</h1>
              <p className="hero-subtitle">{slides[current].subtitle}</p>
              <Link href={slides[current].href} className="hero-cta">{slides[current].cta}</Link>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <button className="hero-arrow hero-arrow-left" onClick={() => go(-1)} aria-label="Prev">‹</button>
      <button className="hero-arrow hero-arrow-right" onClick={() => go(1)} aria-label="Next">›</button>
      <div className="hero-dots">
        {slides.map((_, i) => (
          <button key={i} className={`hero-dot ${i === current ? 'hero-dot-active' : ''}`} onClick={() => { setAuto(false); setCurrent(i); }} />
        ))}
      </div>
    </div>
  );
}

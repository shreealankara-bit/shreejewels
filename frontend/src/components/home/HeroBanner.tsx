'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { bannerAPI } from '@/lib/api';

const FALLBACK_SLIDES = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1600&h=750&fit=crop&crop=center&q=80',
    tagline: 'New Collection 2025',
    title: 'Everyday\nSparkle',
    subtitle: 'Free shipping on orders above ₹999',
    cta: 'Shop Now',
    href: '/products',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1600&h=750&fit=crop&crop=center&q=80',
    tagline: 'Western Jewellery',
    title: 'Modern\nElegance',
    subtitle: 'Handcrafted pieces for every day',
    cta: 'Shop Western',
    href: '/products?section=western',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=1600&h=750&fit=crop&crop=center&q=80',
    tagline: 'Traditional Collection',
    title: 'Timeless\nGrace',
    subtitle: 'Kundan, Jadau & Indo-Western sets',
    cta: 'Explore Traditional',
    href: '/products?section=traditional',
  },
];

export default function HeroBanner() {
  const [slides, setSlides] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [auto, setAuto] = useState(true);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bannerAPI.getActive('hero').then(res => {
      const b = res.data.banners;
      if (b && b.length > 0) {
        setSlides(b.map((x: any) => ({
          id: x._id,
          image: x.image,
          tagline: 'Shree Alankara',
          title: x.title,
          subtitle: x.subtitle,
          cta: x.buttonText || 'Shop Now',
          href: x.link || '/products',
        })));
      } else {
        setSlides([]);
      }
    }).catch(() => {
      setSlides([]);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setCurrent(c => (c + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [auto, slides.length]);

  const go = (n: number) => {
    setAuto(false);
    setCurrent((current + n + slides.length) % slides.length);
  };

  const getImage = (slide: typeof slides[0]) =>
    imgErrors[slide.id]
      ? 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1600&h=750&fit=crop&crop=center&q=80'
      : slide.image;

  if (loading) {
    return <div className="hero-root skeleton" style={{ height: 'clamp(300px, 60vw, 680px)' }} />;
  }

  if (slides.length === 0) {
    return null; // Hide completely if no banners in database
  }

  return (
    <div className="hero-root" style={{ height: 'clamp(300px, 60vw, 680px)' }}>
      {slides.map((s, i) => (
        <div key={s.id} className={`hero-slide ${i === current ? 'hero-slide-active' : 'hero-slide-inactive'}`}>
          <Image
            src={getImage(s)}
            alt={s.title}
            fill
            priority={i === 0}
            loading={i === 0 ? 'eager' : 'lazy'}
            fetchPriority={i === 0 ? 'high' : 'low'}
            sizes="100vw"
            className="hero-img"
            quality={85}
            onError={() => setImgErrors(prev => ({ ...prev, [s.id]: true }))}
          />
          <div className="hero-overlay" />
        </div>
      ))}

      <div className="hero-content">
        <div className="hero-inner">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="hero-copy"
            >
              <p className="hero-tagline">{slides[current].tagline}</p>
              <h1 className="hero-title" style={{ whiteSpace: 'pre-line' }}>{slides[current].title}</h1>
              <p className="hero-subtitle">{slides[current].subtitle}</p>
              <Link href={slides[current].href} className="hero-cta">{slides[current].cta}</Link>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <button className="hero-arrow hero-arrow-left" onClick={() => go(-1)} aria-label="Previous slide">‹</button>
      <button className="hero-arrow hero-arrow-right" onClick={() => go(1)} aria-label="Next slide">›</button>

      <div className="hero-dots" role="tablist">
        {slides.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === current}
            className={`hero-dot ${i === current ? 'hero-dot-active' : ''}`}
            onClick={() => { setAuto(false); setCurrent(i); }}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

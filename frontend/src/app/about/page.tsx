'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { settingsAPI } from '@/lib/api';
import { Award, Shield, Gem, Heart } from 'lucide-react';

interface Settings {
  siteName: string;
  aboutTitle: string;
  aboutContent: string;
  aboutImage: string;
}

const VALUES = [
  { icon: Gem, title: 'Authentic Craftsmanship', desc: 'Every piece is handcrafted by master artisans with decades of experience, ensuring unmatched quality and detail.' },
  { icon: Shield, title: 'Certified Purity', desc: 'All our gold and silver jewellery is BIS hallmarked, ensuring you receive only the purest metals.' },
  { icon: Award, title: 'Heritage & Tradition', desc: 'Rooted in Indian jewellery traditions, our designs blend timeless sampradaayam with contemporary style.' },
  { icon: Heart, title: 'Customer First', desc: 'Your trust is our greatest treasure. We offer lifetime maintenance and a 30-day easy exchange policy.' },
];

export default function AboutPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    settingsAPI.getPublic()
      .then(res => setSettings(res.data.settings))
      .catch(() => setSettings(null))
      .finally(() => setLoading(false));
  }, []);

  const title = settings?.aboutTitle || 'About Shree Jewels';
  const content = settings?.aboutContent || '';
  const image = settings?.aboutImage || '';

  return (
    <main className="min-h-screen bg-brand-ivory">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-brand-maroon-900 via-brand-maroon-800 to-brand-maroon-700 py-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #e8c97e 1px, transparent 1px), radial-gradient(circle at 80% 20%, #e8c97e 1px, transparent 1px)', backgroundSize: '60px 60px' }}
        />
        <div className="relative max-w-3xl mx-auto">
          <p className="text-brand-gold text-sm font-semibold tracking-[0.2em] uppercase mb-3">Our Story</p>
          <h1 className="text-3xl md:text-5xl font-display text-white mb-4 leading-tight">{title}</h1>
          <div className="w-16 h-0.5 bg-gradient-to-r from-brand-gold to-brand-gold-light mx-auto" />
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className={`grid gap-12 items-start ${image ? 'md:grid-cols-2' : 'md:grid-cols-1 max-w-3xl mx-auto'}`}>
          {/* Text */}
          <div>
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-4 bg-brand-cream rounded w-full" style={{ width: i % 3 === 0 ? '70%' : '100%' }} />)}
              </div>
            ) : content ? (
              <div
                className="prose prose-stone max-w-none text-brand-maroon-800 leading-relaxed"
                style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '1rem', color: '#3d1c1c' }}
              >
                {content}
              </div>
            ) : (
              <div className="space-y-4 text-brand-maroon-800 leading-relaxed">
                <p className="text-lg font-semibold text-brand-maroon-900">Welcome to Shree Jewels — where <em>Sampradaayam Meets Style</em>.</p>
                <p>Founded with a passion for preserving the rich heritage of Indian jewellery, Shree Jewels has been serving families across generations. We believe that jewellery is not just an ornament — it is an emotion, a memory, a bond.</p>
                <p>Our collection spans traditional gold and silver pieces, contemporary diamond designs, and exclusive bridal sets — each crafted with love, precision, and the finest materials sourced ethically from trusted suppliers.</p>
                <p>Whether you are celebrating a wedding, a festival, or simply treating yourself, we are here to help you find the perfect piece that speaks to your soul.</p>
              </div>
            )}
          </div>

          {/* Image */}
          {image && (
            <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/5]">
              <Image src={image} alt={title} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-maroon-900/30 to-transparent" />
            </div>
          )}
        </div>
      </section>

      {/* Values */}
      <section className="bg-brand-cream py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-brand-gold text-sm font-semibold tracking-[0.2em] uppercase mb-2">Why Choose Us</p>
            <h2 className="text-2xl md:text-3xl font-display text-brand-maroon-900">Our Core Values</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map(({ icon: Icon, title: vTitle, desc }) => (
              <div key={vTitle} className="bg-white rounded-xl p-6 shadow-sm border border-brand-mist hover:shadow-md transition-shadow text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-brand-gold to-brand-gold-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon size={22} className="text-brand-maroon-900" />
                </div>
                <h3 className="font-semibold text-brand-maroon-900 mb-2">{vTitle}</h3>
                <p className="text-sm text-brand-maroon-700 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-display text-brand-maroon-900 mb-4">Begin Your Jewellery Journey</h2>
          <p className="text-brand-maroon-700 mb-8">Explore our exquisite collection and find pieces that tell your story.</p>
          <a
            href="/products"
            className="inline-block px-8 py-3.5 bg-gradient-to-r from-brand-gold to-brand-gold-light text-brand-maroon-900 font-semibold rounded-sm hover:from-brand-gold-dark hover:to-brand-gold transition-all shadow-md hover:shadow-lg"
          >
            Explore Collection
          </a>
        </div>
      </section>
    </main>
  );
}

'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { categoryAPI } from '@/lib/api';

// Fallback images per category keyword
const IMG: Record<string, string> = {
  earring: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=200&h=200&fit=crop',
  chain: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=200&h=200&fit=crop',
  ring: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=200&h=200&fit=crop',
  bracelet: 'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=200&h=200&fit=crop',
  necklace: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=200&h=200&fit=crop',
  bangle: 'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=200&h=200&fit=crop',
  hair: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=200&h=200&fit=crop',
  clutch: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200&h=200&fit=crop',
  default: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&h=200&fit=crop',
};

function getImg(name: string, img?: string) {
  if (img) return img;
  const k = name.toLowerCase();
  for (const key of Object.keys(IMG)) {
    if (k.includes(key)) return IMG[key];
  }
  return IMG.default;
}

export default function CategoryCircles() {
  const [cats, setCats] = useState<any[]>([]);

  useEffect(() => {
    categoryAPI.getAll({ activeOnly: 'true', flat: 'false' })
      .then(res => setCats(res.data.categories?.slice(0, 9) || []))
      .catch(() => {});
  }, []);

  const items = [
    { label: 'Shop All', href: '/products', img: IMG.default },
    ...cats.map(c => ({ label: c.name, href: `/products?category=${c._id}`, img: getImg(c.name, c.image) })),
  ].slice(0, 9);

  return (
    <div className="cat-circles">
      {items.map((item, i) => (
        <Link key={i} href={item.href} className="cat-circle-item">
          <div className="cat-circle-img">
            <Image
              src={item.img}
              alt={item.label}
              width={80}
              height={80}
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
              onError={(event) => { (event.currentTarget as HTMLImageElement).src = IMG.default; }}
            />
          </div>
          <span className="cat-circle-label">{item.label}</span>
        </Link>
      ))}
    </div>
  );
}

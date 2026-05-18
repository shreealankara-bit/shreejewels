'use client';
import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Star } from 'lucide-react';
import { productAPI } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

// Lili-Origin style lifestyle images for mockup
const LIFESTYLE: string[] = [
  'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=750&fit=crop',
  'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=600&h=750&fit=crop',
  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=750&fit=crop',
  'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600&h=750&fit=crop',
  'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=750&fit=crop',
  'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=750&fit=crop',
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=750&fit=crop',
  'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600&h=750&fit=crop',
];

function ProductCard({ product, index }: { product: any; index: number }) {
  const { addToCart } = useCart();
  const { user, isLoggedIn, updateUser } = useAuth();
  const inWishlist = user?.wishlist?.includes(product._id);
  const image = product.images?.[0]?.url || LIFESTYLE[index % LIFESTYLE.length];
  const price = product.discountPrice > 0 ? product.discountPrice : product.price;
  const discPct = product.discountPercent || (product.discountPrice > 0 ? Math.round((1 - product.discountPrice / product.price) * 100) : 0);

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLoggedIn) { window.location.href = '/auth/login'; return; }
    try {
      const res = await productAPI.toggleWishlist(product._id);
      updateUser({ wishlist: res.data.wishlist });
    } catch { toast.error('Error'); }
  };

  const handleCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.stock === 0) return;
    addToCart({ productId: product._id, title: product.title, image, price: product.price, discountPrice: product.discountPrice, quantity: 1, stock: product.stock });
    toast.success('Added to cart!');
  };

  return (
    <div className="pcard hscroll-item">
      <Link href={`/products/${product.slug}`}>
        <div className="pcard-img" style={{ aspectRatio: '4/5' }}>
          <Image src={image} alt={product.title} fill sizes="(max-width:640px) 48vw, 25vw" style={{ objectFit: 'cover' }} />
          <span role="button" className="pcard-wishlist" onClick={handleWishlist} id={`wish-${product._id}`}>
            <Heart size={14} fill={inWishlist ? '#d4913e' : 'none'} stroke={inWishlist ? '#d4913e' : '#888'} />
          </span>
          {product.isBestseller && <div className="pcard-badge">Most Gifted</div>}
          {product.isNewArrival && !product.isBestseller && <div className="pcard-badge" style={{ background: 'rgba(26,26,26,.85)' }}>New Launch</div>}
        </div>
        <div className="pcard-body">
          <p className="pcard-title line-clamp-2">{product.title}</p>
          <div className="pcard-price-row">
            {product.discountPrice > 0 && <span className="pcard-price-orig">₹{product.price.toLocaleString()}</span>}
            <span className="pcard-price-sale">₹{price.toLocaleString()}</span>
            {discPct > 0 && <span className="pcard-discount">{discPct}% OFF</span>}
          </div>
          {product.ratings?.count > 0 && (
            <div className="pcard-stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="pcard-star">{i < Math.round(product.ratings.average) ? '★' : '☆'}</span>
              ))}
              <span className="pcard-review-count">({product.ratings.count})</span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}

interface CategoryRowProps {
  title: string;
  queryParams: Record<string, string>;
  viewAllHref: string;
  promoLabel?: string;
}

export function CategoryRow({ title, queryParams, viewAllHref, promoLabel }: CategoryRowProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productAPI.getAll({ ...queryParams, limit: '8' })
      .then(res => setProducts(res.data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && products.length === 0) return null;

  return (
    <div className="category-section">
      <div className="category-section-inner">
        <h2 className="section-heading">{title}</h2>
        <div className="hscroll">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="hscroll-item skeleton" style={{ aspectRatio: '4/5' }} />
              ))
            : products.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
        </div>
        <div className="view-all-wrap">
          <Link href={viewAllHref} className="view-all-btn">View all</Link>
        </div>
      </div>
    </div>
  );
}

export default function BestSellers() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productAPI.getAll({ bestseller: 'true', limit: '8', sort: 'popular' })
      .then(res => setProducts(res.data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && products.length === 0) return null;

  return (
    <div className="category-section" style={{ paddingTop: 48 }}>
      <div className="category-section-inner">
        <h2 className="section-heading">Shop Our Best Sellers</h2>
        <div className="hscroll">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="hscroll-item skeleton" style={{ aspectRatio: '4/5' }} />
              ))
            : products.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
        </div>
        <div className="view-all-wrap">
          <Link href="/products?bestseller=true" className="view-all-btn">View all</Link>
        </div>
      </div>
    </div>
  );
}

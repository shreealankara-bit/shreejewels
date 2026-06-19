'use client';
import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { productAPI } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=750&fit=crop&q=75';

function ProductCard({ product, index }: { product: any; index: number }) {
  const { addToCart } = useCart();
  const { user, isLoggedIn, updateUser } = useAuth();
  const [imgError, setImgError] = useState(false);
  const inWishlist = user?.wishlist?.includes(product._id);

  const rawImage = product.images?.[0]?.url || '';
  const image = (imgError || !rawImage) ? FALLBACK_IMAGE : rawImage;

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
      <Link 
        href={`/products/${product.slug}`}
        prefetch={true}
        onMouseEnter={() => productAPI.getBySlug(product.slug).catch(() => {})}
      >
        <div className="pcard-img" style={{ aspectRatio: '4/5' }}>
          <Image
            src={image}
            alt={product.title}
            fill
            sizes="(max-width:640px) 48vw, 25vw"
            style={{ objectFit: 'cover' }}
            loading={index < 2 ? 'eager' : 'lazy'}
            quality={80}
            onError={() => setImgError(true)}
          />
          <button
            onClick={handleWishlist}
            className="pcard-wishlist"
            aria-label="Toggle wishlist"
          >
            <Heart size={14} fill={inWishlist ? '#c9a84c' : 'none'} stroke={inWishlist ? '#c9a84c' : '#888'} />
          </button>
          {product.isBestseller && <div className="pcard-badge">Most Gifted</div>}
          {product.isNewArrival && !product.isBestseller && (
            <div className="pcard-badge" style={{ background: 'rgba(46,17,17,.85)' }}>New Launch</div>
          )}
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
}

export function CategoryRow({ title, queryParams, viewAllHref }: CategoryRowProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); observer.disconnect(); }
    }, { rootMargin: '400px' });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    productAPI.getAll({ ...queryParams, limit: '8' })
      .then(res => setProducts(res.data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [inView]);

  if (loading) {
    return <div ref={ref} style={{ height: '1px' }} aria-hidden="true" />;
  }
  if (products.length === 0) return null;

  return (
    <div ref={ref} className="category-section">
      <div className="category-section-inner">
        <h2 className="section-heading">{title}</h2>
        <div className="hscroll">
          {products.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
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
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); observer.disconnect(); }
    }, { rootMargin: '400px' });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    productAPI.getAll({ bestseller: 'true', limit: '8', sort: 'popular' })
      .then(res => setProducts(res.data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [inView]);

  if (loading) {
    return <div ref={ref} style={{ height: '1px' }} aria-hidden="true" />;
  }
  if (products.length === 0) return null;

  return (
    <div ref={ref} className="category-section" style={{ paddingTop: 48 }}>
      <div className="category-section-inner">
        <h2 className="section-heading">Shop Our Best Sellers</h2>
        <div className="hscroll">
          {products.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
        </div>
        <div className="view-all-wrap">
          <Link href="/products?bestseller=true" className="view-all-btn">View all</Link>
        </div>
      </div>
    </div>
  );
}

'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { productAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface Product {
  _id: string;
  title: string;
  slug: string;
  price: number;
  discountPrice: number;
  discountPercent: number;
  images: { url: string; isDefault: boolean }[];
  ratings: { average: number; count: number };
  isBestseller: boolean;
  isNewArrival: boolean;
  isFeatured: boolean;
  stock: number;
}

interface ProductCardProps {
  product: Product;
  index?: number;
  priority?: boolean;
}

// Gold shimmer placeholder as a data URI (shown while image loads)
const SHIMMER_SVG = `<svg width="700" height="875" xmlns="http://www.w3.org/2000/svg">
  <rect width="700" height="875" fill="#f9f2e4"/>
  <rect width="700" height="875" fill="url(#s)"/>
  <defs><linearGradient id="s" x1="0%" y1="0%" x2="100%" y2="0%">
    <stop offset="0%" stop-color="#f9f2e4"/><stop offset="50%" stop-color="#f2e6d0"/>
    <stop offset="100%" stop-color="#f9f2e4"/></linearGradient></defs>
</svg>`;
const BLUR_DATA = `data:image/svg+xml;base64,${Buffer.from(SHIMMER_SVG).toString('base64')}`;

// Fallback image when product image is broken/missing
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=700&h=875&fit=crop';

export default function ProductCard({ product, index = 0, priority = false }: ProductCardProps) {
  const { addToCart, toggleCart } = useCart();
  const { isLoggedIn, user, updateUser } = useAuth();
  const [imgError, setImgError] = useState(false);
  const [img2Error, setImg2Error] = useState(false);

  const rawImage = product.images?.find(i => i.isDefault)?.url || product.images?.[0]?.url || '';
  const rawSecond = product.images?.[1]?.url || '';
  const image = (imgError || !rawImage) ? FALLBACK_IMAGE : rawImage;
  const secondImage = (!img2Error && rawSecond) ? rawSecond : '';

  const actualPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
  const inWishlist = user?.wishlist?.includes(product._id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.stock === 0) { toast.error('Out of stock'); return; }
    addToCart({
      productId: product._id,
      title: product.title,
      image,
      price: product.price,
      discountPrice: product.discountPrice,
      quantity: 1,
      stock: product.stock,
    });
    toggleCart();
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLoggedIn) { window.location.href = '/auth/login'; return; }
    try {
      const res = await productAPI.toggleWishlist(product._id);
      updateUser({ wishlist: res.data.wishlist });
      toast.success(res.data.added ? 'Added to wishlist 💖' : 'Removed from wishlist');
    } catch {
      toast.error('Failed to update wishlist');
    }
  };

  // Only first 4 cards animate — rest just fade in instantly
  const shouldAnimate = index < 4;

  const handlePrefetch = () => {
    // Prefetch API data into browser cache
    productAPI.getBySlug(product.slug).catch(() => {});
  };

  return (
    <div
      className="product-card group hover:border-gold-300 transition-colors duration-200"
      onMouseEnter={handlePrefetch}
      style={shouldAnimate ? {
        animation: `fadeIn 0.4s ease ${index * 0.06}s both`,
      } : { animation: 'fadeIn 0.2s ease both' }}
    >
      <Link href={`/products/${product.slug}`} prefetch={true}>
        {/* Image */}
        <div className="product-card-img">
          <Image
            src={image}
            alt={product.title}
            fill
            priority={priority || index < 4}
            loading={priority || index < 4 ? 'eager' : 'lazy'}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover transition-opacity duration-500 ease-in-out ${secondImage ? 'group-hover:opacity-0' : ''}`}
            placeholder="blur"
            blurDataURL={BLUR_DATA}
            onError={() => setImgError(true)}
          />
          {secondImage && (
            <Image
              src={secondImage}
              alt={product.title}
              fill
              loading="lazy"
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out"
              onError={() => setImg2Error(true)}
            />
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-row flex-wrap gap-1 z-10">
            {product.discountPercent > 0 && <span className="badge-sale">{product.discountPercent}% OFF</span>}
            {product.isNewArrival && <span className="badge-new">New</span>}
            {product.isBestseller && <span className="badge-gold">Best Seller</span>}
            {product.stock === 0 && <span className="inline-block bg-maroon-800 text-white text-xs font-medium px-2 py-0.5 uppercase">Sold Out</span>}
          </div>

          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            id={`wishlist-${product._id}`}
            aria-label="Add to wishlist"
            className={`absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white shadow-md rounded-full z-20 cursor-pointer transition-all hover:scale-110 active:scale-95 ${inWishlist ? 'text-yellow-600' : 'text-maroon-600'} hover:bg-cream-100`}
          >
            <Heart size={15} fill={inWishlist ? 'currentColor' : 'none'} />
          </button>

          {/* Quick add to cart */}
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20">
            <button
              onClick={handleAddToCart}
              id={`add-to-cart-${product._id}`}
              className="w-full bg-maroon-900 hover:bg-gold-500 active:bg-gold-600 active:scale-[0.98] text-white text-xs font-medium py-3 flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer select-none"
            >
              <ShoppingBag size={13} />
              {product.stock === 0 ? 'Out of Stock' : 'Quick Add'}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="product-card-info">
          {product.ratings?.count > 0 && (
            <div className="product-card-rating">
              <Star size={11} style={{ color: 'var(--brand-gold)', fill: 'var(--brand-gold)' }} />
              <span>{product.ratings.average.toFixed(1)} ({product.ratings.count})</span>
            </div>
          )}
          <h3 className="product-card-title line-clamp-2">{product.title}</h3>
          <div className="product-card-price">
            <span className="price-discounted">₹{actualPrice.toLocaleString()}</span>
            {product.discountPrice > 0 && (
              <span className="price-original">₹{product.price.toLocaleString()}</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

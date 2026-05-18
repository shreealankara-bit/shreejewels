'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Star, Eye } from 'lucide-react';
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
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addToCart, toggleCart } = useCart();
  const { isLoggedIn, user, updateUser } = useAuth();

  const image = product.images.find(i => i.isDefault)?.url || product.images[0]?.url || '/placeholder-product.jpg';
  const secondImage = product.images[1]?.url;
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
      const newWishlist = res.data.wishlist;
      updateUser({ wishlist: newWishlist });
      toast.success(res.data.added ? 'Added to wishlist 💖' : 'Removed from wishlist');
    } catch {
      toast.error('Failed to update wishlist');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="product-card group"
    >
      <Link href={`/products/${product.slug}`}>
        {/* Image */}
        <div className="product-card-img">
          <Image
            src={image}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover transition-opacity duration-700 ease-in-out ${secondImage ? 'group-hover:opacity-0' : ''}`}
          />
          {secondImage && (
            <Image
              src={secondImage}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-in-out"
            />
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.discountPercent > 0 && <span className="badge-sale">{product.discountPercent}% OFF</span>}
            {product.isNewArrival && !product.discountPercent && <span className="badge-new">New</span>}
            {product.isBestseller && <span className="badge-gold">Best Seller</span>}
            {product.stock === 0 && <span className="inline-block bg-charcoal-600 text-white text-xs font-medium px-2 py-0.5 uppercase">Sold Out</span>}
          </div>

          {/* Action buttons */}
          <div className="product-card-actions">
            <span
              role="button"
              onClick={handleWishlist}
              id={`wishlist-${product._id}`}
              className={`w-8 h-8 flex items-center justify-center bg-white shadow-md hover:bg-gold-50 transition-colors ${inWishlist ? 'text-gold-500' : 'text-charcoal-600'}`}
            >
              <Heart size={15} fill={inWishlist ? 'currentColor' : 'none'} />
            </span>
            <span
              className="w-8 h-8 flex items-center justify-center bg-white shadow-md text-charcoal-600 hover:bg-gold-50 hover:text-gold-500 transition-colors"
            >
              <Eye size={15} />
            </span>
          </div>

          {/* Quick add */}
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <span
              role="button"
              onClick={handleAddToCart}
              id={`add-to-cart-${product._id}`}
              className="w-full bg-charcoal-900 hover:bg-gold-500 text-white text-xs font-medium py-2.5 flex items-center justify-center gap-2 transition-colors duration-200"
            >
              <ShoppingBag size={13} />
              {product.stock === 0 ? 'Out of Stock' : 'Quick Add'}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="product-card-info">
          {product.ratings.count > 0 && (
            <div className="product-card-rating">
              <Star size={11} className="text-gold-400 fill-gold-400" />
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
    </motion.div>
  );
}

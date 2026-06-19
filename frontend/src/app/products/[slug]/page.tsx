'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Share2, Star, ZoomIn, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { productAPI } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import ProductCard from '@/components/products/ProductCard';
import toast from 'react-hot-toast';

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = React.use(params);
  const { slug } = resolvedParams;
  const [product, setProduct] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addToCart, toggleCart } = useCart();
  const { isLoggedIn, user, updateUser } = useAuth();

  useEffect(() => {
    productAPI.getBySlug(slug)
      .then(res => {
        setProduct(res.data.product);
        setRelated(res.data.related || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-10">
        <div className="skeleton aspect-square" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className={`skeleton h-6 rounded ${i === 0 ? 'w-3/4' : i === 2 ? 'w-1/3' : 'w-full'}`} />)}
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="text-center py-20">
      <p className="font-display text-2xl text-charcoal-600">Product not found</p>
      <Link href="/products" className="btn-gold mt-5 inline-block">Continue Shopping</Link>
    </div>
  );

  const images = product.images || [];
  const actualPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
  const inWishlist = user?.wishlist?.includes(product._id);

  const handleAddToCart = () => {
    addToCart({ productId: product._id, title: product.title, image: images[0]?.url, price: product.price, discountPrice: product.discountPrice, quantity, stock: product.stock });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    toggleCart();
  };

  const handleWishlist = async () => {
    if (!isLoggedIn) { window.location.href = '/auth/login'; return; }
    try {
      const res = await productAPI.toggleWishlist(product._id);
      updateUser({ wishlist: res.data.wishlist });
      toast.success(res.data.added ? '💖 Added to wishlist' : 'Removed from wishlist');
    } catch { toast.error('Error updating wishlist'); }
  };

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="bg-cream-50 border-b border-charcoal-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-xs text-charcoal-500">
          <Link href="/" className="hover:text-gold-500">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/products" className="hover:text-gold-500">Products</Link>
          {product.category && (
            <>
              <span className="mx-2">/</span>
              <Link href={`/products?category=${product.category._id}`} className="hover:text-gold-500">{product.category.name}</Link>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="text-charcoal-800">{product.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
          {/* Image gallery */}
          <div className="space-y-3">
            <div className="relative aspect-square overflow-hidden bg-cream-100 group">
              <Image
                src={images[activeImage]?.url || '/placeholder.jpg'}
                alt={product.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
              {/* Nav arrows */}
              {images.length > 1 && (
                <>
                  <button onClick={() => setActiveImage(i => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 flex items-center justify-center text-charcoal-700 hover:bg-white opacity-80 hover:opacity-100 transition-all">
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => setActiveImage(i => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 flex items-center justify-center text-charcoal-700 hover:bg-white opacity-80 hover:opacity-100 transition-all">
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-1">
                {product.discountPercent > 0 && <span className="badge-sale">{product.discountPercent}% OFF</span>}
                {product.isNewArrival && <span className="badge-new">New</span>}
              </div>
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`relative w-16 h-16 flex-shrink-0 border-2 transition-all ${i === activeImage ? 'border-gold-500' : 'border-charcoal-100 hover:border-charcoal-300'}`}
                  >
                    <Image src={img.url} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="space-y-5">
            <div>
              {product.category && (
                <Link href={`/products?category=${product.category._id}`} className="text-xs text-gold-500 uppercase tracking-widest hover:text-gold-600">
                  {product.category.name}
                </Link>
              )}
              <h1 className="font-display text-2xl md:text-3xl text-charcoal-900 mt-1 leading-snug">{product.title}</h1>

              {/* Rating */}
              {product.ratings?.count > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} className={i < Math.round(product.ratings.average) ? 'text-gold-400 fill-gold-400' : 'text-charcoal-200 fill-charcoal-200'} />
                    ))}
                  </div>
                  <span className="text-sm text-charcoal-500">({product.ratings.count} reviews)</span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-semibold text-gold-600">₹{actualPrice.toLocaleString()}</span>
              {product.discountPrice > 0 && (
                <>
                  <span className="text-lg text-charcoal-400 line-through">₹{product.price.toLocaleString()}</span>
                  <span className="price-discount-badge">Save ₹{(product.price - product.discountPrice).toLocaleString()}</span>
                </>
              )}
            </div>

            {/* Stock */}
            <div className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {product.stock > 10 ? '✓ In Stock' : product.stock > 0 ? `⚡ Only ${product.stock} left!` : '✗ Out of Stock'}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-charcoal-600 leading-relaxed">{product.description}</p>
            )}

            {/* Tags */}
            {product.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag: string) => (
                  <Link key={tag} href={`/products?tags=${tag}`}
                    className="text-xs border border-charcoal-200 text-charcoal-600 px-2.5 py-1 hover:border-gold-400 hover:text-gold-500 transition-colors capitalize">
                    {tag.replace(/-/g, ' ')}
                  </Link>
                ))}
              </div>
            )}

            {/* Quantity */}
            {product.stock > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-charcoal-700 font-medium">Qty:</span>
                <div className="flex items-center border border-charcoal-200">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-9 h-9 flex items-center justify-center text-charcoal-600 hover:bg-charcoal-50 transition-colors text-lg">−</button>
                  <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                  <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} className="w-9 h-9 flex items-center justify-center text-charcoal-600 hover:bg-charcoal-50 transition-colors text-lg">+</button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <motion.button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                whileTap={{ scale: 0.97 }}
                id="add-to-cart-detail"
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium tracking-wide transition-colors ${addedToCart ? 'bg-green-600 text-white' : 'btn-gold-outline'}`}
              >
                {addedToCart ? <><Check size={16} /> Added!</> : <><ShoppingBag size={16} /> Add to Cart</>}
              </motion.button>
              <button
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                id="buy-now-btn"
                className="flex-1 btn-dark py-3.5 text-sm"
              >
                Buy Now
              </button>
              <button onClick={handleWishlist} id="wishlist-detail-btn" className={`w-12 h-12 border flex items-center justify-center transition-colors ${inWishlist ? 'border-gold-500 text-gold-500 bg-gold-50' : 'border-charcoal-200 text-charcoal-600 hover:border-gold-400'}`}>
                <Heart size={18} fill={inWishlist ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Trust info */}
            <div className="border-t border-charcoal-100 pt-4 space-y-2 text-xs text-charcoal-500">
              <p>🚚 Free shipping on orders above ₹999</p>
              <p>🔄 Easy 7-day returns</p>
              <p>🔒 100% secure payment via Cashfree</p>
            </div>
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="section-title text-left mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
              {related.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

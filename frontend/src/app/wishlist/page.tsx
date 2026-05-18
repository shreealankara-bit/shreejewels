'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { productAPI } from '@/lib/api';
import { Heart, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const { user, isLoggedIn, loading, updateUser } = useAuth();
  const { addToCart } = useCart();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !isLoggedIn) router.push('/auth/login?redirect=/wishlist');
    if (isLoggedIn && user?.wishlist?.length) {
      // Fetch wishlist products individually
      Promise.all(user.wishlist.map(async (id: string) => {
        try { const res = await productAPI.getBySlug(id); return res.data.product; } catch { return null; }
      })).then(prods => setProducts(prods.filter(Boolean))).finally(() => setFetching(false));
    } else {
      setFetching(false);
    }
  }, [loading, isLoggedIn, user]);

  const handleRemove = async (id: string) => {
    try {
      const res = await productAPI.toggleWishlist(id);
      updateUser({ wishlist: res.data.wishlist });
      setProducts(p => p.filter(prod => prod._id !== id));
      toast.success('Removed from wishlist');
    } catch { toast.error('Failed to remove'); }
  };

  if (loading || fetching) return <div className="min-h-screen flex items-center justify-center text-gold-500">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-2xl text-charcoal-900 mb-6">My Wishlist ({products.length})</h1>

      {products.length === 0 ? (
        <div className="text-center py-16">
          <Heart size={60} className="text-charcoal-200 mx-auto mb-4" />
          <p className="font-display text-xl text-charcoal-600 mb-2">Your wishlist is empty</p>
          <Link href="/products" className="btn-gold mt-3 inline-block">Explore Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map(product => {
            const price = product.discountPrice > 0 ? product.discountPrice : product.price;
            const image = product.images.find((i: any) => i.isDefault)?.url || product.images[0]?.url;
            return (
              <div key={product._id} className="product-card group">
                <Link href={`/products/${product.slug}`}>
                  <div className="product-card-img">
                    <Image src={image} alt={product.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="25vw" />
                  </div>
                </Link>
                <div className="p-3">
                  <p className="text-sm text-charcoal-800 line-clamp-2 mb-2">{product.title}</p>
                  <p className="text-gold-600 font-semibold">₹{price.toLocaleString()}</p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => { addToCart({ productId: product._id, title: product.title, image, price: product.price, discountPrice: product.discountPrice, quantity: 1, stock: product.stock }); }}
                      className="flex-1 btn-gold py-2 text-xs flex items-center justify-center gap-1"
                    >
                      <ShoppingBag size={12} /> Add to Cart
                    </button>
                    <button onClick={() => handleRemove(product._id)} className="p-2 border border-charcoal-200 text-red-400 hover:bg-red-50 transition-colors">
                      <Heart size={14} fill="currentColor" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

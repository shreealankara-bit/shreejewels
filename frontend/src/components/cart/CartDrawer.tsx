'use client';
import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export default function CartDrawer() {
  const { state, toggleCart, removeFromCart, updateQuantity, subtotal } = useCart();
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const { items, isOpen } = state;
  const freeAt = 999;
  const shippingFree = subtotal >= freeAt;
  const shipping = shippingFree ? 0 : 60;
  const pct = Math.min((subtotal / freeAt) * 100, 100);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) toggleCart(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [isOpen, toggleCart]);

  useEffect(() => { document.body.style.overflow = isOpen ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="cart-overlay" onClick={toggleCart} />
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.32 }} className="cart-drawer">

            {/* Header */}
            <div className="cart-header">
              <div className="cart-title">
                <ShoppingBag size={18} />
                Your Bag
                <span style={{ fontSize: '.8rem', fontWeight: 400, color: '#888' }}>({items.length})</span>
              </div>
              <button onClick={toggleCart} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex' }}><X size={20} /></button>
            </div>

            {/* Shipping progress */}
            {items.length > 0 && (
              <div className="shipping-bar">
                {shippingFree
                  ? <p style={{ fontSize: '.75rem', color: '#16a34a', fontWeight: 600 }}>🎉 You've got FREE shipping!</p>
                  : <p style={{ fontSize: '.75rem', color: '#5d5d5d' }}>Add <strong>₹{(freeAt - subtotal).toLocaleString()}</strong> more for free shipping</p>}
                <div className="shipping-progress"><div className="shipping-fill" style={{ width: `${pct}%` }} /></div>
              </div>
            )}

            {/* Items */}
            <div className="cart-body">
              {items.length === 0 ? (
                <div style={{ textAlign: 'center', paddingTop: 60 }}>
                  <ShoppingBag size={52} color="#d1d1d1" style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontWeight: 600, color: '#2a2a2a', marginBottom: 4 }}>Your bag is empty</p>
                  <p style={{ fontSize: '.82rem', color: '#888', marginBottom: 20 }}>Add jewellery to get started</p>
                  <Link href="/products" onClick={toggleCart} className="btn-dark">Shop Now</Link>
                </div>
              ) : (
                items.map(item => {
                  const price = item.discountPrice > 0 ? item.discountPrice : item.price;
                  return (
                    <div key={item.productId} className="cart-item">
                      <div className="cart-item-img">
                        <Image src={item.image} alt={item.title} fill style={{ objectFit: 'cover' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '.83rem', fontWeight: 500, color: '#1a1a1a', lineHeight: 1.4, marginBottom: 4 }} className="line-clamp-2">{item.title}</p>
                        <p style={{ fontSize: '.88rem', fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>₹{price.toLocaleString()}</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div className="qty-control">
                            <button className="qty-btn" onClick={() => updateQuantity(item.productId, item.quantity - 1)}><Minus size={11} /></button>
                            <span className="qty-value">{item.quantity}</span>
                            <button className="qty-btn" onClick={() => updateQuantity(item.productId, item.quantity + 1)} disabled={item.quantity >= item.stock}><Plus size={11} /></button>
                          </div>
                          <button onClick={() => removeFromCart(item.productId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b0b0b0' }}><Trash2 size={15} /></button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="cart-footer">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '.83rem', color: '#5d5d5d' }}>
                  <span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, fontSize: '.83rem', color: shippingFree ? '#16a34a' : '#5d5d5d' }}>
                  <span>Shipping</span><span>{shippingFree ? 'FREE' : `₹${shipping}`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontWeight: 700, fontSize: '1rem', borderTop: '1px solid #efefef', paddingTop: 12 }}>
                  <span>Total</span><span>₹{(subtotal + shipping).toLocaleString()}</span>
                </div>
                <button
                  id="proceed-checkout"
                  className="btn-dark"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    toggleCart();
                    router.push(isLoggedIn ? '/checkout' : '/auth/login?redirect=/checkout');
                  }}
                >
                  Checkout <ArrowRight size={15} />
                </button>
                <button onClick={toggleCart} style={{ display: 'block', width: '100%', marginTop: 10, background: 'none', border: 'none', fontSize: '.78rem', color: '#888', cursor: 'pointer', textDecoration: 'underline' }}>
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

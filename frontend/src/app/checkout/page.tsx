'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MapPin, CreditCard, ShoppingBag, Tag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { orderAPI, couponAPI, missingOrderAPI } from '@/lib/api';
import Image from 'next/image';
import toast from 'react-hot-toast';

// Loads Cashfree SDK script dynamically, resolves once window.Cashfree is ready
function loadCashfreeSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject('SSR');

    // Already loaded
    if ((window as any).Cashfree) {
      resolve();
      return;
    }

    // Script already injected but not ready yet — wait
    const existing = document.getElementById('cashfree-sdk');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject('SDK load error'));
      return;
    }

    // Inject script
    const script = document.createElement('script');
    script.id = 'cashfree-sdk';
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject('Failed to load Cashfree SDK');
    document.head.appendChild(script);
  });
}

export default function CheckoutPage() {
  const router = useRouter();
  const { state, clearCart, subtotal } = useCart();
  const { user, isLoggedIn, loading } = useAuth();
  const { items } = state;

  const [address, setAddress] = useState({
    fullName: '', phone: '', line1: '', line2: '',
    city: '', state: '', pincode: '', country: 'India',
  });
  const [couponCode, setCouponCode] = useState('');
  const [couponData, setCouponData] = useState<{ discount: number; code: string } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);

  // Session ID for tracking missing orders
  const [sessionId] = useState(() => {
    if (typeof window === 'undefined') return '';
    const existing = sessionStorage.getItem('checkout_session_id');
    if (existing) return existing;
    const id = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem('checkout_session_id', id);
    return id;
  });

  const shippingFree = (subtotal - (couponData?.discount || 0)) >= 999;
  const shipping = shippingFree ? 0 : 60;
  const total = subtotal - (couponData?.discount || 0) + shipping;

  useEffect(() => {
    if (!loading && items.length === 0) router.push('/products');
  }, [loading, items.length]);

  // Pre-fill address from user profile
  useEffect(() => {
    const saved = sessionStorage.getItem('checkout_address');
    if (saved) {
      try { setAddress(JSON.parse(saved)); } catch {}
    } else {
      const defaultAddr = user?.addresses?.find((a: any) => a.isDefault) || user?.addresses?.[0];
      if (defaultAddr) setAddress(defaultAddr);
    }
  }, [user]);

  // Pre-load SDK in background so it's ready when user clicks Pay
  useEffect(() => {
    loadCashfreeSDK().catch(() => {});
  }, []);

  const handleCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await couponAPI.validate(
        couponCode,
        subtotal,
        items.map(i => ({ productId: i.productId, quantity: i.quantity }))
      );
      setCouponData({ discount: res.data.discount, code: couponCode.toUpperCase() });
      toast.success(`Coupon applied! You save ₹${res.data.discount}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid coupon');
      setCouponData(null);
    } finally { setCouponLoading(false); }
  };

  const saveMissingOrder = (reason: string) => {
    if (!items.length) return;
    missingOrderAPI.save({
      sessionId,
      userId: user?._id || '',
      name: address.fullName || user?.name || '',
      email: user?.email || '',
      phone: address.phone || user?.phone || '',
      items: items.map(i => ({
        product: i.productId,
        title: i.title,
        image: i.image,
        price: i.price,
        discountPrice: i.discountPrice,
        quantity: i.quantity,
        total: (i.discountPrice > 0 ? i.discountPrice : i.price) * i.quantity,
      })),
      shippingAddress: address,
      subtotal,
      discount: couponData?.discount || 0,
      couponCode: couponData?.code || '',
      totalAmount: total,
      reason,
    }).catch(() => {});
  };

  const handlePlaceOrder = async () => {
    // Validate required fields
    const required: (keyof typeof address)[] = ['fullName', 'phone', 'line1', 'city', 'state', 'pincode'];
    for (const field of required) {
      if (!address[field]) {
        toast.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return;
      }
    }

    if (!isLoggedIn) {
      sessionStorage.setItem('checkout_address', JSON.stringify(address));
      toast('Please sign in to place your order', { icon: '🔒' });
      router.push('/auth/login?redirect=/checkout');
      return;
    }

    setOrderLoading(true);
    try {
      // 1. Ensure SDK is loaded
      await loadCashfreeSDK();

      const env = process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production' ? 'production' : 'sandbox';
      const cashfree = (window as any).Cashfree({ mode: env });

      // 2. Create order on backend
      const res = await orderAPI.createPayment({
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
        shippingAddress: address,
        couponCode: couponData?.code || '',
      });

      const { paymentSessionId, cashfreeOrderId, order } = res.data;

      // 3. Open Cashfree modal
      const result = await cashfree.checkout({
        paymentSessionId,
        redirectTarget: '_modal',
      });

      if (result.error) {
        saveMissingOrder('payment_failed');
        toast.error(result.error.message || 'Payment was not completed');
        setOrderLoading(false);
        return;
      }

      if (result.redirect) {
        // Bank 3DS redirect — page will reload on return
        return;
      }

      if (result.paymentDetails) {
        // 4. Verify with backend
        try {
          await orderAPI.verifyPayment({
            orderId: order._id,
            cashfreeOrderId,
          });
          clearCart();
          sessionStorage.removeItem('checkout_address');
          sessionStorage.removeItem('checkout_session_id');
          toast.success('Order placed successfully! 💍');
          router.push(`/orders/${order._id}?success=1`);
        } catch {
          saveMissingOrder('payment_failed');
          toast.error('Payment verification failed. Please contact support.');
          setOrderLoading(false);
        }
      }
    } catch (err: any) {
      saveMissingOrder('payment_failed');
      toast.error(err?.response?.data?.message || err?.message || 'Failed to initiate payment');
      setOrderLoading(false);
    }
  };

  if (loading) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <h1 className="font-display text-2xl md:text-3xl text-charcoal-900 mb-8">Checkout</h1>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-3 lg:gap-8">
        {/* Left: Address + Payment */}
        <div className="lg:col-span-2 space-y-6 order-last lg:order-first">

          {/* Shipping address */}
          <div className="bg-white border border-charcoal-100 p-6">
            <h2 className="flex items-center gap-2 font-semibold text-charcoal-800 mb-5">
              <MapPin size={18} className="text-gold-500" /> Shipping Address
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Full Name', key: 'fullName', type: 'text', required: true },
                { label: 'Phone', key: 'phone', type: 'tel', required: true },
                { label: 'Address Line 1', key: 'line1', type: 'text', required: true, span: 2 },
                { label: 'Address Line 2 (Optional)', key: 'line2', type: 'text', span: 2 },
                { label: 'City', key: 'city', type: 'text', required: true },
                { label: 'State', key: 'state', type: 'text', required: true },
                { label: 'Pincode', key: 'pincode', type: 'text', required: true },
                { label: 'Country', key: 'country', type: 'text', required: true },
              ].map(({ label, key, type, required, span }) => (
                <div key={key} className={span ? `col-span-${span}` : ''}>
                  <label className="block text-xs text-charcoal-600 font-medium mb-1.5 uppercase tracking-wide">
                    {label} {required && <span className="text-red-400">*</span>}
                  </label>
                  <input
                    type={type}
                    value={address[key as keyof typeof address]}
                    onChange={e => setAddress(prev => ({ ...prev, [key]: e.target.value }))}
                    className="input-field"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Coupon */}
          <div className="bg-white border border-charcoal-100 p-6">
            <h2 className="flex items-center gap-2 font-semibold text-charcoal-800 mb-4">
              <Tag size={18} className="text-gold-500" /> Promo Code
            </h2>
            {couponData ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-green-700">{couponData.code} applied!</p>
                  <p className="text-xs text-green-600">You save ₹{couponData.discount}</p>
                </div>
                <button onClick={() => { setCouponData(null); setCouponCode(''); }} className="text-xs text-red-500 hover:underline">Remove</button>
              </div>
            ) : (
              <div className="flex gap-3">
                <input
                  type="text"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter promo code"
                  className="input-field flex-1 uppercase tracking-widest"
                  id="coupon-input"
                />
                <button onClick={handleCoupon} disabled={couponLoading} id="apply-coupon-btn" className="btn-gold-outline px-5 py-2.5 text-sm flex-shrink-0">
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </div>
            )}
          </div>

          {/* Payment info */}
          <div className="bg-white border border-charcoal-100 p-6">
            <h2 className="flex items-center gap-2 font-semibold text-charcoal-800 mb-3">
              <CreditCard size={18} className="text-gold-500" /> Payment
            </h2>
            <p className="text-sm text-charcoal-500">Secure payment powered by Cashfree. Supports UPI, Cards, Net Banking, and Wallets.</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              {['UPI', 'Visa', 'Mastercard', 'RuPay', 'Net Banking', 'Wallets'].map(p => (
                <span key={p} className="text-xs bg-charcoal-50 border border-charcoal-100 text-charcoal-500 px-2.5 py-1">{p}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Order summary */}
        <div className="space-y-4 order-first lg:order-last">
          <div className="bg-white border border-charcoal-100 p-6 sticky top-24">
            <h2 className="flex items-center gap-2 font-semibold text-charcoal-800 mb-4">
              <ShoppingBag size={18} className="text-gold-500" /> Order Summary ({items.length} items)
            </h2>

            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
              {items.map(item => {
                const price = item.discountPrice > 0 ? item.discountPrice : item.price;
                return (
                  <div key={item.productId} className="flex gap-3">
                    <div className="relative w-12 h-14 flex-shrink-0 bg-cream-100">
                      <Image src={item.image} alt={item.title} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-charcoal-700 line-clamp-2">{item.title}</p>
                      <p className="text-xs text-charcoal-500 mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-xs font-semibold text-charcoal-800 flex-shrink-0">₹{(price * item.quantity).toLocaleString()}</p>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-charcoal-100 pt-4 space-y-2">
              <div className="flex justify-between text-sm text-charcoal-600">
                <span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span>
              </div>
              {couponData && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Coupon ({couponData.code})</span><span>-₹{couponData.discount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-charcoal-600">
                <span>Shipping</span>
                <span className={shippingFree ? 'text-green-600 font-medium' : ''}>{shippingFree ? 'FREE' : `₹${shipping}`}</span>
              </div>
              <div className="flex justify-between font-bold text-charcoal-900 text-base pt-2 border-t border-charcoal-100">
                <span>Total</span><span>₹{total.toLocaleString()}</span>
              </div>
            </div>

            <motion.button
              onClick={handlePlaceOrder}
              disabled={orderLoading}
              whileTap={{ scale: 0.97 }}
              id="place-order-btn"
              className="btn-gold w-full mt-5 py-4 text-base"
            >
              {orderLoading ? 'Processing...' : `Pay ₹${total.toLocaleString()} →`}
            </motion.button>

            <p className="text-center text-xs text-charcoal-400 mt-3">🔒 256-bit SSL Secured · Powered by Cashfree</p>
          </div>
        </div>
      </div>
    </div>
  );
}

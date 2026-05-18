'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MapPin, CreditCard, ShoppingBag, Tag, Check } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { orderAPI, couponAPI } from '@/lib/api';
import Image from 'next/image';
import toast from 'react-hot-toast';

declare const Razorpay: any;

export default function CheckoutPage() {
  const router = useRouter();
  const { state, clearCart, subtotal } = useCart();
  const { user, isLoggedIn, loading } = useAuth();
  const { items } = state;

  const [address, setAddress] = useState({ fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', country: 'India' });
  const [couponCode, setCouponCode] = useState('');
  const [couponData, setCouponData] = useState<{ discount: number; code: string } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);

  const shippingFree = (subtotal - (couponData?.discount || 0)) >= 999;
  const shipping = shippingFree ? 0 : 60;
  const total = subtotal - (couponData?.discount || 0) + shipping;

  useEffect(() => {
    if (!loading && !isLoggedIn) router.push('/auth/login?redirect=/checkout');
    if (!loading && items.length === 0) router.push('/products');
  }, [loading, isLoggedIn, items.length]);

  // Pre-fill address from user profile
  useEffect(() => {
    const defaultAddr = user?.addresses?.find((a: any) => a.isDefault) || user?.addresses?.[0];
    if (defaultAddr) setAddress(defaultAddr);
  }, [user]);

  const handleCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await couponAPI.validate(couponCode, subtotal);
      setCouponData({ discount: res.data.discount, code: couponCode.toUpperCase() });
      toast.success(`Coupon applied! You save ₹${res.data.discount}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid coupon');
      setCouponData(null);
    } finally { setCouponLoading(false); }
  };

  const handlePlaceOrder = async () => {
    // Validate address
    const required: (keyof typeof address)[] = ['fullName', 'phone', 'line1', 'city', 'state', 'pincode'];
    for (const field of required) {
      if (!address[field]) { toast.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1')}`); return; }
    }

    setOrderLoading(true);
    try {
      // Create Razorpay order
      const res = await orderAPI.createPayment({
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
        shippingAddress: address,
        couponCode: couponData?.code || '',
      });

      const { razorpayOrderId, razorpayKeyId, order } = res.data;

      // Open Razorpay
      const options = {
        key: razorpayKeyId,
        amount: Math.round(total * 100),
        currency: 'INR',
        name: 'ShreeJewels',
        description: 'Jewellery Order',
        order_id: razorpayOrderId,
        prefill: { name: user?.name, email: user?.email, contact: address.phone },
        theme: { color: '#d4913e' },
        handler: async (response: any) => {
          try {
            await orderAPI.verifyPayment({
              orderId: order._id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });
            clearCart();
            toast.success('Order placed successfully! 💍');
            router.push(`/orders/${order._id}?success=1`);
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        modal: {
          ondismiss: () => { setOrderLoading(false); toast('Payment cancelled'); },
        },
      };

      const rzp = new Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create order');
      setOrderLoading(false);
    }
  };

  if (loading || !isLoggedIn) return null;

  return (
    <>
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <h1 className="font-display text-2xl md:text-3xl text-charcoal-900 mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Address + Payment */}
          <div className="lg:col-span-2 space-y-6">
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
              <p className="text-sm text-charcoal-500">Secure payment powered by Razorpay. Supports UPI, Cards, Net Banking, and Wallets.</p>
              <div className="flex gap-2 mt-3 flex-wrap">
                {['UPI', 'Visa', 'Mastercard', 'RuPay', 'Net Banking', 'Wallets'].map(p => (
                  <span key={p} className="text-xs bg-charcoal-50 border border-charcoal-100 text-charcoal-500 px-2.5 py-1">{p}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Order summary */}
          <div className="space-y-4">
            <div className="bg-white border border-charcoal-100 p-6 sticky top-24">
              <h2 className="flex items-center gap-2 font-semibold text-charcoal-800 mb-4">
                <ShoppingBag size={18} className="text-gold-500" /> Order Summary ({items.length} items)
              </h2>

              {/* Items */}
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

              <p className="text-center text-xs text-charcoal-400 mt-3">🔒 256-bit SSL Secured</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

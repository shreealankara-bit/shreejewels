import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import WhatsAppButton from '@/components/ui/WhatsAppButton';

export const metadata: Metadata = {
  title: { default: 'ShreeJewels – Premium Jewellery Collection', template: '%s | ShreeJewels' },
  description: 'Discover stunning Western & Traditional jewellery at ShreeJewels. Earrings, necklaces, bangles, and more – crafted for every occasion.',
  keywords: ['jewellery', 'earrings', 'necklace', 'bangles', 'kundan', 'traditional jewellery', 'western jewellery', 'shreejewels'],
  openGraph: {
    type: 'website',
    siteName: 'ShreeJewels',
    title: 'ShreeJewels – Premium Jewellery Collection',
    description: 'Stunning Western & Traditional jewellery for every occasion.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CartProvider>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <CartDrawer />
            <WhatsAppButton />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: { background: '#1a1a1a', color: '#fff', fontSize: '14px', borderRadius: 0 },
                success: { iconTheme: { primary: '#d4913e', secondary: '#fff' } },
              }}
            />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

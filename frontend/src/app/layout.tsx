import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';
import ClientLayout from '@/components/layout/ClientLayout';

const DEFAULT_SEO = {
  siteName: 'ShreeJewels',
  metaTitle: 'ShreeJewels - Premium Jewellery Collection',
  metaDescription: 'Discover stunning Western & Traditional jewellery at ShreeJewels. Earrings, necklaces, bangles, and more - crafted for every occasion.',
  metaKeywords: 'jewellery, earrings, necklace, bangles, kundan, traditional jewellery, western jewellery, shreejewels',
  faviconUrl: '',
  logoUrl: '',
};

async function getSiteSettings() {
  const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_PROXY_TARGET || 'http://localhost:4000/api';
  const apiUrl = rawApiUrl.startsWith('http')
    ? rawApiUrl.replace(/\/+$/, '')
    : (process.env.API_PROXY_TARGET || 'http://localhost:4000/api').replace(/\/+$/, '');

  try {
    const res = await fetch(`${apiUrl}/settings`, { next: { revalidate: 300 } });
    if (!res.ok) return DEFAULT_SEO;
    const data = await res.json();
    return { ...DEFAULT_SEO, ...(data.settings || {}) };
  } catch {
    return DEFAULT_SEO;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteName = settings.siteName || DEFAULT_SEO.siteName;
  const title = settings.metaTitle || DEFAULT_SEO.metaTitle;
  const description = settings.metaDescription || DEFAULT_SEO.metaDescription;
  const keywords = String(settings.metaKeywords || DEFAULT_SEO.metaKeywords)
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  return {
    title: { default: title, template: `%s | ${siteName}` },
    description,
    keywords,
    icons: settings.faviconUrl ? { icon: settings.faviconUrl, shortcut: settings.faviconUrl, apple: settings.faviconUrl } : undefined,
    openGraph: {
      type: 'website',
      siteName,
      title,
      description,
      images: settings.logoUrl ? [{ url: settings.logoUrl, alt: siteName }] : undefined,
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CartProvider>
            <ClientLayout>{children}</ClientLayout>
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

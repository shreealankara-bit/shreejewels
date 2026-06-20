'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { categoryAPI, productAPI } from '@/lib/api';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=700&h=875&fit=crop&q=75';

type Product = {
  title: string;
  price: string;
  image: string;
  label?: string;
};

type Category = {
  name: string;
  image: string;
  subcategories: string[];
  products: Product[];
};

type Section = {
  key: 'western' | 'traditional';
  title: string;
  subtitle: string;
  categories: Category[];
};

const SECTIONS: Section[] = [
  {
    key: 'western',
    title: 'Western Collection',
    subtitle: 'Modern everyday styles inspired by your client category list',
    categories: [
      {
        name: 'Earrings',
        image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=600&fit=crop',
        subcategories: ['Anti Tarnish', 'Combo Sets', 'Korean Earrings', 'Hoops', 'Office Wear Studs'],
        products: [
          { title: 'Korean Pearl Hoop', price: '₹899', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=700&h=900&fit=crop', label: 'Trending' },
          { title: 'Office Stud Duo', price: '₹699', image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=700&h=900&fit=crop' },
          { title: 'Anti Tarnish Mini Hoops', price: '₹799', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=700&h=900&fit=crop' },
          { title: 'Korean Drop Earrings', price: '₹899', image: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=700&h=900&fit=crop' },
        ],
      },
      {
        name: 'Chains',
        image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=600&fit=crop',
        subcategories: ['Anti Tarnish', 'Fancy Chains'],
        products: [
          { title: 'Layered Gold Chain', price: '₹1,099', image: 'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=700&h=900&fit=crop' },
          { title: 'Minimal Pendant Chain', price: '₹999', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=700&h=900&fit=crop', label: 'Best Seller' },
          { title: 'Anti Tarnish Snake Chain', price: '₹1,199', image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=700&h=900&fit=crop' },
          { title: 'Fancy Layer Chain', price: '₹1,299', image: 'https://images.unsplash.com/photo-1601821765780-754fa98637c1?w=700&h=900&fit=crop' },
        ],
      },
      {
        name: 'Rings',
        image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=600&fit=crop',
        subcategories: ['Statement Rings', 'Stackable Rings', 'Daily Wear Rings'],
        products: [
          { title: 'Crystal Stack Ring', price: '₹749', image: 'https://images.unsplash.com/photo-1603561596112-db7f8b7f4f88?w=700&h=900&fit=crop' },
          { title: 'Classic Dome Ring', price: '₹799', image: 'https://images.unsplash.com/photo-1588444650700-6f00df8a82f6?w=700&h=900&fit=crop' },
          { title: 'Daily Wear Solitaire Ring', price: '₹699', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=700&h=900&fit=crop' },
          { title: 'Stacked Statement Ring Set', price: '₹999', image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=700&h=900&fit=crop' },
        ],
      },
      {
        name: 'Bracelets',
        image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&h=600&fit=crop',
        subcategories: ['Daily Wear', 'Party Wear', 'Combo Packs'],
        products: [
          { title: 'Charm Link Bracelet', price: '₹899', image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=700&h=900&fit=crop' },
          { title: 'Crystal Tennis Bracelet', price: '₹1,299', image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=700&h=900&fit=crop' },
          { title: 'Party Wear Bracelet Stack', price: '₹1,099', image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=700&h=900&fit=crop' },
          { title: 'Daily Gold Touch Bracelet', price: '₹849', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=700&h=900&fit=crop' },
        ],
      },
      {
        name: 'Clutches',
        image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=600&fit=crop',
        subcategories: ['Daily Wear', 'Party Wear', 'Fancy Hair Pins'],
        products: [
          { title: 'Party Clutch Gold', price: '₹1,499', image: 'https://images.unsplash.com/photo-1590159763121-ce484e9f2081?w=700&h=900&fit=crop' },
          { title: 'Crystal Evening Clutch', price: '₹1,799', image: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=700&h=900&fit=crop' },
          { title: 'Daily Carry Mini Clutch', price: '₹1,099', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=700&h=900&fit=crop' },
          { title: 'Wedding Party Clutch', price: '₹1,999', image: 'https://images.unsplash.com/photo-1571513722275-4b41940f54b8?w=700&h=900&fit=crop' },
        ],
      },
      {
        name: 'Hair Accessories',
        image: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=600&h=600&fit=crop',
        subcategories: ['Clips', 'Hair Stickers', 'Hair Flowers', 'Flower Clips', 'Scrunchies'],
        products: [
          { title: 'Pearl Flower Clip', price: '₹499', image: 'https://images.unsplash.com/photo-1594756202469-9ff9799b2e4e?w=700&h=900&fit=crop' },
          { title: 'Satin Bow Set', price: '₹399', image: 'https://images.unsplash.com/photo-1596704017254-9a8f652f2ed9?w=700&h=900&fit=crop' },
          { title: 'Party Wear Scrunchie Pack', price: '₹449', image: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=700&h=900&fit=crop' },
          { title: 'Floral Clip Combo', price: '₹549', image: 'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=700&h=900&fit=crop' },
        ],
      },
    ],
  },
  {
    key: 'traditional',
    title: 'Traditional / Indo Western',
    subtitle: 'Curated from the long-form list shared by your client',
    categories: [
      {
        name: 'Necklace',
        image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600&h=600&fit=crop',
        subcategories: ['Victorian', 'Rajwadi Kundan', 'Jadau Kundan', 'Kundan', 'Moissanite', 'A.D. Stone', 'Chowkars', '1 Gram Gold Sets', 'Simple Chains'],
        products: [
          { title: 'Rajwadi Kundan Set', price: '₹2,499', image: 'https://images.unsplash.com/photo-1601821765780-754fa98637c1?w=700&h=900&fit=crop', label: 'Bridal Pick' },
          { title: 'Victorian Stone Necklace', price: '₹2,199', image: 'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=700&h=900&fit=crop' },
          { title: 'Moissanite Layer Necklace', price: '₹2,899', image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=700&h=900&fit=crop' },
          { title: 'A.D. Stone Choker', price: '₹2,099', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=700&h=900&fit=crop' },
        ],
      },
      {
        name: 'Bangles',
        image: 'https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b2?w=600&h=600&fit=crop',
        subcategories: ['Kankanalu', 'Daily Wear Bangles', 'Stone Bangles', 'Diamond Bangles', 'Antic Bangles'],
        products: [
          { title: 'Temple Stone Bangles', price: '₹1,699', image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=700&h=900&fit=crop' },
          { title: 'Diamond Look Bangles', price: '₹1,899', image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=700&h=900&fit=crop' },
          { title: 'Daily Kankanalu Pair', price: '₹1,299', image: 'https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b2?w=700&h=900&fit=crop' },
          { title: 'Antic Gold Bangles', price: '₹1,999', image: 'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=700&h=900&fit=crop' },
        ],
      },
      {
        name: 'Earrings',
        image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=600&h=600&fit=crop',
        subcategories: ['Buttalu', 'Statement Earrings', 'Chandbalis', 'Indo Western Earrings', 'Studs', 'Changeables', 'Earrings with Cuffs', 'Cuffs', 'Bugadis'],
        products: [
          { title: 'Chandbali Drop Pair', price: '₹1,299', image: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=700&h=900&fit=crop' },
          { title: 'Temple Buttalu', price: '₹1,499', image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=700&h=900&fit=crop' },
          { title: 'Changeable Cuff Earrings', price: '₹1,399', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=700&h=900&fit=crop' },
          { title: 'Indo Western Studs', price: '₹999', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=700&h=900&fit=crop' },
        ],
      },
      {
        name: 'Classic Add-ons',
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&h=600&fit=crop',
        subcategories: ['Black Beads', 'Beads Chains', 'Moti Chains', 'Hip Belt', 'Nose Pins', 'Anklets', 'Bracelets', 'Saree Pins', 'Lokets / Pendant with Earrings', 'Tikas', 'Kids Accessories', 'Kumkum Boxes'],
        products: [
          { title: 'Moti Chain Pair', price: '₹1,199', image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=700&h=900&fit=crop' },
          { title: 'Traditional Nose Pin', price: '₹699', image: 'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=700&h=900&fit=crop' },
          { title: 'Stone Saree Pin', price: '₹599', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=700&h=900&fit=crop' },
          { title: 'Kids Accessory Combo', price: '₹899', image: 'https://images.unsplash.com/photo-1594756202469-9ff9799b2e4e?w=700&h=900&fit=crop' },
        ],
      },
    ],
  },
];

export default function CuratedCategoryShowcase() {
  const [sections, setSections] = useState<any[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string>('');
  const [activeSubCategoryId, setActiveSubCategoryId] = useState<string>('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Categories on mount
  useEffect(() => {
    categoryAPI.getAll({ activeOnly: 'true' })
      .then(res => {
        // We only want sections that have subcategories for this showcase
        const rootCategories = (res.data.categories || []).filter((c: any) => c.subcategories && c.subcategories.length > 0);
        setSections(rootCategories);
        
        if (rootCategories.length > 0) {
          const firstSection = rootCategories[0];
          const sectionName = firstSection.name?.toLowerCase() || '';
          const wanted = sectionName.includes('western')
            ? ['bracelets', 'clutches', 'hair accessories']
            : sectionName.includes('traditional')
              ? ['bangles', 'traditional earrings', 'earrings']
              : [];
          const firstSub = firstSection.subcategories?.find((sub: any) => wanted.includes(String(sub.name).trim().toLowerCase())) || firstSection.subcategories?.[0];

          setActiveSectionId(firstSection._id);
          if (firstSub) setActiveSubCategoryId(firstSub._id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // 2. Fetch products when subcategory changes
  useEffect(() => {
    if (!activeSubCategoryId) {
      setProducts([]);
      return;
    }
    
    productAPI.getAll({ subCategory: activeSubCategoryId, limit: '4' })
      .then(res => setProducts(res.data.products || []))
      .catch(() => setProducts([]));
  }, [activeSubCategoryId]);

  const activeSection = useMemo(() => sections.find(s => s._id === activeSectionId) || null, [sections, activeSectionId]);
  const visibleSubCategories = useMemo(() => {
    const subs = activeSection?.subcategories || [];
    const sectionName = activeSection?.name?.toLowerCase() || '';
    const wanted = sectionName.includes('western')
      ? ['bracelets', 'clutches', 'hair accessories']
      : sectionName.includes('traditional')
        ? ['bangles', 'traditional earrings', 'earrings']
        : [];

    if (!wanted.length) return subs;

    const filtered = subs.filter((sub: any) => wanted.includes(String(sub.name).trim().toLowerCase()));
    return filtered.length ? filtered : subs;
  }, [activeSection]);
  const activeSubCategory = useMemo(() => visibleSubCategories.find((s: any) => s._id === activeSubCategoryId) || visibleSubCategories[0] || null, [visibleSubCategories, activeSubCategoryId]);

  useEffect(() => {
    if (visibleSubCategories.length && !visibleSubCategories.some((sub: any) => sub._id === activeSubCategoryId)) {
      setActiveSubCategoryId(visibleSubCategories[0]._id);
    }
  }, [visibleSubCategories, activeSubCategoryId]);

  // Extract tags/chips from metaDescription
  const chips = useMemo(() => {
    if (!activeSubCategory?.metaDescription) return [];
    return activeSubCategory.metaDescription.split(',').filter(Boolean);
  }, [activeSubCategory]);

  if (loading) {
    return <div style={{ height: '1px' }} aria-hidden="true" />;
  }

  if (sections.length === 0) return null;

  return (
    <section className="curated-wrap">
      <div className="curated-switch">
        {sections.map((item) => (
          <button
            key={item._id}
            type="button"
            className={`curated-pill ${item._id === activeSectionId ? 'active' : ''}`}
            onClick={() => {
              setActiveSectionId(item._id);
              if (item.subcategories?.length > 0) {
                const sectionName = item.name?.toLowerCase() || '';
                const wanted = sectionName.includes('western')
                  ? ['bracelets', 'clutches', 'hair accessories']
                  : sectionName.includes('traditional')
                    ? ['bangles', 'traditional earrings', 'earrings']
                    : [];
                const nextSub = item.subcategories.find((sub: any) => wanted.includes(String(sub.name).trim().toLowerCase())) || item.subcategories[0];
                setActiveSubCategoryId(nextSub._id);
              }
            }}
          >
            {item.name}
          </button>
        ))}
      </div>

      {activeSection && (
        <div className="curated-header">
          <h2>{activeSection.name}</h2>
          <p>{activeSection.description}</p>
        </div>
      )}

      {visibleSubCategories.length > 0 && (
        <div className="curated-circles" role="tablist" aria-label="Category list">
          {visibleSubCategories.map((category: any) => (
            <button
              key={category._id}
              type="button"
              className={`curated-circle ${activeSubCategoryId === category._id ? 'active' : ''}`}
              onClick={() => setActiveSubCategoryId(category._id)}
            >
              <span className="curated-circle-img">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name}
                    width={120}
                    height={120}
                    className="object-cover h-full w-full"
                    loading="lazy"
                    quality={75}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-maroon-400 font-display text-xl" style={{background:'var(--brand-cream)'}}>{category.name.charAt(0)}</div>
                )}
              </span>
              <span className="curated-circle-label">{category.name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="curated-chip-list">
        {chips.map((sub: string) => (
          <Link key={sub} href={`/products?search=${encodeURIComponent(sub)}`} className="curated-chip">
            {sub}
          </Link>
        ))}
      </div>

      <div className="curated-products">
        {products.map((product) => {
          const image = product.images?.[0]?.url || FALLBACK_IMAGE;
          const tag = product.tags?.[0];
          return (
            <Link 
              key={product._id} 
              href={`/products/${product.slug}`} 
              className="curated-product"
              prefetch={true}
              onMouseEnter={() => {
                productAPI.getBySlug(product.slug).catch(() => {});
              }}
            >
              <div className="curated-product-image">
                <Image
                  src={image}
                  alt={product.title}
                  fill
                  sizes="(max-width:640px) 45vw, (max-width:900px) 30vw, 20vw"
                  className="object-cover"
                  loading="lazy"
                  quality={80}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                  }}
                />
                {tag && <span className="curated-product-label capitalize">{tag}</span>}
              </div>
              <p className="curated-product-title line-clamp-1">{product.title}</p>
              <p className="curated-product-price">₹{(product.discountPrice || product.price).toLocaleString()}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

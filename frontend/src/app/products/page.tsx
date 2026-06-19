'use client';
import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';
import ProductCard from '@/components/products/ProductCard';
import { productAPI, categoryAPI } from '@/lib/api';

interface Filters {
  category: string;
  subCategory: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
  search: string;
  tags: string;
  featured: string;
  bestseller: string;
  newArrival: string;
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({ price: true, category: true, tags: true });

  const [filters, setFilters] = useState<Filters>({
    category: searchParams.get('category') || '',
    subCategory: searchParams.get('subCategory') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || '-createdAt',
    search: searchParams.get('search') || '',
    tags: searchParams.get('tags') || '',
    featured: searchParams.get('featured') || '',
    bestseller: searchParams.get('bestseller') || '',
    newArrival: searchParams.get('newArrival') || '',
  });

  const [page, setPage] = useState(1);
  const [priceRange, setPriceRange] = useState([
    parseInt(filters.minPrice) || 0,
    parseInt(filters.maxPrice) || 10000,
  ]);

  useEffect(() => {
    categoryAPI.getAll({ activeOnly: 'true' })
      .then(res => setCategories(res.data.categories || []))
      .catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 20, ...filters };
      if (params.minPrice) params.minPrice = priceRange[0];
      if (params.maxPrice) params.maxPrice = priceRange[1];
      // clean empty
      Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });

      const res = await productAPI.getAll(params);
      setProducts(res.data.products || []);
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch { setProducts([]); }
    finally { setLoading(false); }
  }, [filters, page, priceRange]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ category: '', subCategory: '', minPrice: '', maxPrice: '', sort: '-createdAt', search: '', tags: '', featured: '', bestseller: '', newArrival: '' });
    setPriceRange([0, 10000]);
    setPage(1);
  };

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => v && k !== 'sort').length;

  const sortOptions = [
    { value: '-createdAt', label: 'Newest First' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'rating', label: 'Top Rated' },
  ];

  const popularTags = ['anti-tarnish', 'korean', 'kundan', 'moissanite', 'ad-stone', 'chandbali', 'festive'];

  const FilterSection = ({ title, children, sectionKey }: { title: string; children: React.ReactNode; sectionKey: keyof typeof expandedSections }) => (
    <div className="border-b border-charcoal-100 pb-4 mb-4">
      <button
        onClick={() => setExpandedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }))}
        className="flex items-center justify-between w-full text-sm font-semibold text-charcoal-800 uppercase tracking-wide mb-3"
      >
        {title}
        {expandedSections[sectionKey] ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>
      {expandedSections[sectionKey] && children}
    </div>
  );

  const FilterPanel = () => (
    <div className="space-y-1">
      {/* Price Range */}
      <FilterSection title="Price Range" sectionKey="price">
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-charcoal-500 mb-1 block">Min (₹)</label>
              <input
                type="number"
                value={priceRange[0]}
                onChange={e => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                className="input-field text-sm py-2"
                min={0}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-charcoal-500 mb-1 block">Max (₹)</label>
              <input
                type="number"
                value={priceRange[1]}
                onChange={e => setPriceRange([priceRange[0], parseInt(e.target.value) || 10000])}
                className="input-field text-sm py-2"
                min={0}
              />
            </div>
          </div>
          <button
            onClick={() => { updateFilter('minPrice', priceRange[0].toString()); updateFilter('maxPrice', priceRange[1].toString()); }}
            className="w-full btn-gold py-2 text-xs"
          >
            Apply Price Filter
          </button>
          {/* Quick price chips */}
          <div className="flex flex-wrap gap-1.5">
            {[{ label: 'Under ₹500', min: 0, max: 500 }, { label: '₹500–₹1000', min: 500, max: 1000 }, { label: '₹1000–₹2000', min: 1000, max: 2000 }, { label: 'Above ₹2000', min: 2000, max: 50000 }].map(r => (
              <button
                key={r.label}
                onClick={() => { setPriceRange([r.min, r.max]); setFilters(p => ({ ...p, minPrice: r.min.toString(), maxPrice: r.max.toString() })); setPage(1); }}
                className={`text-xs px-2.5 py-1 border transition-colors ${priceRange[0] === r.min && priceRange[1] === r.max ? 'border-gold-500 bg-gold-50 text-gold-600' : 'border-charcoal-200 text-charcoal-600 hover:border-gold-400'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </FilterSection>

      {/* Category */}
      <FilterSection title="Category" sectionKey="category">
        <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
          <button
            onClick={() => { updateFilter('category', ''); updateFilter('subCategory', ''); }}
            className={`block w-full text-left text-sm py-1.5 px-2 transition-colors ${!filters.category ? 'text-gold-600 font-medium' : 'text-charcoal-600 hover:text-gold-500'}`}
          >
            All Categories
          </button>
          {categories.map(cat => (
            <div key={cat._id}>
              <button
                onClick={() => { updateFilter('category', cat._id); updateFilter('subCategory', ''); }}
                className={`block w-full text-left text-sm py-1.5 px-2 transition-colors ${filters.category === cat._id ? 'text-gold-600 font-medium bg-gold-50' : 'text-charcoal-700 hover:text-gold-500'}`}
              >
                {cat.name}
              </button>
              {filters.category === cat._id && cat.subcategories?.map((sub: any) => (
                <button
                  key={sub._id}
                  onClick={() => updateFilter('subCategory', sub._id)}
                  className={`block w-full text-left text-xs py-1 pl-5 transition-colors ${filters.subCategory === sub._id ? 'text-gold-500 font-medium' : 'text-charcoal-500 hover:text-gold-400'}`}
                >
                  — {sub.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      </FilterSection>

      {/* Tags */}
      <FilterSection title="Tags" sectionKey="tags">
        <div className="flex flex-wrap gap-1.5">
          {popularTags.map(tag => (
            <button
              key={tag}
              onClick={() => updateFilter('tags', filters.tags === tag ? '' : tag)}
              className={`text-xs px-3 py-1 border transition-colors capitalize ${filters.tags === tag ? 'border-gold-500 bg-gold-50 text-gold-600' : 'border-charcoal-200 text-charcoal-600 hover:border-gold-400'}`}
            >
              {tag.replace(/-/g, ' ')}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Special filters */}
      <div className="space-y-2 pt-2">
        {[{ key: 'newArrival', label: 'New Arrivals' }, { key: 'bestseller', label: 'Best Sellers' }, { key: 'featured', label: 'Featured' }].map(f => (
          <label key={f.key} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters[f.key as keyof Filters] === 'true'}
              onChange={e => updateFilter(f.key as keyof Filters, e.target.checked ? 'true' : '')}
              className="w-4 h-4 accent-gold-500"
            />
            <span className="text-sm text-charcoal-700">{f.label}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const topCategories = categories.filter((c: any) => !c.parentCategory);

  return (
    <div className="products-page">
      <div className="products-hero">
        {!filters.search && <p className="products-eyebrow">New Launch</p>}
        <h1 className="products-title">{filters.search ? `Results for "${filters.search}"` : 'New Launch'}</h1>
        {!filters.search && (
          <p className="products-subtitle">A curated edit of our latest arrivals, crafted for everyday elegance.</p>
        )}
      </div>

      <div className="curated-switch mb-10 flex justify-center mt-6">
        <button
          type="button"
          className={`curated-pill ${!filters.category ? 'active' : ''}`}
          onClick={() => { updateFilter('category', ''); updateFilter('subCategory', ''); }}
        >
          All Collections
        </button>
        {topCategories.map((cat: any) => (
          <button
            key={cat._id}
            type="button"
            className={`curated-pill ${filters.category === cat._id ? 'active' : ''}`}
            onClick={() => { updateFilter('category', cat._id); updateFilter('subCategory', ''); }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {filters.category && (
        <div className="products-circles mb-8">
          <button
            type="button"
            className={`products-circle ${!filters.subCategory ? 'active' : ''}`}
            onClick={() => updateFilter('subCategory', '')}
          >
            <span className="products-circle-img">
              <span className="products-circle-initial">All</span>
            </span>
            <span className="products-circle-label">All in {topCategories.find((c: any) => c._id === filters.category)?.name}</span>
          </button>

          {topCategories.find((c: any) => c._id === filters.category)?.subcategories?.map((sub: any) => (
            <button
              key={sub._id}
              type="button"
              className={`products-circle ${filters.subCategory === sub._id ? 'active' : ''}`}
              onClick={() => updateFilter('subCategory', sub._id)}
            >
              <span className="products-circle-img">
                {sub.image ? (
                  <img src={sub.image} alt={sub.name} className="object-cover w-full h-full" />
                ) : (
                  <span className="products-circle-initial">{sub.name.charAt(0)}</span>
                )}
              </span>
              <span className="products-circle-label">{sub.name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="products-filter-bar flex flex-wrap items-center justify-between gap-4">
        <div className="products-filter-left flex items-center gap-2">
          <button onClick={() => setFilterOpen(true)} className="products-filter-btn flex items-center gap-1">
            <SlidersHorizontal size={14} /> <span className="hidden sm:inline">Filter</span><span className="sm:hidden">Filters</span>
          </button>
          <div className="hidden md:flex gap-2">
            <button onClick={() => setFilterOpen(true)} className="products-filter-btn">Product type</button>
            <button onClick={() => setFilterOpen(true)} className="products-filter-btn">Price</button>
            <button onClick={() => setFilterOpen(true)} className="products-filter-btn">Availability</button>
          </div>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="products-filter-clear">Clear ({activeFilterCount})</button>
          )}
        </div>
        <div className="products-filter-right flex items-center gap-2">
          <label className="products-filter-label hidden sm:inline">Sort by:</label>
          <select
            value={filters.sort}
            onChange={e => updateFilter('sort', e.target.value)}
            className="products-filter-select"
          >
            {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <span className="products-count hidden sm:inline">{pagination.total} products</span>
        </div>
      </div>

      <div className="products-grid-wrap">

        {/* Grid */}
          {loading ? (
            <div className="product-grid">
              {Array.from({ length: 12 }).map((_, i) => <div key={i} className="skeleton aspect-product" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-display text-2xl text-charcoal-600 mb-2">No products found</p>
              <p className="text-sm text-charcoal-400 mb-5">Try adjusting your filters</p>
              <button onClick={clearFilters} className="btn-gold">Clear Filters</button>
            </div>
          ) : (
            <div className="product-grid">
              {products.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="products-pagination">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`products-page-btn ${p === page ? 'active' : ''}`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {filterOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50" onClick={() => setFilterOpen(false)} />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'tween' }}
              className="fixed top-0 left-0 h-full w-80 bg-white z-50 flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-charcoal-100">
                <h2 className="font-semibold text-charcoal-800">Filters</h2>
                <button onClick={() => setFilterOpen(false)}><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <FilterPanel />
              </div>
              <div className="px-5 py-4 border-t border-charcoal-100 flex gap-3">
                <button onClick={clearFilters} className="flex-1 btn-gold-outline py-2.5 text-sm">Clear</button>
                <button onClick={() => setFilterOpen(false)} className="flex-1 btn-gold py-2.5 text-sm">Apply</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><div className="text-gold-500">Loading...</div></div>}>
      <ProductsContent />
    </Suspense>
  );
}

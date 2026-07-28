import { Metadata } from 'next';
import HeroBanner from '@/components/home/HeroBanner';
import CuratedCategoryShowcase from '@/components/home/CuratedCategoryShowcase';
import BestSellers, { CategoryRow } from '@/components/home/BestSellers';
import Testimonials from '@/components/home/Testimonials';

export default function HomePage() {
  return (
    <div className="animate-fade-in">
      <HeroBanner />
      <CuratedCategoryShowcase />
      <BestSellers />
      <CategoryRow title="Earrings" queryParams={{ tags: 'earring' }} viewAllHref="/products?tags=earring" />
      <CategoryRow title="Necklaces" queryParams={{ tags: 'necklace' }} viewAllHref="/products?tags=necklace" />
      <CategoryRow title="Rings" queryParams={{ tags: 'ring' }} viewAllHref="/products?tags=ring" />
      <CategoryRow title="Bracelets" queryParams={{ tags: 'bracelet' }} viewAllHref="/products?tags=bracelet" />
      <Testimonials />
    </div>
  );
}

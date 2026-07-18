'use client';
import React, { Suspense } from 'react';
import { ProductsContent } from '@/app/products/page';
import { useParams } from 'next/navigation';

export default function CollectionPage() {
  const params = useParams();
  const slug = params.slug as string;

  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><div className="text-gold-500">Loading Collection...</div></div>}>
      <ProductsContent initialCategorySlug={slug} />
    </Suspense>
  );
}

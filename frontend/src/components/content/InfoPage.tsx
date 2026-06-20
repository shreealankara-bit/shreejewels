import Link from 'next/link';

type Section = {
  title: string;
  body: string;
};

type InfoPageProps = {
  eyebrow?: string;
  title: string;
  intro: string;
  sections: Section[];
  ctaLabel?: string;
  ctaHref?: string;
};

export default function InfoPage({ eyebrow = 'Shree Alankara', title, intro, sections, ctaLabel = 'Shop Jewellery', ctaHref = '/products' }: InfoPageProps) {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-16">
      <p className="text-xs uppercase tracking-[0.22em] text-gold-600 mb-3">{eyebrow}</p>
      <h1 className="font-display text-3xl md:text-4xl text-charcoal-900 mb-4">{title}</h1>
      <p className="text-charcoal-600 leading-relaxed max-w-2xl mb-10">{intro}</p>

      <div className="space-y-6">
        {sections.map((section) => (
          <section key={section.title} className="border-b border-charcoal-100 pb-6">
            <h2 className="font-display text-xl text-charcoal-900 mb-2">{section.title}</h2>
            <p className="text-sm text-charcoal-600 leading-7">{section.body}</p>
          </section>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href={ctaHref} className="btn-gold">{ctaLabel}</Link>
        <Link href="/contact" className="btn-gold-outline">Contact Support</Link>
      </div>
    </main>
  );
}


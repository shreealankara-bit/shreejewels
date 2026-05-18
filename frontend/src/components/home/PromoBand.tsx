import Link from 'next/link';

export default function PromoBand() {
  return (
    <div className="promo-band">
      <p className="promo-band-title">Festive Season Sale</p>
      <p className="promo-band-sub">Up to 80% off · Limited time only</p>
      <Link href="/products?sort=discount" className="btn-dark" style={{ fontSize: '.78rem' }}>Shop the Sale</Link>
    </div>
  );
}

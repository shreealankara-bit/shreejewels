'use client';

const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    location: 'Mumbai',
    rating: 5,
    text: "Absolutely stunning pieces! The Rajwadi Kundan set I ordered looked even more beautiful in person. Perfect for my sister's wedding. The packaging was gorgeous too!",
    product: 'Rajwadi Kundan Set',
    avatar: 'PS',
  },
  {
    name: 'Ananya Reddy',
    location: 'Hyderabad',
    rating: 5,
    text: "I've been buying jewellery online for years and ShreeJewels is by far the best. The anti-tarnish earrings are still shining like new after 6 months of daily wear!",
    product: 'Anti Tarnish Mini Hoops',
    avatar: 'AR',
  },
  {
    name: 'Kavita Menon',
    location: 'Bangalore',
    rating: 5,
    text: 'Fast delivery, quality packaging, and the jewellery is exactly as shown. The Moissanite necklace got so many compliments at my office party. Will definitely order again!',
    product: 'Moissanite Layer Necklace',
    avatar: 'KM',
  },
  {
    name: 'Deepika Joshi',
    location: 'Delhi',
    rating: 5,
    text: 'ShreeJewels never disappoints! The chandbali earrings are lightweight yet look so heavy and grand. Great for long functions. Customer support was very helpful too.',
    product: 'Chandbali Drop Pair',
    avatar: 'DJ',
  },
  {
    name: 'Shruti Nair',
    location: 'Chennai',
    rating: 5,
    text: "The Korean pearl hoops are my everyday staple now. So elegant and comfortable. I've gifted them to 3 of my friends already. Best quality at this price point!",
    product: 'Korean Pearl Hoop',
    avatar: 'SN',
  },
  {
    name: 'Meera Iyer',
    location: 'Kochi',
    rating: 5,
    text: 'Loved the Victorian stone necklace. Wore it to a reception and everyone kept asking where I got it. The clasp is sturdy and the stones are set perfectly. 10/10!',
    product: 'Victorian Stone Necklace',
    avatar: 'MI',
  },
  {
    name: 'Pooja Singh',
    location: 'Jaipur',
    rating: 5,
    text: 'The crystal stack rings are so trendy and beautifully made. They look expensive but are very affordable. ShreeJewels is my go-to for all occasions now.',
    product: 'Crystal Stack Ring',
    avatar: 'PJ',
  },
];

function TestimonialCard({ item }: { item: (typeof TESTIMONIALS)[0] }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e3e9e4',
      padding: '22px 24px',
      width: '300px',
      minWidth: '300px',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      boxShadow: '0 2px 16px rgba(0,0,0,.04)',
    }}>
      {/* Stars */}
      <div style={{ display: 'flex', gap: '2px', color: '#d4af37', fontSize: '0.9rem' }}>
        {'★★★★★'}
      </div>
      {/* Text */}
      <p style={{
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: '0.92rem',
        color: '#2a3a35',
        lineHeight: '1.65',
        fontStyle: 'italic',
        flex: 1,
        margin: 0,
      }}>
        "{item.text}"
      </p>
      {/* Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        borderTop: '1px solid #f0f4f1',
        paddingTop: '12px',
        marginTop: 'auto',
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: '#0f241b',
          color: '#fff',
          fontSize: '0.68rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          letterSpacing: '0.04em',
        }}>
          {item.avatar}
        </div>
        <div>
          <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f241b', margin: 0, lineHeight: 1.2 }}>
            {item.name}
          </p>
          <p style={{ fontSize: '0.66rem', color: '#8a9a92', margin: '2px 0 0' }}>
            {item.location} · {item.product}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  const row1 = [...TESTIMONIALS, ...TESTIMONIALS];

  return (
    <>
      <style>{`
        @keyframes marquee-left {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .t-track-left  { animation: marquee-left  28s linear infinite; }
        .t-row:hover .t-track-left { animation-play-state: paused; }
      `}</style>

      <section style={{
        padding: '52px 0 56px',
        overflow: 'hidden',
        background: '#f1f4ef',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px', padding: '0 16px' }}>
          <p style={{
            fontSize: '0.68rem',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#7a8f86',
            marginBottom: '6px',
            margin: '0 0 6px',
          }}>
            Customer Love
          </p>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontStyle: 'italic',
            color: '#0f241b',
            lineHeight: 1.1,
            margin: '0 0 8px',
            fontWeight: 500,
          }}>
            What Our Customers Say
          </h2>
          <p style={{
            fontSize: '0.74rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#5e7269',
            margin: 0,
          }}>
            Trusted by thousands across India
          </p>
        </div>

        {/* Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Row 1 — scrolls left */}
          <div className="t-row" style={{ overflow: 'hidden', position: 'relative', padding: '4px 0' }}>
            <div
              style={{
                position: 'absolute', top: 0, left: 0, bottom: 0, width: '100px',
                background: 'linear-gradient(to right, #f1f4ef 10%, transparent 100%)',
                zIndex: 2, pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute', top: 0, right: 0, bottom: 0, width: '100px',
                background: 'linear-gradient(to left, #f1f4ef 10%, transparent 100%)',
                zIndex: 2, pointerEvents: 'none',
              }}
            />
            <div className="t-track-left" style={{ display: 'flex', gap: '16px', width: 'max-content' }}>
              {row1.map((item, i) => <TestimonialCard key={i} item={item} />)}
            </div>
          </div>

        </div>
      </section>
    </>
  );
}

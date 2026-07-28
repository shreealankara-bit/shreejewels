'use client';

import { useEffect, useState } from 'react';

interface Testimonial {
  _id: string;
  name: string;
  location?: string;
  rating: number;
  comment: string;
  avatar?: string;
}

// Fallback data used only if API returns nothing
const FALLBACK_TESTIMONIALS: Testimonial[] = [
  {
    _id: 'fb1',
    name: 'Priya Sharma',
    location: 'Mumbai',
    rating: 5,
    comment: "Absolutely stunning pieces! The Rajwadi Kundan set I ordered looked even more beautiful in person. Perfect for my sister's wedding.",
  },
  {
    _id: 'fb2',
    name: 'Ananya Reddy',
    location: 'Hyderabad',
    rating: 5,
    comment: "I've been buying jewellery online for years and ShreeJewels is by far the best. The anti-tarnish earrings are still shining like new after 6 months!",
  },
  {
    _id: 'fb3',
    name: 'Kavita Menon',
    location: 'Bangalore',
    rating: 5,
    comment: 'Fast delivery, quality packaging, and the jewellery is exactly as shown. Will definitely order again!',
  },
];

function TestimonialCard({ item }: { item: Testimonial }) {
  const initials = item.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

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
        {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}
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
        &ldquo;{item.comment}&rdquo;
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
        {item.avatar ? (
          <img
            src={item.avatar}
            alt={item.name}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              objectFit: 'cover',
              flexShrink: 0,
            }}
          />
        ) : (
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
            {initials}
          </div>
        )}
        <div>
          <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f241b', margin: 0, lineHeight: 1.2 }}>
            {item.name}
          </p>
          {item.location && (
            <p style={{ fontSize: '0.66rem', color: '#8a9a92', margin: '2px 0 0' }}>
              {item.location}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(FALLBACK_TESTIMONIALS);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    fetch(`${apiUrl}/testimonials`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.testimonials?.length > 0) {
          setTestimonials(data.testimonials);
        }
        // If API returns empty, keep fallback
      })
      .catch(() => {
        // Keep fallback on error
      });
  }, []);

  const row1 = [...testimonials, ...testimonials];

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
              {row1.map((item, i) => <TestimonialCard key={`${item._id}-${i}`} item={item} />)}
            </div>
          </div>

        </div>
      </section>
    </>
  );
}

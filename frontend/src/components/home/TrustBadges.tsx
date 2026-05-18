export default function TrustBadges() {
  const items = [
    { icon: '🚚', label: 'Free Shipping', desc: 'On orders above ₹999' },
    { icon: '✅', label: '100% Authentic', desc: 'Genuine quality' },
    { icon: '🔄', label: 'Easy Returns', desc: '7-day hassle-free' },
    { icon: '💬', label: '24/7 Support', desc: 'Always here for you' },
  ];
  return (
    <div className="trust-strip">
      <div className="trust-inner">
        {items.map(({ icon, label, desc }) => (
          <div key={label} className="trust-item">
            <span className="trust-icon">{icon}</span>
            <div>
              <p className="trust-label">{label}</p>
              <p className="trust-desc">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

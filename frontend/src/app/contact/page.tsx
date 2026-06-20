import InfoPage from '@/components/content/InfoPage';

export default function ContactPage() {
  return (
    <InfoPage
      title="Contact Us"
      intro="We are here to help with product questions, orders, shipping updates, and styling support."
      sections={[
        { title: 'WhatsApp', body: 'Message us on WhatsApp at +91 98765 43210 for quick product and order support.' },
        { title: 'Email', body: 'Write to hello@shreejewels.com. We usually respond within one working day.' },
        { title: 'Location', body: 'Shree Alankara is based in Hyderabad, Telangana and ships across India.' },
      ]}
      ctaLabel="Browse Products"
    />
  );
}


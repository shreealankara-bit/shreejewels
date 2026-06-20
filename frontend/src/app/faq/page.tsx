import InfoPage from '@/components/content/InfoPage';

export default function FAQPage() {
  return (
    <InfoPage
      title="Frequently Asked Questions"
      intro="Quick answers for shopping, delivery, returns, and account support."
      sections={[
        { title: 'How do I place an order?', body: 'Choose your jewellery, add it to cart, and complete checkout with your delivery and payment details.' },
        { title: 'Can I track my order?', body: 'Yes. Sign in and open My Orders to view your latest order status and payment details.' },
        { title: 'Do you support returns?', body: 'Eligible items can be returned within the stated return window if they are unused, undamaged, and in original packaging.' },
        { title: 'How can I get product help?', body: 'Use WhatsApp or the contact page for sizing, styling, stock, and order questions.' },
      ]}
    />
  );
}


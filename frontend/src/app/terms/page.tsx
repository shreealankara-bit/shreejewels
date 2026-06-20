import InfoPage from '@/components/content/InfoPage';

export default function TermsPage() {
  return (
    <InfoPage
      title="Terms of Service"
      intro="By using Shree Alankara, you agree to shop responsibly and provide correct order and contact details."
      sections={[
        { title: 'Product Information', body: 'We try to keep product images, pricing, and stock accurate. Slight color variation may happen due to lighting or screen settings.' },
        { title: 'Orders', body: 'Orders are confirmed after payment or accepted payment method verification. We may contact you if order details need correction.' },
        { title: 'Cancellations', body: 'Cancellation and return handling depends on order status, payment status, and product eligibility.' },
      ]}
    />
  );
}


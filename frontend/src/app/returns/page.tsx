import InfoPage from '@/components/content/InfoPage';

export default function ReturnsPage() {
  return (
    <InfoPage
      title="Returns and Refunds"
      intro="We want every order to reach you in good condition. Contact us quickly if something is wrong."
      sections={[
        { title: 'Return Window', body: 'Return requests should be raised within 7 days of delivery for eligible unused products.' },
        { title: 'Condition', body: 'Items must be unused, undamaged, and returned with original packaging and order details.' },
        { title: 'Refunds', body: 'Approved refunds are processed to the original payment method or as store credit, depending on the order case.' },
      ]}
    />
  );
}


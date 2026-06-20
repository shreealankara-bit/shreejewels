import InfoPage from '@/components/content/InfoPage';

export default function ShippingPage() {
  return (
    <InfoPage
      title="Shipping Policy"
      intro="We pack every order carefully and ship across India through trusted delivery partners."
      sections={[
        { title: 'Delivery Timeline', body: 'Most orders are processed within 1 to 2 working days. Delivery timelines depend on the destination and courier availability.' },
        { title: 'Shipping Charges', body: 'Free shipping is available on eligible orders above the displayed cart threshold. Charges, if any, are shown at checkout.' },
        { title: 'Order Updates', body: 'Order and payment updates are available in My Orders after you sign in.' },
      ]}
    />
  );
}


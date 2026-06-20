import InfoPage from '@/components/content/InfoPage';

export default function PrivacyPage() {
  return (
    <InfoPage
      title="Privacy Policy"
      intro="Your information is used only to run your account, process orders, support payments, and improve your shopping experience."
      sections={[
        { title: 'Information We Collect', body: 'We collect details such as name, email, phone, address, order history, and payment status information needed to complete your purchase.' },
        { title: 'How We Use It', body: 'We use your data for login, order fulfillment, customer support, delivery updates, and fraud prevention.' },
        { title: 'Data Sharing', body: 'We share only the details required by payment, shipping, and support providers to complete the service you requested.' },
      ]}
    />
  );
}


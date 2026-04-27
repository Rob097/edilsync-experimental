import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import ContactPage from '@/public/pages/ContactPage';

export default function ContactRoute(props) {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <ContactPage {...props} />
    </QueryClientProvider>
  );
}
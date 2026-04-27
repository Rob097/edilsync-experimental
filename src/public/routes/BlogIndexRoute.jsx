import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import BlogIndexPage from '@/public/pages/BlogIndexPage';

export default function BlogIndexRoute(props) {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <BlogIndexPage {...props} />
    </QueryClientProvider>
  );
}
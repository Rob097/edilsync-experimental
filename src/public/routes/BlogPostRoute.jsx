import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import BlogPostPage from '@/public/pages/BlogPostPage';

export default function BlogPostRoute(props) {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <BlogPostPage {...props} />
    </QueryClientProvider>
  );
}
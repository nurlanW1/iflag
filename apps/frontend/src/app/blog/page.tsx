import type { Metadata } from 'next';
import BlogListingClient from '@/components/blog/BlogListingClient';

export const metadata: Metadata = {
  title: 'Blog — Flag Design, History & Resources | Flagswing',
  description:
    'Explore flag histories, design tutorials, and geopolitical insights from the Flagswing team.',
};

export default function BlogPage() {
  return <BlogListingClient />;
}

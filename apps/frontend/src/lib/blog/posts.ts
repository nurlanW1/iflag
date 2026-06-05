import sovietFlag from '../../../content/blog/history/soviet-union-flag-history.json';
import flagColors from '../../../content/blog/design/flag-colors-guide.json';
import svgGuide from '../../../content/blog/tutorials/svg-flags-web-developers.json';
import worldCup from '../../../content/blog/geopolitics/world-cup-2026-flags.json';
import timurid from '../../../content/blog/history/timurid-empire-flag.json';
import indDay from '../../../content/blog/design/independence-day-design-tips.json';

export interface BlogContentBlock {
  type: 'p' | 'h2';
  text: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  keywords: string[];
  coverGradient: string;
  content: BlogContentBlock[];
}

export const ALL_POSTS: BlogPost[] = [
  sovietFlag as BlogPost,
  flagColors as BlogPost,
  svgGuide as BlogPost,
  worldCup as BlogPost,
  timurid as BlogPost,
  indDay as BlogPost,
].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export const CATEGORIES = ['All', 'Design', 'History', 'Geopolitics', 'Tutorials'] as const;
export type Category = (typeof CATEGORIES)[number];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return ALL_POSTS.find((p) => p.slug === slug);
}

export function getRelatedPosts(current: BlogPost, limit = 3): BlogPost[] {
  return ALL_POSTS.filter(
    (p) => p.slug !== current.slug && p.category === current.category,
  )
    .slice(0, limit)
    .concat(
      ALL_POSTS.filter(
        (p) => p.slug !== current.slug && p.category !== current.category,
      ).slice(0, Math.max(0, limit - ALL_POSTS.filter((p) => p.slug !== current.slug && p.category === current.category).length)),
    )
    .slice(0, limit);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

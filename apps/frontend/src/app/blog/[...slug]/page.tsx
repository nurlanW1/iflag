import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Calendar } from 'lucide-react';
import {
  ALL_POSTS,
  getPostBySlug,
  getRelatedPosts,
  formatDate,
  type BlogContentBlock,
} from '@/lib/blog/posts';

type Props = { params: Promise<{ slug: string[] }> };

export async function generateStaticParams() {
  return ALL_POSTS.map((p) => ({ slug: p.slug.split('/') }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug.join('/'));
  if (!post) return { title: 'Post not found' };
  return {
    title: `${post.title} | Flagswing Blog`,
    description: post.excerpt,
    keywords: post.keywords,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
    },
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  History:     'bg-red-100 text-red-700',
  Design:      'bg-blue-100 text-blue-700',
  Tutorials:   'bg-slate-100 text-slate-700',
  Geopolitics: 'bg-emerald-100 text-emerald-700',
};

function ContentBlock({ block }: { block: BlogContentBlock }) {
  if (block.type === 'h2') {
    return (
      <h2 className="mb-3 mt-8 text-xl font-bold tracking-tight text-slate-900 first:mt-0">
        {block.text}
      </h2>
    );
  }
  return (
    <p className="mb-4 text-[0.95rem] leading-[1.75] text-slate-700">{block.text}</p>
  );
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug.join('/'));
  if (!post) notFound();

  const related = getRelatedPosts(post, 3);
  const categorySlug = post.slug.split('/')[0];

  return (
    <main className="marketplace-shell min-h-screen bg-[#fafaf9] pb-20 pt-8 sm:pb-24 sm:pt-10">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-400">
        <Link href="/blog" className="group inline-flex items-center gap-1.5 transition-colors hover:text-slate-700">
          <ArrowLeft size={13} strokeWidth={2} className="transition-transform group-hover:-translate-x-0.5" aria-hidden />
          Blog
        </Link>
        <span>/</span>
        <Link
          href={`/blog?category=${categorySlug}`}
          className="capitalize transition-colors hover:text-slate-700"
        >
          {post.category}
        </Link>
        <span>/</span>
        <span className="max-w-[200px] truncate text-slate-600 sm:max-w-xs">{post.title}</span>
      </nav>

      <div className="mx-auto max-w-2xl">
        {/* Cover */}
        <div
          className={`mb-8 h-52 w-full overflow-hidden rounded-2xl bg-gradient-to-br ${post.coverGradient} sm:h-64`}
          aria-hidden
        />

        {/* Meta */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              CATEGORY_COLORS[post.category] ?? 'bg-gray-100 text-gray-600'
            }`}
          >
            {post.category}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar size={12} aria-hidden />
            {formatDate(post.date)}
          </span>
        </div>

        {/* Title */}
        <h1 className="mb-4 text-2xl font-bold leading-snug tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
          {post.title}
        </h1>

        {/* Excerpt */}
        <p className="mb-8 text-base leading-relaxed text-slate-500">{post.excerpt}</p>

        {/* Divider */}
        <hr className="mb-8 border-slate-200/80" />

        {/* Content */}
        <article>
          {post.content.map((block, i) => (
            <ContentBlock key={i} block={block} />
          ))}
        </article>

        {/* Keywords */}
        {post.keywords.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2 border-t border-slate-200/80 pt-6">
            {post.keywords.map((kw) => (
              <span
                key={kw}
                className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
              >
                {kw}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="mx-auto mt-16 max-w-2xl" aria-labelledby="related-heading">
          <h2 id="related-heading" className="mb-6 text-sm font-bold uppercase tracking-[0.16em] text-slate-400">
            Related posts
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {related.map((rel) => (
              <Link
                key={rel.slug}
                href={`/blog/${rel.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className={`h-28 w-full bg-gradient-to-br ${rel.coverGradient}`} aria-hidden />
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <span
                    className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      CATEGORY_COLORS[rel.category] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {rel.category}
                  </span>
                  <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-900 group-hover:text-[var(--brand-blue)]">
                    {rel.title}
                  </h3>
                  <span className="mt-auto inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--brand-blue)] opacity-0 transition-opacity group-hover:opacity-100">
                    Read <ArrowRight size={11} aria-hidden />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

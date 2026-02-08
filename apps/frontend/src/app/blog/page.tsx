import { Flag, Calendar, User } from 'lucide-react';
import Link from 'next/link';

export default function BlogPage() {
  const blogPosts = [
    {
      id: 1,
      title: 'The History of National Flags',
      excerpt: 'Explore the fascinating history behind some of the world\'s most iconic national flags.',
      date: '2024-01-15',
      author: 'FlagStock Team',
    },
    {
      id: 2,
      title: 'Best Practices for Using Flags in Design',
      excerpt: 'Learn how to properly incorporate flag assets into your design projects.',
      date: '2024-01-10',
      author: 'FlagStock Team',
    },
    {
      id: 3,
      title: 'Vector vs Raster: Choosing the Right Flag Format',
      excerpt: 'A comprehensive guide to selecting the best flag format for your project.',
      date: '2024-01-05',
      author: 'FlagStock Team',
    },
  ];

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex items-center gap-3 mb-12">
          <Flag size={32} className="text-[#009ab6]" />
          <h1 className="text-4xl font-black text-black">Blog</h1>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <article
              key={post.id}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-bold text-black mb-3">{post.title}</h2>
              <p className="text-gray-600 mb-4">{post.excerpt}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar size={16} />
                  <span>{new Date(post.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <User size={16} />
                  <span>{post.author}</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">More blog posts coming soon!</p>
          <Link
            href="/"
            className="inline-block bg-[#009ab6] hover:bg-[#007a8a] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

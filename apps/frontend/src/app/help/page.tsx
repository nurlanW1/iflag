import { Flag, Search, Book, MessageCircle, Mail } from 'lucide-react';
import Link from 'next/link';

export default function HelpPage() {
  const helpTopics = [
    {
      title: 'Getting Started',
      description: 'Learn the basics of using FlagStock',
      icon: Book,
    },
    {
      title: 'Downloading Assets',
      description: 'How to download and use flag assets',
      icon: Flag,
    },
    {
      title: 'Account & Billing',
      description: 'Manage your account and subscription',
      icon: Mail,
    },
    {
      title: 'Licensing',
      description: 'Understand our licensing terms',
      icon: Book,
    },
  ];

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex items-center gap-3 mb-8">
          <Flag size={32} className="text-[#009ab6]" />
          <h1 className="text-4xl font-black text-black">Help Center</h1>
        </div>

        <div className="mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search for help..."
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#009ab6]"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {helpTopics.map((topic, idx) => (
            <Link
              key={idx}
              href={`/help/${topic.title.toLowerCase().replace(/\s+/g, '-')}`}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4">
                <topic.icon className="text-[#009ab6] mt-1" size={24} />
                <div>
                  <h2 className="text-xl font-bold text-black mb-2">{topic.title}</h2>
                  <p className="text-gray-600">{topic.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="bg-gray-50 rounded-xl p-8">
          <div className="flex items-start gap-4">
            <MessageCircle className="text-[#009ab6] mt-1" size={24} />
            <div>
              <h2 className="text-2xl font-bold text-black mb-4">Still Need Help?</h2>
              <p className="text-gray-700 mb-4">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <Link
                href="/contact"
                className="inline-block bg-[#009ab6] hover:bg-[#007a8a] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

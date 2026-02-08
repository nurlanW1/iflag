'use client';

import { Flag, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'What file formats are available?',
      answer: 'We offer flags in multiple formats including SVG, PNG, JPG, AI, EPS, and video formats. Vector formats are perfect for scalable designs, while raster formats work great for web and print.',
    },
    {
      question: 'Can I use flags for commercial projects?',
      answer: 'Yes! With a premium subscription, you can use all flags for commercial purposes. Free downloads come with limited commercial use rights. Please check our license terms for specific details.',
    },
    {
      question: 'How do I download flags?',
      answer: 'Simply search for the flag you need, click on it, and select your preferred format. Premium subscribers can download unlimited flags, while free users have limited downloads per month.',
    },
    {
      question: 'What is the difference between free and premium?',
      answer: 'Free accounts get access to basic flag downloads with limited monthly downloads. Premium accounts offer unlimited downloads, commercial licenses, high-resolution formats, and priority support.',
    },
    {
      question: 'Can I request a specific flag?',
      answer: 'Absolutely! We\'re constantly adding new flags to our collection. If you need a specific flag that\'s not available, contact us at support@flagstock.com and we\'ll do our best to add it.',
    },
    {
      question: 'Are the flags updated regularly?',
      answer: 'Yes, we regularly update our flag collection with new designs, corrections, and additional formats. Premium subscribers get early access to new additions.',
    },
  ];

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="flex items-center gap-3 mb-12">
          <Flag size={32} className="text-[#009ab6]" />
          <h1 className="text-4xl font-black text-black">Frequently Asked Questions</h1>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-black pr-4">{faq.question}</span>
                <ChevronDown
                  className={`text-[#009ab6] transition-transform flex-shrink-0 ${
                    openIndex === idx ? 'transform rotate-180' : ''
                  }`}
                  size={20}
                />
              </button>
              {openIndex === idx && (
                <div className="px-6 pb-4">
                  <p className="text-gray-700">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gray-50 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-black mb-4">Still have questions?</h2>
          <p className="text-gray-700 mb-4">
            Can't find the answer you're looking for? Please contact our support team.
          </p>
          <a
            href="mailto:support@flagstock.com"
            className="inline-block bg-[#009ab6] hover:bg-[#007a8a] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </main>
  );
}

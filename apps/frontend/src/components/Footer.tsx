'use client';

import Link from 'next/link';
import { Flag, Mail, Twitter, Facebook, Instagram, Linkedin, Github, X, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [showNotification, setShowNotification] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setShowNotification(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-black text-white">
      {/* Newsletter Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-4 max-w-md"
          >
            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-black font-semibold mb-1">Subscribed!</p>
                <p className="text-gray-600 text-sm">
                  Thank you for subscribing to our newsletter.
                </p>
              </div>
              <button
                onClick={() => setShowNotification(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                aria-label="Close notification"
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Flag size={32} className="text-[#009ab6]" />
              <span className="text-2xl font-black">FlagStock</span>
            </div>
            <p className="text-white/60 text-sm mb-6">
              The world's largest collection of high-quality flags, symbols, and related assets for your creative projects.
            </p>
            <div className="flex gap-4">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors">
                <Twitter size={20} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors">
                <Facebook size={20} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors">
                <Instagram size={20} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors">
                <Linkedin size={20} />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors">
                <Github size={20} />
              </a>
            </div>
          </div>

          {/* Products Column */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-[#009ab6]">Products</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/assets" className="text-white/60 hover:text-white transition-colors text-sm">
                  Browse Flags
                </Link>
              </li>
              <li>
                <Link href="/assets?asset_type=vector" className="text-white/60 hover:text-white transition-colors text-sm">
                  Vector Assets
                </Link>
              </li>
              <li>
                <Link href="/assets?asset_type=raster" className="text-white/60 hover:text-white transition-colors text-sm">
                  Raster Images
                </Link>
              </li>
              <li>
                <Link href="/assets?asset_type=video" className="text-white/60 hover:text-white transition-colors text-sm">
                  Video Assets
                </Link>
              </li>
              <li>
                <Link href="/subscriptions" className="text-white/60 hover:text-white transition-colors text-sm">
                  Premium Plans
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-[#009ab6]">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-white/60 hover:text-white transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-white/60 hover:text-white transition-colors text-sm">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-white/60 hover:text-white transition-colors text-sm">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-white/60 hover:text-white transition-colors text-sm">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/press" className="text-white/60 hover:text-white transition-colors text-sm">
                  Press Kit
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-[#009ab6]">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/help" className="text-white/60 hover:text-white transition-colors text-sm">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-white/60 hover:text-white transition-colors text-sm">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-white/60 hover:text-white transition-colors text-sm">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-white/60 hover:text-white transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/licenses" className="text-white/60 hover:text-white transition-colors text-sm">
                  License Info
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="border-t border-white/10 pt-12 mb-12">
          <div className="max-w-md">
            <h3 className="text-xl font-bold mb-2 text-white/60">Stay Updated</h3>
            <p className="text-white/60 text-sm mb-4">
              Get the latest flags, updates, and exclusive offers delivered to your inbox.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#009ab6] transition-colors"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 bg-[#009ab6] hover:bg-[#007a8a] text-white font-semibold rounded-lg transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/60 text-sm">
            © {currentYear} FlagStock. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="text-white/60 hover:text-white text-sm transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="text-white/60 hover:text-white text-sm transition-colors">
              Privacy
            </Link>
            <Link href="/cookies" className="text-white/60 hover:text-white text-sm transition-colors">
              Cookies
            </Link>
            <div className="flex items-center gap-2 text-white text-sm">
              <Mail size={16} />
              <a href="mailto:support@flagstock.com" className="text-white hover:text-white/80 transition-colors">
                support@flagstock.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

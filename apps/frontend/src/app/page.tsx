'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Search, Download, Crown, Star, ShieldCheck, Flag, Video, Image, Zap, Globe2 } from 'lucide-react';
import { motion } from 'framer-motion';
import HomeGalleryPreview from '@/components/HomeGalleryPreview';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/assets?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section with Gradient Background */}
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden py-8 md:py-12">
        {/* Dark Black and Dark Blue Gradient Background */}
        <div 
          className="absolute inset-0 bg-black"
          style={{
            background: `
              radial-gradient(circle at 20% 30%, rgba(0, 77, 90, 0.6) 0%, transparent 40%),
              radial-gradient(circle at 80% 70%, rgba(0, 54, 63, 0.7) 0%, transparent 40%),
              radial-gradient(circle at 50% 50%, rgba(0, 77, 90, 0.5) 0%, transparent 50%),
              radial-gradient(circle at 10% 80%, rgba(0, 77, 90, 0.55) 0%, transparent 30%),
              radial-gradient(circle at 90% 20%, rgba(0, 54, 63, 0.6) 0%, transparent 30%),
              linear-gradient(135deg, #000000 0%, rgba(0, 54, 63, 0.5) 25%, rgba(0, 77, 90, 0.6) 50%, rgba(0, 54, 63, 0.5) 75%, #000000 100%)
            `,
          }}
        />

        {/* Noise Texture Overlay - Enhanced */}
        <div 
          className="absolute inset-0 opacity-[0.5] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px',
          }}
        />

        {/* Additional Noise Layer */}
        <div 
          className="absolute inset-0 opacity-[0.3] mix-blend-soft-light"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter2'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter2)'/%3E%3C/svg%3E")`,
            backgroundSize: '150px 150px',
          }}
        />
        
        {/* Third Noise Layer for More Texture */}
        <div 
          className="absolute inset-0 opacity-[0.15] mix-blend-color-dodge"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter3'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter3)'/%3E%3C/svg%3E")`,
            backgroundSize: '250px 250px',
          }}
        />

        {/* Animated Gradient Orbs - Dark Blue on Black */}
        <motion.div
          className="absolute top-20 left-10 w-[500px] h-[500px] bg-[#004d5a]/25 rounded-full blur-3xl"
          animate={{
            x: [0, 80, 0],
            y: [0, -50, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-[#00363f]/22 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 50, 0],
            scale: [1, 1.4, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-[700px] h-[700px] bg-[#004d5a]/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center mb-10">
            {/* Main Headline */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full mb-6 border border-white/20"
              >
                <Star size={16} className="text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-semibold text-white">World's #1 Flag Resource</span>
              </motion.div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight text-white drop-shadow-2xl">
                World's Largest
                <br />
                <span className="bg-gradient-to-r from-[#009ab6] to-cyan-400 bg-clip-text text-transparent">
                  Flag Database
                </span>
              </h1>
              <p className="text-lg md:text-xl lg:text-2xl font-light text-white/90 mb-8 max-w-3xl mx-auto">
                High-quality flags for your projects
              </p>
            </motion.div>

            {/* Content Type Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-wrap justify-center gap-3 mb-6"
            >
            {[
              { icon: Flag, label: 'Flags', active: true },
              { icon: Image, label: 'Vector', active: false },
              { icon: Video, label: 'Video', active: false },
            ].map((item, idx) => (
              <button
                key={idx}
                className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all border backdrop-blur-sm ${
                  item.active
                    ? 'bg-[#009ab6] text-white border-[#009ab6] shadow-lg'
                    : 'bg-white/10 backdrop-blur-sm text-white border-white/20 hover:border-[#009ab6]/50 hover:bg-white/20 shadow-md'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </motion.div>

            {/* Search Bar */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              onSubmit={handleSearch}
              className="max-w-7xl mx-auto px-4 mb-6"
            >
              <div className="flex items-center bg-white rounded-xl overflow-hidden shadow-2xl border border-gray-200">
                {/* Dropdown */}
                <select className="px-6 py-4 bg-white border-r border-gray-200 text-black font-medium text-sm focus:outline-none cursor-pointer hover:bg-gray-50 transition-colors">
                  <option className="bg-white text-black">All Flags</option>
                  <option className="bg-white text-black">Vector</option>
                  <option className="bg-white text-black">Raster</option>
                  <option className="bg-white text-black">Video</option>
                </select>

                {/* Search Input */}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Start your next project"
                  className="flex-1 px-6 py-4 text-black text-lg focus:outline-none placeholder:text-gray-500 bg-transparent cursor-text"
                />

                {/* Search Button - Accent (10%) */}
                <button
                  type="submit"
                  className="px-8 py-4 bg-[#009ab6] hover:bg-[#007a8a] text-white font-semibold transition-colors flex items-center gap-2 shadow-lg cursor-pointer"
                >
                  <Search size={20} />
                  Search
                </button>
              </div>

              {/* Trending Searches */}
              <div className="mt-5 text-sm text-black backdrop-blur-sm bg-white border border-gray-200 px-5 py-2.5 rounded-full inline-block">
                Trending:{' '}
                {['usa', 'france', 'japan', 'germany', 'uk'].map((term, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSearchQuery(term)}
                    className="hover:text-[#009ab6] transition-colors mx-1 font-medium text-black"
                  >
                    {term}
                    {idx < 4 && ','}
                  </button>
                ))}
              </div>
            </motion.form>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-white via-[#006d7a]/2 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-4 text-black">Browse Flags by Region</h2>
            <p className="text-lg md:text-xl text-black/60 max-w-2xl mx-auto">
              Explore flags from around the world, organized by region and category
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            {[
              { 
                name: 'Europe', 
                icon: Globe2,
                gradient: 'from-blue-500/10 via-purple-500/10 to-blue-600/10',
                iconColor: 'text-blue-600',
              },
              { 
                name: 'Asia', 
                icon: Globe2,
                gradient: 'from-red-500/10 via-orange-500/10 to-yellow-500/10',
                iconColor: 'text-red-600',
              },
              { 
                name: 'Africa', 
                icon: Globe2,
                gradient: 'from-green-500/10 via-emerald-500/10 to-teal-500/10',
                iconColor: 'text-green-600',
              },
              { 
                name: 'Americas', 
                icon: Globe2,
                gradient: 'from-indigo-500/10 via-blue-500/10 to-cyan-500/10',
                iconColor: 'text-indigo-600',
              },
              { 
                name: 'Oceania', 
                icon: Globe2,
                gradient: 'from-cyan-500/10 via-teal-500/10 to-blue-500/10',
                iconColor: 'text-cyan-600',
              },
              { 
                name: 'Organizations', 
                icon: Flag,
                gradient: 'from-[#009ab6]/10 via-[#006d7a]/10 to-[#009ab6]/10',
                iconColor: 'text-[#009ab6]',
              },
              { 
                name: 'Autonomy', 
                icon: Globe2,
                gradient: 'from-violet-500/10 via-purple-500/10 to-fuchsia-500/10',
                iconColor: 'text-violet-600',
              },
              { 
                name: 'Historical Flag', 
                icon: Flag,
                gradient: 'from-amber-500/10 via-orange-500/10 to-yellow-500/10',
                iconColor: 'text-amber-600',
              },
            ].map((cat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.5, 
                  delay: idx * 0.08,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{ 
                  y: -12,
                  scale: 1.05,
                  transition: { duration: 0.3 }
                }}
                className="h-full w-full"
              >
                <Link
                  href={`/assets?category=${cat.name.toLowerCase()}`}
                  className="group relative block bg-white border-2 border-gray-200/60 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 text-center transition-all duration-500 aspect-square flex flex-col items-center justify-center overflow-hidden hover:border-[#009ab6] hover:shadow-2xl hover:shadow-[#009ab6]/20"
                >
                  {/* Gradient Background Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  {/* Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  
                  {/* Content */}
                  <div className="relative z-10 w-full flex flex-col items-center justify-center gap-2 sm:gap-2.5 md:gap-3">
                    {/* Icon Container */}
                    <div className="flex justify-center flex-shrink-0 mb-1">
                      <motion.div
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.6, type: "spring" }}
                        className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br ${cat.gradient} group-hover:shadow-lg flex items-center justify-center transition-all duration-500 backdrop-blur-sm border border-white/50`}
                      >
                        <cat.icon 
                          size={20} 
                          className={`${cat.iconColor} transition-all duration-500 group-hover:scale-110 sm:w-5 sm:h-5 md:w-6 md:h-6`} 
                        />
                      </motion.div>
                    </div>
                    
                    {/* Text Label */}
                    <h3 className="text-[10px] sm:text-xs md:text-sm font-bold text-black group-hover:text-[#009ab6] transition-colors duration-300 leading-tight px-1 sm:px-2 text-center break-words hyphens-auto min-h-[2.5em] flex items-center justify-center">
                      {cat.name}
                    </h3>
                    
                    {/* Arrow Icon on Hover */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      whileHover={{ opacity: 1, scale: 1 }}
                      className="flex justify-center mt-auto"
                    >
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#009ab6]/10 group-hover:bg-[#009ab6] flex items-center justify-center transition-colors duration-300">
                        <motion.svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          className="text-[#009ab6] group-hover:text-white transition-colors duration-300 sm:w-3 sm:h-3"
                          initial={{ x: 0 }}
                          whileHover={{ x: 3 }}
                          transition={{ type: "spring", stiffness: 400 }}
                        >
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </motion.svg>
                      </div>
                    </motion.div>
                  </div>
                  
                  {/* Decorative Corner Accent */}
                  <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#009ab6]/0 to-[#009ab6]/0 group-hover:from-[#009ab6]/5 group-hover:to-transparent transition-all duration-500 rounded-bl-full" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Preview Section */}
      <HomeGalleryPreview />

      {/* Stats Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-white to-[#006d7a]/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { number: '200+', label: 'Countries', icon: Globe2 },
              { number: '10K+', label: 'Flag Assets', icon: Flag },
              { number: '50K+', label: 'Downloads', icon: Download },
              { number: '5K+', label: 'Users', icon: Star },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#009ab6]/10 to-[#006d7a]/10 mb-4">
                  <stat.icon size={28} className="text-[#009ab6]" />
                </div>
                <div className="text-4xl md:text-5xl font-black text-black mb-2">{stat.number}</div>
                <div className="text-sm md:text-base text-black/60 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Plans */}
      <section className="py-24 px-4 bg-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23009ab6' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#009ab6]/10 rounded-full mb-6">
              <Crown size={18} className="text-[#009ab6]" />
              <span className="text-sm font-semibold text-[#009ab6]">Premium Plans</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black mb-6 text-black">Go Premium</h2>
            <p className="text-xl md:text-2xl text-black/60 max-w-2xl mx-auto">
              Unlock unlimited flag downloads, commercial use, and exclusive flag assets.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {[
              {
                name: 'Weekly',
                price: '$5',
                period: 'per week',
                features: ['Unlimited flag downloads', 'Commercial license', 'Priority support', 'High-res formats', 'No watermarks'],
                popular: false,
                gradient: 'from-gray-50 to-white',
              },
              {
                name: 'Monthly',
                price: '$15',
                period: 'per month',
                features: ['Everything in Weekly', 'Early access to new flags', 'Premium-only flags', 'API access', 'Bulk download', 'Custom requests'],
                popular: true,
                gradient: 'from-[#009ab6]/5 via-[#009ab6]/10 to-[#006d7a]/5',
              },
            ].map((plan, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.2, type: "spring" }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className={`group relative bg-gradient-to-br ${plan.gradient} rounded-3xl p-8 md:p-10 border-2 ${
                  plan.popular 
                    ? 'border-[#009ab6] shadow-2xl shadow-[#009ab6]/20 scale-105' 
                    : 'border-gray-200 hover:border-[#009ab6]/50 shadow-lg'
                } transition-all duration-500 overflow-hidden`}
              >
                {/* Decorative Elements */}
                {plan.popular && (
                  <>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#009ab6]/10 rounded-full blur-3xl" />
                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#009ab6]/5 rounded-full" />
                  </>
                )}


                <div className="relative z-10">
                  <div className="flex items-baseline justify-between mb-6">
                    <h3 className="text-3xl md:text-4xl font-black text-black">{plan.name}</h3>
                    <div className="text-right">
                      <div className="text-5xl md:text-6xl font-black text-[#009ab6] leading-none">{plan.price}</div>
                      <div className="text-sm text-black/60 mt-1">{plan.period}</div>
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, fIdx) => (
                      <motion.li
                        key={fIdx}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.2 + fIdx * 0.1 }}
                        className="flex items-start gap-3 text-black/80"
                      >
                        <div className="w-6 h-6 rounded-full bg-[#009ab6] flex items-center justify-center flex-shrink-0 mt-0.5">
                          <motion.svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="3"
                            initial={{ pathLength: 0 }}
                            whileInView={{ pathLength: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.2 + fIdx * 0.1 + 0.2 }}
                          >
                            <path d="M20 6L9 17l-5-5" />
                          </motion.svg>
                        </div>
                        <span className="text-base font-medium">{feature}</span>
                      </motion.li>
                    ))}
                  </ul>

                  <Link
                    href={`/subscriptions?plan=${plan.name.toLowerCase()}`}
                    className={`block w-full text-center font-bold py-4 px-6 rounded-xl transition-all duration-300 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-[#009ab6] to-[#006d7a] hover:from-[#007a8a] hover:to-[#005a66] text-white shadow-lg hover:shadow-xl'
                        : 'bg-white border-2 border-[#009ab6] text-[#009ab6] hover:bg-[#009ab6] hover:text-white'
                    }`}
                  >
                    Get {plan.name} Plan
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 bg-gradient-to-b from-[#006d7a]/5 to-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-4 text-black">How It Works</h2>
            <p className="text-lg md:text-xl text-black/60 max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-20 left-0 right-0 h-0.5 bg-gradient-to-r from-[#009ab6]/20 via-[#009ab6]/40 to-[#009ab6]/20" />

            {[
              { 
                icon: Search, 
                title: 'Search', 
                desc: 'Find the flag you need by country, region, or organization.',
                step: '01',
                color: 'from-blue-500 to-cyan-500',
              },
              { 
                icon: Download, 
                title: 'Download', 
                desc: 'Get instant access to high-res flag files in multiple formats.',
                step: '02',
                color: 'from-cyan-500 to-teal-500',
              },
              { 
                icon: ShieldCheck, 
                title: 'Use', 
                desc: 'Use flags in your projects with full commercial rights.',
                step: '03',
                color: 'from-teal-500 to-[#009ab6]',
              },
            ].map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.2 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="relative text-center group"
              >
                {/* Step Number */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-white border-4 border-[#009ab6] rounded-full flex items-center justify-center z-10">
                  <span className="text-lg font-black text-[#009ab6]">{step.step}</span>
                </div>

                <div className="bg-white rounded-3xl p-8 pt-12 border-2 border-gray-200 hover:border-[#009ab6] transition-all duration-500 shadow-lg hover:shadow-2xl">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className={`w-20 h-20 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}
                  >
                    <step.icon size={40} className="text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-4 text-black">{step.title}</h3>
                  <p className="text-black/60 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-[#009ab6] via-[#006d7a] to-[#004d5a] relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute top-20 left-20 w-96 h-96 bg-white rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -100, 0],
              y: [0, 50, 0],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"
          />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 text-white">
              Ready to Get Started?
            </h2>
            <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto">
              Join thousands of designers and developers using FlagStock for their projects
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/gallery"
                className="px-8 py-4 bg-white text-[#009ab6] font-bold rounded-xl text-lg hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
              >
                Browse Flags
              </Link>
              <Link
                href="/subscriptions"
                className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-xl text-lg hover:bg-white/10 transition-all duration-300"
              >
                View Plans
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </main>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/admin-api';
import { BarChart3, TrendingUp, Download, Users, DollarSign, Eye, Clock, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Analytics data would come from API
      // For now, using placeholder data
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for demonstration
  const mockData = {
    totalViews: 12543,
    totalDownloads: 8921,
    uniqueUsers: 3421,
    revenue: 12450,
    topAssets: [
      { name: 'United States Flag', downloads: 1243, views: 2341 },
      { name: 'United Kingdom Flag', downloads: 987, views: 1892 },
      { name: 'Canada Flag', downloads: 756, views: 1456 },
      { name: 'Germany Flag', downloads: 654, views: 1234 },
      { name: 'France Flag', downloads: 543, views: 1123 },
    ],
    dailyStats: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
      downloads: Math.floor(Math.random() * 200) + 50,
      views: Math.floor(Math.random() * 300) + 100,
    })),
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#009ab6]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-black text-gray-900 mb-2 bg-gradient-to-r from-[#009ab6] to-[#006d7a] bg-clip-text text-transparent">
              Analytics
            </h1>
            <p className="text-gray-600 text-lg">
              Track performance and user engagement metrics
            </p>
          </div>
          <div className="flex gap-2 bg-white border-2 border-gray-200 rounded-xl p-1">
            {(['7d', '30d', '90d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  timeRange === range
                    ? 'bg-[#009ab6] text-white shadow-lg'
                    : 'text-gray-600 hover:text-[#009ab6]'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : 'All Time'}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Eye}
          title="Total Views"
          value={mockData.totalViews.toLocaleString()}
          change="+12.5%"
          color="#009ab6"
        />
        <StatCard
          icon={Download}
          title="Downloads"
          value={mockData.totalDownloads.toLocaleString()}
          change="+8.3%"
          color="#10b981"
        />
        <StatCard
          icon={Users}
          title="Unique Users"
          value={mockData.uniqueUsers.toLocaleString()}
          change="+15.2%"
          color="#f59e0b"
        />
        <StatCard
          icon={DollarSign}
          title="Revenue"
          value={`$${mockData.revenue.toLocaleString()}`}
          change="+22.1%"
          color="#8b5cf6"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Downloads Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Downloads Trend</h3>
            <TrendingUp size={20} className="text-gray-400" />
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {mockData.dailyStats.map((stat, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-gradient-to-t from-[#009ab6] to-[#007a8a] rounded-t-lg transition-all hover:opacity-80"
                  style={{ height: `${(stat.downloads / 300) * 100}%` }}
                  title={`${stat.downloads} downloads`}
                />
                {idx % 5 === 0 && (
                  <span className="text-xs text-gray-500">
                    {stat.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Views Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Views Trend</h3>
            <Eye size={20} className="text-gray-400" />
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {mockData.dailyStats.map((stat, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-gradient-to-t from-[#10b981] to-[#059669] rounded-t-lg transition-all hover:opacity-80"
                  style={{ height: `${(stat.views / 400) * 100}%` }}
                  title={`${stat.views} views`}
                />
                {idx % 5 === 0 && (
                  <span className="text-xs text-gray-500">
                    {stat.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Top Assets */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-sm"
      >
        <div className="p-6 border-b border-gray-200/80 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-xl font-bold text-gray-900">Top Performing Assets</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {mockData.topAssets.map((asset, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#009ab6]/10 flex items-center justify-center font-bold text-[#009ab6]">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{asset.name}</p>
                    <p className="text-sm text-gray-500">{asset.views.toLocaleString()} views</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{asset.downloads.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">downloads</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, change, color }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
          style={{ backgroundColor: `${color}15`, color: color }}
        >
          <Icon size={24} />
        </div>
        {change && (
          <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
            {change}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm text-gray-600 mb-1 font-medium">{title}</p>
        <h3 className="text-3xl font-black text-gray-900">{value}</h3>
      </div>
    </motion.div>
  );
}

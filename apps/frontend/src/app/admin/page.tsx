'use client';

import { useState, useEffect } from 'react';
import { 
  Package, 
  Download, 
  Users, 
  DollarSign, 
  TrendingUp,
  Upload,
  ArrowRight,
  Globe,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { adminApi } = await import('@/lib/admin-api');
      const data = await adminApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Set default stats for development
      setStats({
        total_assets: 0,
        published_assets: 0,
        draft_assets: 0,
        total_downloads: 0,
        active_subscriptions: 0,
        total_subscriptions: 0,
        revenue_cents: 0,
        assets_by_type: {},
        assets_by_category: {},
        recent_uploads: []
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
        <h1 className="text-4xl font-black text-gray-900 mb-2 bg-gradient-to-r from-[#009ab6] to-[#006d7a] bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-gray-600 text-lg">
          Welcome back! Here's what's happening with your marketplace.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Package}
          title="Total Assets"
          value={stats?.total_assets || 0}
          subtitle={`${stats?.published_assets || 0} published`}
          color="#009ab6"
          trend="+12%"
        />
        <StatCard
          icon={Download}
          title="Downloads"
          value={(stats?.total_downloads || 0).toLocaleString()}
          subtitle="All time"
          color="#10b981"
          trend="+8%"
        />
        <StatCard
          icon={Users}
          title="Subscriptions"
          value={stats?.active_subscriptions || 0}
          subtitle={`${stats?.total_subscriptions || 0} total`}
          color="#f59e0b"
          trend="+5%"
        />
        <StatCard
          icon={DollarSign}
          title="Revenue"
          value={formatCurrency(stats?.revenue_cents || 0)}
          subtitle="Monthly recurring"
          color="#8b5cf6"
          trend="+15%"
        />
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className="bg-gradient-to-br from-[#009ab6] to-[#006d7a] rounded-2xl p-8 shadow-xl shadow-[#009ab6]/20">
          <h3 className="text-xl font-bold text-white mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/countries/new"
              className="group bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-5 border border-white/20 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <Globe size={24} className="text-white" />
                <ArrowRight size={18} className="text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
              <h4 className="text-white font-semibold mb-1">Add Country</h4>
              <p className="text-white/70 text-sm">Create a new country entry</p>
            </Link>
            <Link
              href="/admin/upload"
              className="group bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-5 border border-white/20 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <Upload size={24} className="text-white" />
                <ArrowRight size={18} className="text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
              <h4 className="text-white font-semibold mb-1">Upload Assets</h4>
              <p className="text-white/70 text-sm">Upload new flag files</p>
            </Link>
            <Link
              href="/admin/countries"
              className="group bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-5 border border-white/20 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <Package size={24} className="text-white" />
                <ArrowRight size={18} className="text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
              <h4 className="text-white font-semibold mb-1">Manage Countries</h4>
              <p className="text-white/70 text-sm">View and edit countries</p>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Assets by Type */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Assets by Type</h3>
            <FileText size={20} className="text-gray-400" />
          </div>
          <div className="space-y-4">
            {Object.entries(stats?.assets_by_type || {}).length > 0 ? (
              Object.entries(stats.assets_by_type).map(([type, count]: [string, any], idx) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#009ab6]" />
                    <span className="text-gray-700 capitalize font-medium">{type.replace('_', ' ')}</span>
                  </div>
                  <span className="font-bold text-gray-900 text-lg">{count}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <FileText size={48} className="mx-auto mb-2 opacity-50" />
                <p>No assets yet</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Assets by Category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Assets by Category</h3>
            <TrendingUp size={20} className="text-gray-400" />
          </div>
          <div className="space-y-4">
            {Object.entries(stats?.assets_by_category || {}).length > 0 ? (
              Object.entries(stats.assets_by_category).map(([category, count]: [string, any]) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#10b981]" />
                    <span className="text-gray-700 font-medium">{category}</span>
                  </div>
                  <span className="font-bold text-gray-900 text-lg">{count}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <TrendingUp size={48} className="mx-auto mb-2 opacity-50" />
                <p>No categories yet</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Uploads */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-sm"
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200/80 bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-900">Recent Uploads</h3>
          <Link 
            href="/admin/assets" 
            className="text-[#009ab6] hover:text-[#007a8a] text-sm font-semibold transition-colors flex items-center gap-1"
          >
            View All
            <ArrowRight size={14} />
          </Link>
        </div>
        <div className="p-6">
          {stats?.recent_uploads && stats.recent_uploads.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200/80">
                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Title</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Uploaded</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.recent_uploads.map((asset: any) => (
                    <tr key={asset.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-4 text-gray-900 font-medium">{asset.title}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          asset.status === 'published' 
                            ? 'bg-green-100 text-green-700' 
                            : asset.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {asset.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-600 text-sm">
                        {new Date(asset.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link 
                          href={`/admin/assets/${asset.id}`} 
                          className="text-[#009ab6] hover:text-[#007a8a] text-sm font-semibold transition-colors inline-flex items-center gap-1"
                        >
                          Edit
                          <ArrowRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Package size={48} className="mx-auto mb-3 opacity-50" />
              <p>No assets uploaded yet</p>
              <Link
                href="/admin/upload"
                className="inline-flex items-center gap-2 mt-4 text-[#009ab6] hover:text-[#007a8a] font-semibold text-sm"
              >
                Upload your first asset
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, subtitle, color, trend }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-4">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow"
          style={{ backgroundColor: `${color}15`, color: color }}
        >
          <Icon size={24} />
        </div>
        {trend && (
          <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm text-gray-600 mb-1 font-medium">{title}</p>
        <h3 className="text-3xl font-black text-gray-900 mb-1">{value}</h3>
        {subtitle && (
          <p className="text-xs text-gray-500">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}

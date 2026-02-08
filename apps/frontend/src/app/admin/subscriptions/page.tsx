'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/admin-api';
import { Users, DollarSign, TrendingUp, CheckCircle2, XCircle, Clock, Calendar, Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

interface Subscription {
  id: string;
  plan_name: string;
  duration_days: number;
  price_cents: number;
  total_subscriptions: number;
  active_subscriptions: number;
  canceled_subscriptions: number;
  monthly_revenue: number;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    canceled: 0,
    revenue: 0,
  });

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getSubscriptions();
      setSubscriptions(data || []);
      
      // Calculate stats
      const total = data?.reduce((sum: number, sub: Subscription) => sum + (sub.total_subscriptions || 0), 0) || 0;
      const active = data?.reduce((sum: number, sub: Subscription) => sum + (sub.active_subscriptions || 0), 0) || 0;
      const canceled = data?.reduce((sum: number, sub: Subscription) => sum + (sub.canceled_subscriptions || 0), 0) || 0;
      const revenue = data?.reduce((sum: number, sub: Subscription) => sum + (sub.monthly_revenue || 0), 0) || 0;
      
      setStats({ total, active, canceled, revenue });
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
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
          Subscriptions
        </h1>
        <p className="text-gray-600 text-lg">
          Manage subscription plans and track subscriber activity
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Users}
          title="Total Subscriptions"
          value={stats.total}
          color="#009ab6"
        />
        <StatCard
          icon={CheckCircle2}
          title="Active"
          value={stats.active}
          color="#10b981"
        />
        <StatCard
          icon={XCircle}
          title="Canceled"
          value={stats.canceled}
          color="#ef4444"
        />
        <StatCard
          icon={DollarSign}
          title="Monthly Revenue"
          value={formatCurrency(stats.revenue)}
          color="#8b5cf6"
        />
      </div>

      {/* Subscriptions Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-sm"
      >
        <div className="p-6 border-b border-gray-200/80 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-xl font-bold text-gray-900">Subscription Plans</h2>
        </div>
        
        {subscriptions.length === 0 ? (
          <div className="text-center py-20">
            <Users size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No subscriptions yet</h3>
            <p className="text-gray-600">Subscription data will appear here once users subscribe</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider">Plan</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider">Duration</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider">Price</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider">Total</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider">Active</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider">Canceled</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subscriptions.map((sub, idx) => (
                  <motion.tr
                    key={sub.id || idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="font-bold text-gray-900">{sub.plan_name}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar size={16} className="text-gray-400" />
                        {sub.duration_days} days
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-gray-900">{formatCurrency(sub.price_cents)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-gray-700">{sub.total_subscriptions || 0}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        <CheckCircle2 size={12} />
                        {sub.active_subscriptions || 0}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                        <XCircle size={12} />
                        {sub.canceled_subscriptions || 0}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-green-600">{formatCurrency(sub.monthly_revenue || 0)}</span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, color }: any) {
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
      </div>
      <div>
        <p className="text-sm text-gray-600 mb-1 font-medium">{title}</p>
        <h3 className="text-3xl font-black text-gray-900">{value}</h3>
      </div>
    </motion.div>
  );
}

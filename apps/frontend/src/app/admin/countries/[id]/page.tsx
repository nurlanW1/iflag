'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminApi } from '@/lib/admin-api';
import { ArrowLeft, Save, Upload, X, Edit2, Trash2, Image as ImageIcon, CheckCircle2, AlertCircle, Globe, FileText } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Country {
  id: string;
  name: string;
  slug: string;
  name_alt: string[];
  iso_alpha_2: string | null;
  iso_alpha_3: string | null;
  iso_numeric: string | null;
  region: string | null;
  subregion: string | null;
  category: string;
  description: string | null;
  flag_emoji: string | null;
  thumbnail_url: string | null;
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
  display_order: number;
  keywords: string[];
  flag_count: number;
  published_flag_count: number;
}

interface FlagFile {
  id: string;
  file_name: string;
  file_url: string;
  format: string;
  variant_name: string | null;
  ratio: string | null;
  premium_tier: string;
  status: string;
  created_at: string;
}

export default function CountryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const countryId = params.id as string;
  const isNew = countryId === 'new';

  const [country, setCountry] = useState<Country | null>(null);
  const [flagFiles, setFlagFiles] = useState<FlagFile[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    iso_alpha_2: '',
    iso_alpha_3: '',
    iso_numeric: '',
    region: '',
    subregion: '',
    category: 'country',
    description: '',
    flag_emoji: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
    is_featured: false,
    display_order: 0,
    keywords: [] as string[],
  });

  useEffect(() => {
    if (!isNew) {
      loadCountry();
      loadFlagFiles();
    }
  }, [countryId, isNew]);

  const loadCountry = async () => {
    try {
      const data = await adminApi.getCountry(countryId);
      setCountry(data);
      setFormData({
        name: data.name || '',
        slug: data.slug || '',
        iso_alpha_2: data.iso_alpha_2 || '',
        iso_alpha_3: data.iso_alpha_3 || '',
        iso_numeric: data.iso_numeric || '',
        region: data.region || '',
        subregion: data.subregion || '',
        category: data.category || 'country',
        description: data.description || '',
        flag_emoji: data.flag_emoji || '',
        status: data.status || 'draft',
        is_featured: data.is_featured || false,
        display_order: data.display_order || 0,
        keywords: data.keywords || [],
      });
    } catch (error) {
      console.error('Failed to load country:', error);
      alert('Failed to load country');
    } finally {
      setLoading(false);
    }
  };

  const loadFlagFiles = async () => {
    try {
      const files = await adminApi.getCountryFlags(countryId);
      setFlagFiles(files);
    } catch (error) {
      console.error('Failed to load flag files:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Country name is required');
      return;
    }

    setSaving(true);
    try {
      const data = {
        ...formData,
        iso_alpha_2: formData.iso_alpha_2 || null,
        iso_alpha_3: formData.iso_alpha_3 || null,
        iso_numeric: formData.iso_numeric || null,
        region: formData.region || null,
        subregion: formData.subregion || null,
        description: formData.description || null,
        flag_emoji: formData.flag_emoji || null,
        keywords: formData.keywords,
      };

      if (isNew) {
        const newCountry = await adminApi.createCountry(data);
        router.push(`/admin/countries/${newCountry.id}`);
      } else {
        await adminApi.updateCountry(countryId, data);
        await loadCountry();
      }
      alert('Country saved successfully');
    } catch (error: any) {
      alert(error.message || 'Failed to save country');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('variant_name', 'flat');
      formData.append('status', 'draft');

      await adminApi.uploadFlagFile(countryId, formData);
      await loadFlagFiles();
      alert('Flag file uploaded successfully');
    } catch (error: any) {
      alert(error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteFlag = async (flagId: string) => {
    if (!confirm('Are you sure you want to delete this flag file?')) return;

    try {
      await adminApi.deleteFlagFile(flagId);
      await loadFlagFiles();
    } catch (error: any) {
      alert(error.message || 'Failed to delete flag file');
    }
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
        <Link
          href="/admin/countries"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-[#009ab6] mb-4 font-medium transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Countries
        </Link>
        <h1 className="text-4xl font-black text-gray-900 mb-2 bg-gradient-to-r from-[#009ab6] to-[#006d7a] bg-clip-text text-transparent">
          {isNew ? 'Create New Country' : country?.name || 'Edit Country'}
        </h1>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Globe size={24} className="text-[#009ab6]" />
              Basic Information
            </h2>

            <div className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Country Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (isNew && !formData.slug) {
                      setFormData(prev => ({
                        ...prev,
                        slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
                      }));
                    }
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#009ab6] focus:ring-4 focus:ring-[#009ab6]/10 transition-all text-gray-900"
                  required
                  placeholder="e.g., United States"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#009ab6] focus:ring-4 focus:ring-[#009ab6]/10 transition-all text-gray-900 font-mono text-sm"
                  required
                  placeholder="e.g., united-states"
                />
                <p className="text-xs text-gray-500 mt-1">Used in URLs</p>
              </div>

              {/* ISO Codes */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    ISO Alpha-2
                  </label>
                  <input
                    type="text"
                    value={formData.iso_alpha_2}
                    onChange={(e) => setFormData({ ...formData, iso_alpha_2: e.target.value.toUpperCase() })}
                    maxLength={2}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#009ab6] focus:ring-4 focus:ring-[#009ab6]/10 transition-all text-gray-900 font-mono text-center font-bold"
                    placeholder="US"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    ISO Alpha-3
                  </label>
                  <input
                    type="text"
                    value={formData.iso_alpha_3}
                    onChange={(e) => setFormData({ ...formData, iso_alpha_3: e.target.value.toUpperCase() })}
                    maxLength={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#009ab6] focus:ring-4 focus:ring-[#009ab6]/10 transition-all text-gray-900 font-mono text-center font-bold"
                    placeholder="USA"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    ISO Numeric
                  </label>
                  <input
                    type="text"
                    value={formData.iso_numeric}
                    onChange={(e) => setFormData({ ...formData, iso_numeric: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#009ab6] focus:ring-4 focus:ring-[#009ab6]/10 transition-all text-gray-900 font-mono text-center"
                    placeholder="840"
                  />
                </div>
              </div>

              {/* Region & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Region
                  </label>
                  <select
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#009ab6] focus:ring-4 focus:ring-[#009ab6]/10 transition-all text-gray-900"
                  >
                    <option value="">Select region</option>
                    <option value="Europe">Europe</option>
                    <option value="Asia">Asia</option>
                    <option value="Africa">Africa</option>
                    <option value="Americas">Americas</option>
                    <option value="Oceania">Oceania</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#009ab6] focus:ring-4 focus:ring-[#009ab6]/10 transition-all text-gray-900"
                  >
                    <option value="country">Country</option>
                    <option value="autonomy">Autonomy</option>
                    <option value="organization">Organization</option>
                    <option value="historical">Historical</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#009ab6] focus:ring-4 focus:ring-[#009ab6]/10 transition-all text-gray-900 resize-none"
                  placeholder="Brief description of the country..."
                />
              </div>

              {/* Status & Display Order */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#009ab6] focus:ring-4 focus:ring-[#009ab6]/10 transition-all text-gray-900"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#009ab6] focus:ring-4 focus:ring-[#009ab6]/10 transition-all text-gray-900"
                  />
                </div>
              </div>

              {/* Featured */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="w-5 h-5 text-[#009ab6] border-gray-300 rounded focus:ring-[#009ab6] focus:ring-2"
                />
                <label htmlFor="is_featured" className="text-sm font-semibold text-gray-700 cursor-pointer">
                  Featured Country
                </label>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-gradient-to-r from-[#009ab6] to-[#007a8a] hover:from-[#007a8a] hover:to-[#006d7a] text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-[#009ab6]/20 hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={20} />
                {saving ? 'Saving...' : isNew ? 'Create Country' : 'Save Changes'}
              </button>
            </div>
          </motion.div>

          {/* Flag Files Section */}
          {!isNew && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText size={24} className="text-[#009ab6]" />
                  Flag Files
                </h2>
                <label className="flex items-center gap-2 bg-gradient-to-r from-[#009ab6] to-[#007a8a] hover:from-[#007a8a] hover:to-[#006d7a] text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-[#009ab6]/20 hover:shadow-xl transition-all cursor-pointer">
                  <Upload size={18} />
                  Upload Flag
                  <input
                    type="file"
                    accept="image/png,image/svg+xml,image/jpeg,image/jpg,image/webp"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>

              {flagFiles.length === 0 ? (
                <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                  <ImageIcon size={48} className="mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No flag files uploaded yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {flagFiles.map((flag) => (
                    <div key={flag.id} className="border-2 border-gray-200 rounded-xl p-4 hover:border-[#009ab6] transition-colors group">
                      <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                        <img
                          src={flag.file_url}
                          alt={flag.file_name}
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-flag.jpg';
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm font-bold text-gray-900 truncate">{flag.file_name}</div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">{flag.format}</span>
                          {flag.variant_name && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold">{flag.variant_name}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            onClick={() => handleDeleteFlag(flag.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Sidebar Stats */}
        {!isNew && country && (
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-[#009ab6] to-[#006d7a] rounded-2xl p-6 shadow-xl shadow-[#009ab6]/20 sticky top-8"
            >
              <h3 className="text-lg font-bold text-white mb-6">Statistics</h3>
              <div className="space-y-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-sm text-white/80 mb-1">Total Flags</div>
                  <div className="text-3xl font-black text-white">{country.flag_count}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-sm text-white/80 mb-1">Published Flags</div>
                  <div className="text-3xl font-black text-green-300">{country.published_flag_count}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-sm text-white/80 mb-2">Status</div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                    country.status === 'published'
                      ? 'bg-green-500 text-white'
                      : country.status === 'draft'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-gray-500 text-white'
                  }`}>
                    {country.status === 'published' ? (
                      <CheckCircle2 size={12} />
                    ) : (
                      <AlertCircle size={12} />
                    )}
                    {country.status}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

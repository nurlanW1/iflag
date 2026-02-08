'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, Check, AlertCircle, FileText, Image as ImageIcon, Video, File, Loader2, CheckCircle2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    asset_type: 'flag',
    category_id: '',
    country_code: '',
    organization_name: '',
    is_premium: false,
    status: 'draft',
    tags: '',
    style: '',
  });

  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { adminApi } = await import('@/lib/admin-api');
      const data = await adminApi.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return ImageIcon;
    if (file.type.startsWith('video/')) return Video;
    return File;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (files.length === 0) {
      setError('Please select at least one file');
      return;
    }

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const { adminApi } = await import('@/lib/admin-api');
      
      const formDataToSend = new FormData();
      
      // Add files
      files.forEach(file => {
        formDataToSend.append('files', file);
      });

      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          formDataToSend.append(key, value.toString());
        }
      });

      const data = await adminApi.uploadAssets(formDataToSend);
      setResult(data);
      setUploadProgress(100);
      clearInterval(progressInterval);

      // Reset form after successful upload
      setTimeout(() => {
        setFiles([]);
        setFormData({
          title: '',
          description: '',
          asset_type: 'flag',
          category_id: '',
          country_code: '',
          organization_name: '',
          is_premium: false,
          status: 'draft',
          tags: '',
          style: '',
        });
        setResult(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      clearInterval(progressInterval);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-black text-gray-900 mb-2 bg-gradient-to-r from-[#009ab6] to-[#006d7a] bg-clip-text text-transparent">
          Upload Assets
        </h1>
        <p className="text-gray-600 text-lg">
          Upload multiple files for a single flag asset with metadata
        </p>
      </motion.div>

      {/* Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3"
          >
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800 font-semibold">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-start gap-3"
          >
            <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-green-800 font-semibold">Upload Successful!</p>
              <p className="text-green-700 text-sm">
                {result.files_uploaded} files uploaded, {result.files_processed} processed.
              </p>
            </div>
            <button
              onClick={() => setResult(null)}
              className="text-green-600 hover:text-green-800"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-2 border-gray-200/80 rounded-2xl p-6 shadow-sm"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Upload size={24} className="text-[#009ab6]" />
            Files
            <span className="text-red-500">*</span>
          </h2>

          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-[#009ab6] bg-[#009ab6]/5 scale-[1.02]'
                : 'border-gray-300 hover:border-[#009ab6] hover:bg-gray-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".svg,.eps,.png,.jpg,.jpeg,.tiff,.tif,.mp4,.webm"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <motion.div
              animate={{ scale: isDragging ? 1.1 : 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                isDragging ? 'bg-[#009ab6]' : 'bg-gray-100'
              } transition-colors`}>
                <Upload size={32} className={isDragging ? 'text-white' : 'text-gray-400'} />
              </div>
              <div>
                <p className="text-gray-900 font-semibold text-lg mb-1">
                  {isDragging ? 'Drop files here' : 'Click to select files or drag and drop'}
                </p>
                <p className="text-sm text-gray-500">
                  Supports: SVG, EPS, PNG, JPG, TIFF, MP4, WEBM
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Maximum 500MB per file, up to 20 files
                </p>
              </div>
            </motion.div>
          </div>

          {/* Selected Files List */}
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-6 space-y-2"
            >
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Selected Files ({files.length})
              </h3>
              {files.map((file, index) => {
                const FileIcon = getFileIcon(file);
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-[#009ab6] transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#009ab6]/10 flex items-center justify-center flex-shrink-0">
                      <FileIcon size={20} className="text-[#009ab6]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X size={18} />
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </motion.div>

        {/* Metadata Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm"
            >
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#009ab6] focus:ring-4 focus:ring-[#009ab6]/10 transition-all text-gray-900"
                required
                placeholder="e.g., United States Flag"
              />
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm"
            >
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#009ab6] focus:ring-4 focus:ring-[#009ab6]/10 transition-all text-gray-900 resize-none"
                placeholder="Asset description..."
              />
            </motion.div>

            {/* Asset Type */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm"
            >
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Asset Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.asset_type}
                onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#009ab6] focus:ring-4 focus:ring-[#009ab6]/10 transition-all text-gray-900 bg-white"
                required
              >
                <option value="flag">Flag</option>
                <option value="emblem">Emblem</option>
                <option value="coat_of_arms">Coat of Arms</option>
                <option value="symbol">Symbol</option>
                <option value="video">Video</option>
                <option value="animated">Animated</option>
              </select>
            </motion.div>

            {/* Category */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm"
            >
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#009ab6] focus:ring-4 focus:ring-[#009ab6]/10 transition-all text-gray-900 bg-white"
              >
                <option value="">Select category...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Country Code */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm"
            >
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Country Code (ISO 3166-1 alpha-3)
              </label>
              <input
                type="text"
                value={formData.country_code}
                onChange={(e) => setFormData({ ...formData, country_code: e.target.value.toUpperCase() })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#009ab6] focus:ring-4 focus:ring-[#009ab6]/10 transition-all text-gray-900 font-mono text-center font-bold"
                placeholder="USA"
                maxLength={3}
              />
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <Info size={12} />
                Use 3-letter ISO code (e.g., USA, GBR, FRA)
              </p>
            </motion.div>

            {/* Organization Name */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm"
            >
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Organization Name
              </label>
              <input
                type="text"
                value={formData.organization_name}
                onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#009ab6] focus:ring-4 focus:ring-[#009ab6]/10 transition-all text-gray-900"
                placeholder="e.g., United Nations, European Union"
              />
            </motion.div>

            {/* Style */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm"
            >
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Style
              </label>
              <select
                value={formData.style}
                onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#009ab6] focus:ring-4 focus:ring-[#009ab6]/10 transition-all text-gray-900 bg-white"
              >
                <option value="">Select style...</option>
                <option value="flat">Flat</option>
                <option value="waving">Waving</option>
                <option value="icon">Icon</option>
                <option value="round">Round</option>
                <option value="heart">Heart Shape</option>
                <option value="mockup">Mockup</option>
                <option value="fx">FX / Stylized</option>
              </select>
            </motion.div>

            {/* Tags */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm"
            >
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#009ab6] focus:ring-4 focus:ring-[#009ab6]/10 transition-all text-gray-900"
                placeholder="usa, america, stars, stripes"
              />
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <Info size={12} />
                Separate multiple tags with commas
              </p>
            </motion.div>
          </div>
        </div>

        {/* Pricing & Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pricing */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-4">
                Pricing
              </label>
              <div className="flex gap-4">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    checked={!formData.is_premium}
                    onChange={() => setFormData({ ...formData, is_premium: false })}
                    className="sr-only"
                  />
                  <div className={`p-4 rounded-xl border-2 transition-all ${
                    !formData.is_premium
                      ? 'border-[#009ab6] bg-[#009ab6]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        !formData.is_premium
                          ? 'border-[#009ab6]'
                          : 'border-gray-300'
                      }`}>
                        {!formData.is_premium && (
                          <div className="w-3 h-3 rounded-full bg-[#009ab6]" />
                        )}
                      </div>
                      <span className={`font-semibold ${
                        !formData.is_premium ? 'text-[#009ab6]' : 'text-gray-700'
                      }`}>
                        Free
                      </span>
                    </div>
                  </div>
                </label>
                <label className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    checked={formData.is_premium}
                    onChange={() => setFormData({ ...formData, is_premium: true })}
                    className="sr-only"
                  />
                  <div className={`p-4 rounded-xl border-2 transition-all ${
                    formData.is_premium
                      ? 'border-[#009ab6] bg-[#009ab6]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        formData.is_premium
                          ? 'border-[#009ab6]'
                          : 'border-gray-300'
                      }`}>
                        {formData.is_premium && (
                          <div className="w-3 h-3 rounded-full bg-[#009ab6]" />
                        )}
                      </div>
                      <span className={`font-semibold ${
                        formData.is_premium ? 'text-[#009ab6]' : 'text-gray-700'
                      }`}>
                        Premium
                      </span>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-4">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#009ab6] focus:ring-4 focus:ring-[#009ab6]/10 transition-all text-gray-900 bg-white"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Upload Progress */}
        {uploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white border-2 border-[#009ab6] rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-4 mb-4">
              <Loader2 size={24} className="text-[#009ab6] animate-spin" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Uploading files...</p>
                <p className="text-sm text-gray-600">{uploadProgress}% complete</p>
              </div>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                className="h-full bg-gradient-to-r from-[#009ab6] to-[#007a8a] rounded-full"
              />
            </div>
          </motion.div>
        )}

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex gap-4 justify-end pt-4"
        >
          <button
            type="button"
            onClick={() => router.back()}
            disabled={uploading}
            className="px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploading || files.length === 0 || !formData.title.trim()}
            className="flex items-center gap-2 bg-gradient-to-r from-[#009ab6] to-[#007a8a] hover:from-[#007a8a] hover:to-[#006d7a] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-[#009ab6]/20 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={20} />
                Upload Assets
              </>
            )}
          </button>
        </motion.div>
      </form>
    </div>
  );
}

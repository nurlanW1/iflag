'use client';

import { useState } from 'react';
import { Settings, Save, Globe, Lock, Bell, Palette, Database, Shield, Mail, Key } from 'lucide-react';
import { motion } from 'framer-motion';
import { getSiteOrigin, SITE_DESCRIPTION, SITE_NAME } from '@/lib/seo/site-config';

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    siteName: SITE_NAME,
    siteDescription: SITE_DESCRIPTION,
    siteUrl: getSiteOrigin(),
    adminEmail: 'admin@example.com',
    enableRegistration: true,
    enableEmailVerification: true,
    enableWatermarks: true,
    watermarkText: SITE_NAME,
    maxFileSize: 500,
    allowedFormats: ['svg', 'png', 'jpg', 'webp', 'eps'],
    enableAnalytics: true,
    enableNotifications: true,
    notificationEmail: 'notifications@example.com',
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save settings to API
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Settings saved successfully!');
    } catch (error) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const SettingSection = ({ icon: Icon, title, children }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm"
    >
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
        <div className="w-10 h-10 rounded-xl bg-[#009ab6]/10 flex items-center justify-center">
          <Icon size={20} className="text-[#009ab6]" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      </div>
      <div className="space-y-5">
        {children}
      </div>
    </motion.div>
  );

  const SettingField = ({ label, description, children }: any) => (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
      {description && (
        <p className="text-xs text-gray-500 mb-3">{description}</p>
      )}
      {children}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-black text-gray-900 mb-2 bg-gradient-to-r from-[#009ab6] to-[#006d7a] bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-gray-600 text-lg">
          Configure your marketplace settings and preferences
        </p>
      </motion.div>

      <div className="space-y-6">
        {/* General Settings */}
        <SettingSection icon={Globe} title="General Settings">
          <SettingField label="Site Name" description="The name of your marketplace">
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#009ab6] focus:ring-4 focus:ring-[#009ab6]/10 transition-all text-gray-900"
            />
          </SettingField>
          <SettingField label="Site Description" description="Brief description for SEO">
            <textarea
              value={settings.siteDescription}
              onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#009ab6] focus:ring-4 focus:ring-[#009ab6]/10 transition-all text-gray-900 resize-none"
            />
          </SettingField>
          <SettingField label="Site URL" description="Your website's base URL">
            <input
              type="url"
              value={settings.siteUrl}
              onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#009ab6] focus:ring-4 focus:ring-[#009ab6]/10 transition-all text-gray-900"
            />
          </SettingField>
        </SettingSection>

        {/* Security Settings */}
        <SettingSection icon={Shield} title="Security & Access">
          <SettingField label="Admin Email" description="Primary admin email address">
            <input
              type="email"
              value={settings.adminEmail}
              onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#009ab6] focus:ring-4 focus:ring-[#009ab6]/10 transition-all text-gray-900"
            />
          </SettingField>
          <SettingField label="User Registration" description="Allow new users to register">
            <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={settings.enableRegistration}
                onChange={(e) => setSettings({ ...settings, enableRegistration: e.target.checked })}
                className="w-5 h-5 text-[#009ab6] border-gray-300 rounded focus:ring-[#009ab6] focus:ring-2"
              />
              <span className="font-semibold text-gray-700">Enable user registration</span>
            </label>
          </SettingField>
          <SettingField label="Email Verification" description="Require email verification for new users">
            <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={settings.enableEmailVerification}
                onChange={(e) => setSettings({ ...settings, enableEmailVerification: e.target.checked })}
                className="w-5 h-5 text-[#009ab6] border-gray-300 rounded focus:ring-[#009ab6] focus:ring-2"
              />
              <span className="font-semibold text-gray-700">Require email verification</span>
            </label>
          </SettingField>
        </SettingSection>

        {/* Upload Settings */}
        <SettingSection icon={Database} title="Upload Settings">
          <SettingField label="Maximum File Size (MB)" description="Maximum allowed file size for uploads">
            <input
              type="number"
              value={settings.maxFileSize}
              onChange={(e) => setSettings({ ...settings, maxFileSize: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#009ab6] focus:ring-4 focus:ring-[#009ab6]/10 transition-all text-gray-900"
              min="1"
              max="1000"
            />
          </SettingField>
          <SettingField label="Allowed Formats" description="File formats users can upload">
            <div className="flex flex-wrap gap-2">
              {['svg', 'png', 'jpg', 'jpeg', 'webp', 'eps', 'pdf', 'mp4', 'webm'].map((format) => (
                <label
                  key={format}
                  className={`px-4 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                    settings.allowedFormats.includes(format)
                      ? 'border-[#009ab6] bg-[#009ab6]/5 text-[#009ab6] font-semibold'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={settings.allowedFormats.includes(format)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSettings({ ...settings, allowedFormats: [...settings.allowedFormats, format] });
                      } else {
                        setSettings({ ...settings, allowedFormats: settings.allowedFormats.filter(f => f !== format) });
                      }
                    }}
                    className="sr-only"
                  />
                  {format.toUpperCase()}
                </label>
              ))}
            </div>
          </SettingField>
          <SettingField label="Watermark Settings" description="Add watermarks to free/premium assets">
            <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors mb-4">
              <input
                type="checkbox"
                checked={settings.enableWatermarks}
                onChange={(e) => setSettings({ ...settings, enableWatermarks: e.target.checked })}
                className="w-5 h-5 text-[#009ab6] border-gray-300 rounded focus:ring-[#009ab6] focus:ring-2"
              />
              <span className="font-semibold text-gray-700">Enable watermarks</span>
            </label>
            {settings.enableWatermarks && (
              <input
                type="text"
                value={settings.watermarkText}
                onChange={(e) => setSettings({ ...settings, watermarkText: e.target.value })}
                placeholder="Watermark text"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#009ab6] focus:ring-4 focus:ring-[#009ab6]/10 transition-all text-gray-900"
              />
            )}
          </SettingField>
        </SettingSection>

        {/* Notifications */}
        <SettingSection icon={Bell} title="Notifications">
          <SettingField label="Enable Notifications" description="Receive email notifications for important events">
            <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors mb-4">
              <input
                type="checkbox"
                checked={settings.enableNotifications}
                onChange={(e) => setSettings({ ...settings, enableNotifications: e.target.checked })}
                className="w-5 h-5 text-[#009ab6] border-gray-300 rounded focus:ring-[#009ab6] focus:ring-2"
              />
              <span className="font-semibold text-gray-700">Enable email notifications</span>
            </label>
          </SettingField>
          {settings.enableNotifications && (
            <SettingField label="Notification Email" description="Email address to receive notifications">
              <input
                type="email"
                value={settings.notificationEmail}
                onChange={(e) => setSettings({ ...settings, notificationEmail: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#009ab6] focus:ring-4 focus:ring-[#009ab6]/10 transition-all text-gray-900"
              />
            </SettingField>
          )}
        </SettingSection>

        {/* Analytics */}
        <SettingSection icon={Palette} title="Analytics & Tracking">
          <SettingField label="Enable Analytics" description="Track user behavior and performance metrics">
            <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={settings.enableAnalytics}
                onChange={(e) => setSettings({ ...settings, enableAnalytics: e.target.checked })}
                className="w-5 h-5 text-[#009ab6] border-gray-300 rounded focus:ring-[#009ab6] focus:ring-2"
              />
              <span className="font-semibold text-gray-700">Enable analytics tracking</span>
            </label>
          </SettingField>
        </SettingSection>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end pt-4"
        >
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-gradient-to-r from-[#009ab6] to-[#007a8a] hover:from-[#007a8a] hover:to-[#006d7a] text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-[#009ab6]/20 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={20} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </motion.div>
      </div>
    </div>
  );
}

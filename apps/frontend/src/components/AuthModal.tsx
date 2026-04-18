'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, X, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SITE_NAME } from '@/lib/seo/site-config';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'signin' }: AuthModalProps) {
  const router = useRouter();
  const { login, register } = useAuth();
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsSignUp(initialMode === 'signup');
      setError('');
      setShowPassword(false);
    }
  }, [isOpen, initialMode]);

  // Close modal on ESC key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setError('');
        setSignInData({ email: '', password: '' });
        setSignUpData({ fullName: '', email: '', password: '' });
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Form states
  const [signInData, setSignInData] = useState({
    email: '',
    password: '',
  });

  const [signUpData, setSignUpData] = useState({
    fullName: '',
    email: '',
    password: '',
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(signInData.email, signInData.password);
      onClose();
      router.refresh();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(signUpData.email, signUpData.password, signUpData.fullName);
      onClose();
      router.refresh();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setSignInData({ email: '', password: '' });
    setSignUpData({ fullName: '', email: '', password: '' });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[40] cursor-pointer"
            style={{ pointerEvents: 'auto' }}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[50] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-4xl min-h-[600px] bg-white rounded-3xl shadow-2xl overflow-hidden flex border border-purple-200/50 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
                className="absolute top-4 right-4 z-[60] p-2 rounded-full bg-white/90 hover:bg-white border border-gray-200 hover:border-gray-300 transition-colors text-black/70 hover:text-black shadow-lg cursor-pointer"
                aria-label="Close modal"
                type="button"
              >
                <X size={20} />
              </button>

              {/* Left Panel - Red Gradient (1/3) */}
              <div className="w-1/3 relative overflow-hidden min-h-[600px]">
                {/* Gradient Background */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `
                      radial-gradient(circle at 20% 30%, rgba(0, 154, 182, 0.8) 0%, transparent 50%),
                      radial-gradient(circle at 80% 70%, rgba(0, 109, 122, 0.9) 0%, transparent 50%),
                      linear-gradient(135deg, rgba(0, 154, 182, 0.95) 0%, rgba(0, 109, 122, 0.85) 50%, rgba(0, 154, 182, 0.9) 100%)
                    `,
                  }}
                />
                
                {/* Blur Overlay */}
                <div className="absolute inset-0 backdrop-blur-sm bg-[#009ab6]/20" />

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col p-6">
                  {/* Logo - Top Left */}
                  <div className="flex items-center gap-2 mt-2">
                    <Flag size={28} className="text-white" />
                    <span className="text-white font-black text-lg">{SITE_NAME}</span>
                  </div>

                  {/* Promotional Text - Bottom Left */}
                  <div className="absolute bottom-6 left-6 text-white">
                    <p className="text-xs text-white/80 mb-3">You can easily</p>
                    <h2 className="text-base md:text-lg font-bold leading-tight text-white">
                      Get access to your personal hub for high-quality flags and unlimited downloads
                    </h2>
                  </div>
                </div>
              </div>

              {/* Right Panel - White (2/3) */}
              <div className="flex-1 bg-white flex flex-col justify-center px-8 py-8 min-h-[600px]">
                <div className="w-full max-w-md mx-auto">
                  {/* Heading */}
                  <h1 className="text-4xl font-black text-black mb-3">
                    {isSignUp ? 'Create an account' : 'Sign in'}
                  </h1>
                  
                  {/* Description */}
                  <p className="text-sm text-black/60 mb-8">
                    {isSignUp
                      ? 'Access thousands of high-quality flags, download unlimited assets, and keep everything organized in one place.'
                      : 'Access your flags, downloads, and projects anytime, anywhere - and keep everything flowing in one place.'}
                  </p>

                  {/* Social Login Buttons */}
                  <div className="flex gap-2 mb-4">
                    {[
                      { label: 'G', name: 'Google' },
                      { label: 'f', name: 'Facebook' },
                      { label: 'in', name: 'LinkedIn' },
                    ].map((social, idx) => (
                      <motion.button
                        key={idx}
                        type="button"
                        className="flex-1 h-10 bg-[#006d7a]/5 border border-[#006d7a]/10 rounded-lg flex items-center justify-center text-black/70 hover:bg-[#006d7a]/10 transition-colors font-semibold text-xs"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        title={social.name}
                      >
                        {social.label}
                      </motion.button>
                    ))}
                  </div>

                  {/* Separator */}
                  <div className="relative mb-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#006d7a]/10"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white px-2 text-black/60">or continue with</span>
                    </div>
                  </div>

                  {/* Error Message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="w-full mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Form */}
                  <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
                    {/* Name Field (Sign Up Only) - Always render to maintain same height */}
                    <div className={isSignUp ? '' : 'opacity-0 pointer-events-none h-[60px]'}>
                      <label className="block text-xs font-medium text-black mb-1.5">Your name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black/40" size={18} />
                        <input
                          type="text"
                          value={signUpData.fullName}
                          onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                          placeholder="Enter your name"
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#006d7a]/10 rounded-lg text-sm text-black placeholder-black/40 focus:outline-none focus:border-[#009ab6] transition-colors"
                          required={isSignUp}
                          disabled={!isSignUp}
                        />
                      </div>
                    </div>

                    {/* Email Field */}
                    <div>
                      <label className="block text-xs font-medium text-black mb-1.5">Your email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black/40" size={18} />
                        <input
                          type="email"
                          value={isSignUp ? signUpData.email : signInData.email}
                          onChange={(e) =>
                            isSignUp
                              ? setSignUpData({ ...signUpData, email: e.target.value })
                              : setSignInData({ ...signInData, email: e.target.value })
                          }
                          placeholder="Enter your email"
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#006d7a]/10 rounded-lg text-sm text-black placeholder-black/40 focus:outline-none focus:border-[#009ab6] transition-colors"
                          required
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    {/* Password Field */}
                    <div>
                      <label className="block text-xs font-medium text-black mb-1.5">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black/40" size={18} />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={isSignUp ? signUpData.password : signInData.password}
                          onChange={(e) =>
                            isSignUp
                              ? setSignUpData({ ...signUpData, password: e.target.value })
                              : setSignInData({ ...signInData, password: e.target.value })
                          }
                          placeholder="Enter your password"
                          className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#006d7a]/10 rounded-lg text-sm text-black placeholder-black/40 focus:outline-none focus:border-[#009ab6] transition-colors"
                          required
                          minLength={6}
                          autoComplete={isSignUp ? 'new-password' : 'current-password'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black/40 hover:text-black/60 transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Forgot Password (Sign In Only) - Always render to maintain same height */}
                    <div className={`flex justify-end ${isSignUp ? 'opacity-0 pointer-events-none h-[20px]' : ''}`}>
                      <button
                        type="button"
                        className="text-xs text-black/60 hover:text-[#009ab6] transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>

                    {/* Submit Button */}
                    <motion.button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-[#009ab6] to-[#007a8a] hover:from-[#007a8a] hover:to-[#006d7a] text-white font-bold py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-sm"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {loading ? (isSignUp ? 'Creating Account...' : 'Signing In...') : isSignUp ? 'Get Started' : 'Sign In'}
                    </motion.button>
                  </form>

                  {/* Toggle Link */}
                  <p className="mt-4 text-center text-xs text-black/60">
                    {isSignUp ? "Don't have an account? " : 'Already have an account? '}
                    <button
                      onClick={() => {
                        setIsSignUp(!isSignUp);
                        setError('');
                      }}
                      className="text-[#009ab6] hover:text-[#007a8a] font-semibold transition-colors"
                    >
                      {isSignUp ? 'Sign in' : 'Sign up'}
                    </button>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

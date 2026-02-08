'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
      const redirect = searchParams.get('redirect') || '/';
      router.push(redirect);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
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
      const redirect = searchParams.get('redirect') || '/';
      router.push(redirect);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-6xl min-h-[700px] bg-white rounded-3xl shadow-2xl overflow-hidden flex border border-purple-200/50">
      {/* Left Panel - Red Gradient (1/3) */}
      <div className="w-1/3 relative overflow-hidden">
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
        <div className="relative z-10 h-full flex flex-col justify-between p-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Flag size={32} className="text-white" />
            <span className="text-white font-black text-xl">FlagStock</span>
          </div>

          {/* Promotional Text */}
          <div className="text-white">
            <p className="text-sm text-white/80 mb-4">You can easily</p>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              Get access to your personal hub for high-quality flags and unlimited downloads
            </h2>
          </div>
        </div>
      </div>

      {/* Right Panel - White (2/3) */}
      <div className="flex-1 bg-white flex flex-col justify-center px-12 py-12">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <Flag size={28} className="text-[#009ab6]" />
            <span className="text-black font-black text-xl">FlagStock</span>
          </div>

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
          <div className="flex gap-3 mb-6">
            {[
              { label: 'G', name: 'Google' },
              { label: 'f', name: 'Facebook' },
              { label: 'in', name: 'LinkedIn' },
            ].map((social, idx) => (
              <motion.button
                key={idx}
                type="button"
                className="flex-1 h-12 bg-black/5 border border-black/10 rounded-lg flex items-center justify-center text-black/70 hover:bg-black/10 transition-colors font-semibold text-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                title={social.name}
              >
                {social.label}
              </motion.button>
            ))}
          </div>

          {/* Separator */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-black/10"></div>
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
          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-5">
            {/* Name Field (Sign Up Only) */}
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-black mb-2">Your name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-black/40" size={20} />
                  <input
                    type="text"
                    value={signUpData.fullName}
                    onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                    placeholder="Enter your name"
                    className="w-full pl-12 pr-4 py-3 bg-white border border-black/10 rounded-lg text-black placeholder-black/40 focus:outline-none focus:border-[#009ab6] transition-colors"
                    required
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">Your email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-black/40" size={20} />
                <input
                  type="email"
                  value={isSignUp ? signUpData.email : signInData.email}
                  onChange={(e) =>
                    isSignUp
                      ? setSignUpData({ ...signUpData, email: e.target.value })
                      : setSignInData({ ...signInData, email: e.target.value })
                  }
                  placeholder="Enter your email"
                  className="w-full pl-12 pr-4 py-3 bg-white border border-black/10 rounded-lg text-black placeholder-black/40 focus:outline-none focus:border-[#009ab6] transition-colors"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-black/40" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={isSignUp ? signUpData.password : signInData.password}
                  onChange={(e) =>
                    isSignUp
                      ? setSignUpData({ ...signUpData, password: e.target.value })
                      : setSignInData({ ...signInData, password: e.target.value })
                  }
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3 bg-white border border-black/10 rounded-lg text-black placeholder-black/40 focus:outline-none focus:border-[#009ab6] transition-colors"
                  required
                  minLength={6}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-black/40 hover:text-black/60 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Forgot Password (Sign In Only) */}
            {!isSignUp && (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm text-black/60 hover:text-[#009ab6] transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#009ab6] to-[#007a8a] hover:from-[#007a8a] hover:to-[#006d7a] text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (isSignUp ? 'Creating Account...' : 'Signing In...') : isSignUp ? 'Get Started' : 'Sign In'}
            </motion.button>
          </form>

          {/* Toggle Link */}
          <p className="mt-6 text-center text-sm text-black/60">
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
    </div>
  );
}

export default function AuthAnimated() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black/5 px-4 py-8">
      <Suspense
        fallback={
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#009ab6] mx-auto"></div>
          </div>
        }
      >
        <AuthForm />
      </Suspense>
    </div>
  );
}

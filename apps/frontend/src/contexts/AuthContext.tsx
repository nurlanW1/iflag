'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: 'user' | 'admin';
  email_verified: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function syncTokensToStorage(accessToken: string, refreshToken: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

function clearTokenStorage() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const sessionRes = await fetch('/api/auth/session', {
          credentials: 'include',
        });
        if (sessionRes.ok) {
          const data = (await sessionRes.json()) as { user: User };
          setUser(data.user);
          return;
        }

        const token = localStorage.getItem('accessToken');
        if (token) {
          try {
            const userData = await api.getCurrentUser();
            setUser(userData);
          } catch {
            clearTokenStorage();
          }
        }
      } catch {
        clearTokenStorage();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/sign-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      user?: User;
      accessToken?: string;
      refreshToken?: string;
    };
    if (!res.ok) {
      throw new Error(data.error || 'Sign in failed');
    }
    if (!data.user || !data.accessToken || !data.refreshToken) {
      throw new Error('Invalid response from authentication service');
    }
    syncTokensToStorage(data.accessToken, data.refreshToken);
    setUser(data.user);
  };

  const register = async (email: string, password: string, fullName?: string) => {
    const res = await fetch('/api/auth/sign-up', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email,
        password,
        full_name: fullName,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      user?: User;
      accessToken?: string;
      refreshToken?: string;
    };
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    if (!data.user || !data.accessToken || !data.refreshToken) {
      throw new Error(
        data.error ||
          'Account may have been created. Please sign in with your email and password.'
      );
    }
    syncTokensToStorage(data.accessToken, data.refreshToken);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/sign-out', { method: 'POST', credentials: 'include' });
    } catch {
      /* still clear client */
    }
    clearTokenStorage();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const sessionRes = await fetch('/api/auth/session', { credentials: 'include' });
      if (!sessionRes.ok) {
        setUser(null);
        return;
      }
      const data = (await sessionRes.json()) as { user: User };
      setUser(data.user);
    } catch {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

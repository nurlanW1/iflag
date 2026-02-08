'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Upload, 
  Package, 
  Users, 
  BarChart3, 
  Settings,
  LogOut,
  Flag,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#009ab6]"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200/80 shadow-sm sticky top-0 h-screen overflow-y-auto">
        <div className="p-6">
          {/* Logo & Header */}
          <div className="mb-8 pb-6 border-b border-gray-200/80">
            <Link href="/admin" className="flex items-center gap-3 mb-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#009ab6] to-[#006d7a] flex items-center justify-center shadow-lg shadow-[#009ab6]/20 group-hover:shadow-xl group-hover:shadow-[#009ab6]/30 transition-all">
                <Flag size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Admin Panel</h2>
                <p className="text-xs text-gray-500">{user?.email || 'Development Mode'}</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-1.5">
            <AdminNavLink href="/admin" icon={LayoutDashboard} active={pathname === '/admin'}>
              Dashboard
            </AdminNavLink>
            <AdminNavLink href="/admin/countries" icon={Flag} active={pathname?.startsWith('/admin/countries')}>
              Countries
            </AdminNavLink>
            <AdminNavLink href="/admin/upload" icon={Upload} active={pathname === '/admin/upload'}>
              Upload Assets
            </AdminNavLink>
            <AdminNavLink href="/admin/assets" icon={Package} active={pathname?.startsWith('/admin/assets')}>
              Manage Assets
            </AdminNavLink>
            <AdminNavLink href="/admin/subscriptions" icon={Users} active={pathname === '/admin/subscriptions'}>
              Subscriptions
            </AdminNavLink>
            <AdminNavLink href="/admin/analytics" icon={BarChart3} active={pathname === '/admin/analytics'}>
              Analytics
            </AdminNavLink>
            <AdminNavLink href="/admin/settings" icon={Settings} active={pathname === '/admin/settings'}>
              Settings
            </AdminNavLink>
            
            {user && (
              <div className="mt-6 pt-6 border-t border-gray-200/80">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 bg-red-50/50 hover:bg-red-50 rounded-xl text-sm font-medium transition-all duration-200 group"
                >
                  <LogOut size={18} className="group-hover:scale-110 transition-transform" />
                  Logout
                </button>
              </div>
            )}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function AdminNavLink({ href, icon: Icon, children, active }: { 
  href: string; 
  icon: any; 
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.98 }}
        className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
          active
            ? 'bg-gradient-to-r from-[#009ab6] to-[#007a8a] text-white shadow-lg shadow-[#009ab6]/20'
            : 'text-gray-700 hover:bg-gray-50 hover:text-[#009ab6]'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon size={18} className={active ? 'text-white' : 'text-gray-500 group-hover:text-[#009ab6]'} />
          <span>{children}</span>
        </div>
        {active && (
          <ChevronRight size={16} className="text-white/80" />
        )}
      </motion.div>
    </Link>
  );
}

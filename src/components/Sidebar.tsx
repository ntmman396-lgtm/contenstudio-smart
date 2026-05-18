'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useBatch } from '@/contexts/BatchContext';
import { useSite } from '@/contexts/SiteContext';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_META } from '@/types/auth';
import type { Role } from '@/types/auth';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  roles?: Role[]; // if undefined → visible to all roles
}

const allNavItems: NavItem[] = [
  // General Dashboard Overview
  { id: 'dashboard', label: 'Dashboard Overview', icon: '📊', href: '/', roles: ['btv', 'lead', 'superadmin', 'hdyk', 'bs'] },
  
  // Hành động chính
  { id: 'create', label: 'Tạo bài viết', icon: '📝', href: '/create', roles: ['ctv', 'btv', 'lead', 'superadmin'] },
  { id: 'batch', label: 'Batch Generator', icon: '⚡', href: '/batch', roles: ['ctv', 'btv', 'lead', 'superadmin'] },
  { id: 'templates', label: 'Templates', icon: '📋', href: '/templates', roles: ['btv', 'lead', 'superadmin'] },
  { id: 'review', label: 'Danh sách bài', icon: '📋', href: '/review' },
  
  // QC Dashboard
  { id: 'qc-dashboard', label: 'QC Dashboard', icon: '📈', href: '/qc-dashboard' }, // Bỏ roles để ai cũng vào được hoặc gộp chung
  
  // Settings
  { id: 'data', label: 'Quản lý Dữ liệu', icon: '🗄️', href: '/data', roles: ['btv', 'lead', 'superadmin'] },
  { id: 'settings', label: 'Settings', icon: '⚙️', href: '/settings', roles: ['lead', 'superadmin'] },
  { id: 'rules', label: 'Rules Engine', icon: '🛡️', href: '/settings/rules', roles: ['lead', 'superadmin'] },
  { id: 'users', label: 'Quản lý Users', icon: '👥', href: '/settings/users', roles: ['lead', 'superadmin'] },
];

function getNavItemsForRole(role?: Role): NavItem[] {
  if (!role) return allNavItems; // fallback: show all
  return allNavItems.filter(item => !item.roles || item.roles.includes(role));
}

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [kbActiveCount, setKbActiveCount] = useState(0);
  const { currentSite } = useSite();

  // Load pending review count from API (scoped to current site)
  useEffect(() => {
    const load = () => {
      // Async fetch for pending review articles
      fetch(`/api/articles?status=pending_review&siteId=${currentSite}`)
        .then(res => res.ok ? res.json() : [])
        .then(articles => setPendingCount(articles.length))
        .catch(() => setPendingCount(0));

      // Fetch kbActiveCount from our internal mock via generic global or simply reset (since it's mock)
      setKbActiveCount(0); // We'll just leave this 0 since KB is now strictly mocked in-memory and UI doesn't need to track localStorage changes.
    };

    load();
    window.addEventListener('storage', load);
    // Custom event to re-trigger
    window.addEventListener('resetReviewList', load);
    const interval = setInterval(load, 15000); // 15s instead of 5s to avoid api spam
    return () => {
      window.removeEventListener('storage', load);
      window.removeEventListener('resetReviewList', load);
      clearInterval(interval);
    };
  }, [currentSite]);

  // Listen for screen size changes
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setMobileOpen(false);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);


  const sidebarWidth = collapsed && !isMobile ? 'w-[72px]' : 'w-[260px]';

  // Mobile: hamburger button
  if (isMobile) {
    return (
      <>
        {/* Hamburger */}
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-3 left-3 z-50 w-10 h-10 rounded-xl glass-card flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
        >
          ☰
        </button>

        {/* Overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
            <aside
              className="w-[260px] h-full bg-[var(--bg-secondary)] border-r border-[var(--border-default)] animate-slide-in-left"
              onClick={(e) => e.stopPropagation()}
            >
              <SidebarContent pathname={pathname} collapsed={false} onCollapse={() => setMobileOpen(false)} isMobile pendingCount={pendingCount} kbActiveCount={kbActiveCount} />
            </aside>
          </div>
        )}
      </>
    );
  }

  return (
    <aside className={`${sidebarWidth} h-screen flex flex-col border-r border-[var(--border-default)] bg-[var(--bg-secondary)] sticky top-0 shrink-0 transition-all duration-300`}>
      <SidebarContent pathname={pathname} collapsed={collapsed} onCollapse={() => setCollapsed(!collapsed)} isMobile={false} pendingCount={pendingCount} kbActiveCount={kbActiveCount} />
    </aside>
  );
}

// ─── Sidebar Inner Content ──────────────────────────────────

function SidebarContent({
  pathname,
  collapsed,
  onCollapse,
  isMobile,
  pendingCount,
  kbActiveCount,
}: {
  pathname: string;
  collapsed: boolean;
  onCollapse: () => void;
  isMobile: boolean;
  pendingCount: number;
  kbActiveCount?: number;
}) {
  const { theme, setTheme } = useTheme();
  const { currentSite, setSite } = useSite();
  const { user } = useAuth();
  
  // Connect to Batch Context
  const { totalItems, completedItems, isGeneratingAll, planItems } = useBatch();
  const showBatchWidget = totalItems > 0 && !collapsed;

  // Filter nav items by user role
  const navItems = getNavItemsForRole(user?.role as Role | undefined);

  const siteIcon = currentSite === 'tiem-chung' ? '💉' : '💊';
  const siteName = currentSite === 'tiem-chung' ? 'Tiêm chủng' : 'Nhà thuốc';

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 pb-4 border-b border-[var(--border-default)]">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-transform duration-300 group-hover:scale-105 shrink-0"
                 style={{ background: currentSite === 'tiem-chung' ? 'linear-gradient(135deg, #7C3AED, #2563EB)' : 'linear-gradient(135deg, #0066CC, #00CC88)' }}>
              {siteIcon}
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">
                  Long Châu
                </h1>
                <p className="text-[11px] font-medium text-[var(--text-muted)] tracking-wide uppercase">
                  {siteName}
                </p>
              </div>
            )}
          </Link>
          {!isMobile && (
            <button
              onClick={onCollapse}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors text-xs"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? '▸' : '◂'}
            </button>
          )}
        </div>

        {/* Site Picker */}
        {!collapsed && (
          <div className="mt-3 flex rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)] p-0.5">
            <button
              onClick={() => setSite('nha-thuoc')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200 ${
                currentSite === 'nha-thuoc'
                  ? 'bg-[var(--lc-primary)] text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>🏥</span> Nhà thuốc
            </button>
            <button
              onClick={() => setSite('tiem-chung')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200 ${
                currentSite === 'tiem-chung'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>💉</span> Tiêm chủng
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="px-3 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">
            Workspace
          </p>
        )}
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => {
                 if (item.id === 'review' && pathname.startsWith('/review')) {
                    window.dispatchEvent(new Event('resetReviewList'));
                 }
              }}
              title={collapsed ? item.label : undefined}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-200 group relative
                ${collapsed ? 'justify-center' : ''}
                ${isActive
                  ? 'bg-[var(--lc-primary)]/10 text-[var(--text-accent)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                }
              `}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[var(--lc-primary)]" />
              )}
              <span className="text-base shrink-0">{item.icon}</span>
              {!collapsed && (
                <>
                  <span>{item.label}</span>
                  {item.id === 'review' && pendingCount > 0 && (
                    <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400">
                      {pendingCount}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
        
        {/* Knowledge Base Section */}
        {!collapsed && (
          <div className="pt-2 mt-2 border-t border-[var(--border-default)]">
            <p className="px-3 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest flex items-center justify-between">
              <span>Knowledge Base</span>
              {kbActiveCount !== undefined && kbActiveCount > 0 && (
                 <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400">
                   {kbActiveCount} active
                 </span>
              )}
            </p>
          </div>
        )}
        
        {[
          { id: 'kb-sources', label: 'Sources', icon: '📚', href: '/knowledge-base?tab=sources' },
          { id: 'kb-search', label: 'Search & Test', icon: '🔎', href: '/knowledge-base?tab=search' },
          { id: 'kb-citations', label: 'Citation Log', icon: '🧾', href: '/knowledge-base?tab=citations' }
        ].map((item) => {
           // Basic path highlight since searchParams aren't directly available without Suspense wrapper in layout
           const isActive = pathname === '/knowledge-base' && item.id === 'kb-sources'; // Fallback highlight logic 
           return (
              <Link
                key={item.id}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium
                  transition-all duration-200 group relative
                  ${collapsed ? 'justify-center' : ''}
                  ${isActive
                    ? 'bg-[var(--lc-primary)]/10 text-[var(--text-accent)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                  }
                `}
              >
                <span className="text-base shrink-0 opacity-80">{item.icon}</span>
                {!collapsed && (
                  <span className="text-[13px]">{item.label}</span>
                )}
              </Link>
           );
        })}
        
        {/* Global Batch Progress Widget */}
        {showBatchWidget && (
          <div className="mt-4 px-3 py-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] group relative hover:border-blue-500/50 transition-colors">
            <Link href="/batch" className="block text-inherit no-underline">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Batch Progress</span>
                <span className="text-[10px] font-mono font-medium text-blue-400">{completedItems}/{totalItems}</span>
              </div>
              <div className="w-full bg-[var(--bg-card-hover)] h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${isGeneratingAll ? 'bg-blue-500' : 'bg-emerald-500'}`}
                  style={{ width: `${totalItems > 0 ? (completedItems / totalItems) * 100 : 0}%` }}
                />
              </div>
            </Link>
            
            {/* Tooltip/Popup on hover */}
            <div className="absolute left-full ml-3 bottom-0 w-64 p-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <h4 className="text-xs font-bold text-[var(--text-primary)] mb-2 border-b border-[var(--border-default)] pb-2 flex justify-between">
                <span>Trạng thái tự động sinh</span>
                {isGeneratingAll && <span className="text-[10px] text-blue-400 animate-pulse">Running...</span>}
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {planItems.slice().reverse().slice(0, 5).map(item => (
                  <div key={item.id} className="flex items-start gap-2 text-[11px]">
                    <span className="mt-0.5 shrink-0">
                      {item.status === 'completed' ? '✅' : item.status === 'failed' ? '❌' : item.status === 'generating' ? '⏳' : '⌛'}
                    </span>
                    <span className={`line-clamp-2 ${item.status === 'failed' ? 'text-red-400' : 'text-[var(--text-secondary)]'}`}>
                      {item.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Bottom section */}
      <div className={`p-4 border-t border-[var(--border-default)] ${collapsed ? 'px-2' : ''}`}>
        {!collapsed && (
          <div className="glass-card p-3 rounded-xl mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-emerald-400">AI Online</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              Gemini gemini-3.1-pro-preview — Ready
            </p>
          </div>
        )}
        <UserSection collapsed={collapsed} />
      </div>
    </div>
  );
}

// ─── User Section with Auth ──────────────────────────────────

function UserSection({ collapsed }: { collapsed: boolean }) {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  const roleMeta = user ? ROLE_META[user.role as Role] : null;
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'LC';

  return (
    <div className="space-y-3">
      <div className={`flex items-center ${collapsed ? 'flex-col gap-2' : 'gap-3'}`}>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
          {initials}
        </div>
        {!collapsed && user && (
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{user.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {roleMeta && (
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ${roleMeta.color}`}>
                  {roleMeta.label}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
      <div className={`flex items-center ${collapsed ? 'flex-col gap-2' : 'gap-1'}`}>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors shrink-0"
          title="Toggle Theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        {user && (
          <button
            onClick={logout}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
            title="Đăng xuất"
          >
            🚪
          </button>
        )}
        {!collapsed && user && (
          <span className="text-[10px] text-[var(--text-muted)] ml-auto truncate">{user.email}</span>
        )}
      </div>
    </div>
  );
}

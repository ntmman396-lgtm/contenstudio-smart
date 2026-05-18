'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { getGeneratedArticles } from '@/lib/storage';
import { GeneratedArticle } from '@/types';
import { buildScoreExplanation } from '@/lib/qc/qc-explain';
import { useSite } from '@/contexts/SiteContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar, Legend
} from 'recharts';
import AutoAssignPreviewModal from '@/components/review/AutoAssignPreviewModal';

const statusColors: Record<string, string> = {
  approved: 'bg-emerald-500/15 text-emerald-400',
  pending_review: 'bg-amber-500/15 text-amber-400',
  rejected: 'bg-red-500/15 text-red-400',
  // for backwards compatibility if needed
  completed: 'bg-emerald-500/15 text-emerald-400',
  review: 'bg-amber-500/15 text-amber-400',
  generating: 'bg-blue-500/15 text-blue-400',
  queued: 'bg-slate-500/15 text-slate-400',
  failed: 'bg-red-500/15 text-red-400',
};

const statusLabels: Record<string, string> = {
  approved: 'Approved',
  pending_review: 'Reviewing',
  rejected: 'Rejected',
  ready_for_review: 'Ready Review',
  needs_improvement: 'Cần cải thiện',
  rework_required: 'Cần viết lại',
  completed: 'Completed',
  review: 'Review',
  generating: 'Generating',
  queued: 'Queued',
  failed: 'Failed'
};

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [articles, setArticles] = useState<GeneratedArticle[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const { currentSite } = useSite();
  const { user } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userStats, setUserStats] = useState<any[]>([]);

  useEffect(() => {
    getGeneratedArticles(currentSite).then(data => {
      setArticles(data);
      setIsMounted(true);
    });
  }, [currentSite]);

  // Fetch load balancing stats
  useEffect(() => {
    if (!user) return;
    const isHDYK = ['hdyk', 'lead', 'superadmin'].includes(user.role);
    const isBTV = ['btv', 'lead', 'superadmin'].includes(user.role);

    if (isHDYK || isBTV) {
      // const fetchRole = isHDYK ? 'bs' : 'ctv'; // Lead sees BS primarily, or fetch both? Let's just fetch all explicitly.
      fetch('/api/users/stats').then(res => res.json()).then(data => {
        if (data.users) setUserStats(data.users);
      }).catch(err => console.error(err));
    }
  }, [user]);

  // Auto-Assign from Dashboard state
  const [showDashboardAutoAssign, setShowDashboardAutoAssign] = useState(false);
  const [pendingAssignArticleIds, setPendingAssignArticleIds] = useState<string[]>([]);

  // ─── Data Aggregation ────────────────────────────────────────────────────────

  const { articlesPerDay, articlesByStatus, articlesByCategory } = useMemo(() => {
    // 1. Articles per Day
    const countByDate: Record<string, number> = {};
    articles.forEach(a => {
       const d = new Date(a.createdAt || Date.now());
       // YYYY-MM-DD for correct sorting
       const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
       countByDate[dateKey] = (countByDate[dateKey] || 0) + 1;
    });
    
    const articlesPerDay = Object.keys(countByDate).sort().map(date => {
       const [, m, d] = date.split('-');
       return {
         date: `${d}/${m}`,
         count: countByDate[date]
       };
    });

    // 2. Articles by Status
    const approved = articles.filter(a => a.status === 'approved').length;
    const pending = articles.filter(a => a.status === 'pending_review').length;
    const rejected = articles.filter(a => a.status === 'rejected').length;
    
    const articlesByStatus = [
      { name: 'Approved', value: approved, color: '#10b981' }, 
      { name: 'Pending Review', value: pending, color: '#f59e0b' }, 
      { name: 'Rejected', value: rejected, color: '#ef4444' }
    ].filter(i => i.value > 0);

    // 3. Articles by Category (Template Name)
    const catCount: Record<string, number> = {};
    articles.forEach(a => {
       const cat = a.templateName || 'Khác';
       catCount[cat] = (catCount[cat] || 0) + 1;
    });
    const articlesByCategory = Object.keys(catCount).map(name => ({
      name, count: catCount[name]
    })).sort((a, b) => b.count - a.count).slice(0, 5); // top 5

    return { articlesPerDay, articlesByStatus, articlesByCategory };
  }, [articles]);

  const isHdyk = user && ['hdyk', 'lead', 'superadmin'].includes(user.role);
  const isBs = user && user.role === 'bs';

  const isToday = (dateString?: string) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  };

  const hdykMetrics = useMemo(() => {
    if (!isHdyk) return null;
    const pendingAssign = articles.filter(a => (a as unknown as { workflowStatus?: string }).workflowStatus === 'pending_bs_review').length;
    const alreadyAssigned = articles.filter(a => (a as unknown as { assignedBsId?: string }).assignedBsId && (a as unknown as { workflowStatus?: string }).workflowStatus !== 'pending_bs_review').length;
    const completedByBs = articles.filter(a => (a as unknown as { assignedBsId?: string }).assignedBsId && ['ready_for_review', 'approved', 'published'].includes((a as unknown as { workflowStatus?: string }).workflowStatus || '')).length;
    const receivedToday = articles.filter(a => isToday(a.createdAt)).length;

    return [
      { label: 'Cần Phân Bổ', value: pendingAssign, icon: '📦', bg: 'bg-amber-500/15', text: 'text-amber-400' },
      { label: 'Đã Phân Bổ', value: alreadyAssigned, icon: '🔄', bg: 'bg-blue-500/15', text: 'text-blue-400' },
      { label: 'Đã Hoàn Thành', value: completedByBs, icon: '✅', bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
      { label: 'Bài Mới Hôm Nay', value: receivedToday, icon: '📥', bg: 'bg-indigo-500/15', text: 'text-indigo-400' },
    ];
  }, [articles, isHdyk]);

  // Alert: Bài tồn đọng — chưa assign hoặc quá 1 tuần chưa duyệt
  const alertArticles = useMemo(() => {
    const now = Date.now();
    const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

    const unassigned = articles.filter(a => {
      const ws = (a as any).workflowStatus;
      return a.status === 'approved' &&
        ws === 'pending_bs_review' &&
        !(a as any).assignedBsId;
    });

    const staleArticles = articles.filter(a => {
      const age = now - new Date(a.createdAt || 0).getTime();
      const ws = (a as any).workflowStatus;
      return age > ONE_WEEK &&
        ['pending_bs_review', 'under_review'].includes(ws || '');
    });

    return { unassigned, staleArticles };
  }, [articles]);

  // Handler: Open auto-assign from dashboard
  const handleDashboardAutoAssign = () => {
    const pendingIds = articles
      .filter(a => a.status === 'approved' && (a as any).workflowStatus === 'pending_bs_review')
      .map(a => a.id);
    if (pendingIds.length === 0) {
      alert('Không có bài viết nào cần phân bổ.');
      return;
    }
    setPendingAssignArticleIds(pendingIds);
    setShowDashboardAutoAssign(true);
  };

  const handleDashboardAutoAssignConfirm = async (assignments: { articleId: string; bsId: string }[]) => {
    try {
      const res = await fetch('/api/articles/batch-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Lỗi: ${data.error}`);
        return;
      }
      alert(`✅ ${data.message}`);
      setShowDashboardAutoAssign(false);
      // Refresh articles
      const fresh = await getGeneratedArticles(currentSite);
      setArticles(fresh);
    } catch {
      alert('Lỗi submit auto-assign');
    }
  };

  const bsMetrics = useMemo(() => {
    if (!isBs || !user) return null;
    const myArticles = articles.filter(a => (a as unknown as { assignedBsId?: string }).assignedBsId === user.id);
    const assignedToday = myArticles.filter(a => isToday(a.updatedAt || a.createdAt)).length;
    
    // Đã xong: Đã duyệt hoặc chờ duyêt (nộp bưu điện)
    const completedCount = myArticles.filter(a => ['ready_for_review', 'approved', 'published'].includes((a as unknown as { workflowStatus?: string }).workflowStatus || '')).length;
    
    // Tất cả bài đang giữ
    const activeArticles = myArticles.filter(a => ['under_review', 'needs_revision'].includes((a as unknown as { workflowStatus?: string }).workflowStatus || ''));
    
    // Chưa thực hiện là các bài bị BTV từ chối yêu cầu sửa -> needs_revision
    // Trong trường hợp bác sĩ vừa nhận -> cũng vào đây nếu updatedAt == createdAt (nhưng do k rõ lưu nên sẽ show tổng active)
    const inProgressCount = activeArticles.filter(a => (a as unknown as { workflowStatus?: string }).workflowStatus === 'under_review').length;
    const needsRevisionCount = activeArticles.filter(a => (a as unknown as { workflowStatus?: string }).workflowStatus === 'needs_revision').length;
    
    return [
      { label: 'Giao Mới Nhận', value: assignedToday, icon: '🆕', bg: 'bg-indigo-500/15', text: 'text-indigo-400' },
      { label: 'Đang Thực Hiện', value: inProgressCount, icon: '✍️', bg: 'bg-blue-500/15', text: 'text-blue-400' },
      { label: 'Đã Hoàn Thành', value: completedCount, icon: '✅', bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
      { label: 'Còn Tồn Đọng (Sửa Lỗi)', value: needsRevisionCount, icon: '⚠️', bg: 'bg-orange-500/15', text: 'text-orange-400' },
    ];
  }, [articles, isBs, user]);

  const metrics = [
    {
      label: 'Tổng số Bài',
      value: articles.length,
      icon: '📝',
      bg: 'bg-blue-500/15',
      text: 'text-blue-400',
    },
    {
      label: 'Chờ Duyệt (Pending)',
      value: articles.filter(a => a.status === 'pending_review').length,
      icon: '⏳',
      bg: 'bg-amber-500/15',
      text: 'text-amber-400',
    },
    {
      label: 'Đã Duyệt (Approved)',
      value: articles.filter(a => a.status === 'approved').length,
      icon: '✅',
      bg: 'bg-emerald-500/15',
      text: 'text-emerald-400',
    },
    {
      label: 'Từ chối (Rejected)',
      value: articles.filter(a => a.status === 'rejected').length,
      icon: '❌',
      bg: 'bg-red-500/15',
      text: 'text-red-400',
    },
    {
      label: 'Safety Alerts',
      value: articles.filter(a => a.qcDecision === 'REJECT' || a.qcRiskLevel === 'CRITICAL' || a.qcRiskLevel === 'HIGH').length,
      icon: '🛡️',
      bg: 'bg-orange-500/15',
      text: 'text-orange-400',
    },
  ];

  const filteredArticles = articles.filter(a => {
    if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterStatus && a.status !== filterStatus) return false;
    if (filterDate) {
      const dateKey = filterDate; // YYYY-MM-DD
      const d = new Date(a.createdAt || 0);
      const aDateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (aDateKey !== dateKey) return false;
    }
    return true;
  }).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  // Prevent hydration mismatch with recharts by waiting to render charts
  if (!isMounted) return <div className="flex h-screen bg-[var(--bg-primary)]"><Sidebar /></div>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-xl">
          <p className="text-xs text-[var(--text-muted)] mb-1">{label}</p>
          <p className="text-sm font-bold text-[var(--text-primary)]">
            {payload[0].value} bài viết
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto custom-scrollbar">
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          {/* Header */}
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                Dashboard Overview
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                Báo cáo tổng quan hoạt động tạo Content bằng AI dựa trên dữ liệu thực tế.
              </p>
            </div>
            
            {/* Quick Actions (moved to top right) */}
            <div className="flex gap-3">
              <Link href="/batch" className="btn-secondary !bg-[var(--bg-card-hover)] hover:!bg-[var(--lc-primary)]/10 text-xs px-4 flex items-center gap-2">
                <span>⚡</span> Tạo Batch Mới
              </Link>
              <Link href="/create" className="btn-secondary !bg-[var(--bg-card-hover)] hover:!bg-[var(--lc-primary)]/10 text-xs px-4 flex items-center gap-2">
                <span>📝</span> Viết Đơn
              </Link>
            </div>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {metrics.map((m) => (
              <div key={m.label} className="glass-card p-5 rounded-xl hover:bg-[var(--bg-card-hover)] transition-colors duration-200 group relative overflow-hidden">
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <div className={`w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center text-lg group-hover:scale-110 transition-transform duration-200`}>
                    {m.icon}
                  </div>
                </div>
                <p className={`text-4xl font-bold ${m.text} mb-1 relative z-10`}>{m.value}</p>
                <p className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider relative z-10">{m.label}</p>
                <div className={`absolute -bottom-6 -right-6 w-24 h-24 ${m.bg} rounded-full blur-2xl opacity-40 group-hover:opacity-70 transition-opacity duration-500`} />
              </div>
            ))}
          </div>

          {/* Role-Specific Metric cards: HĐYK */}
          {hdykMetrics && (
            <div className="mb-6">
              <h2 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 mb-3 flex items-center gap-2">
                📋 Trạng thái Tiến độ Hội Đồng Y Khoa
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {hdykMetrics.map((m) => (
                  <div key={m.label} className="glass-card p-4 rounded-xl border border-[var(--border-default)] flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full ${m.bg} flex items-center justify-center text-xl shrink-0`}>
                      {m.icon}
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${m.text}`}>{m.value}</p>
                      <p className="text-xs text-[var(--text-muted)] font-medium">{m.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Smart-Assign Card — 1-click phân bổ */}
              {hdykMetrics[0].value > 0 && (
                <div className="mt-4 glass-card p-4 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-orange-500/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                      🤖
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--text-primary)]">
                        {hdykMetrics[0].value} bài viết đang chờ phân bổ
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        Hệ thống đã chuẩn bị gợi ý BS theo chuyên khoa &amp; tải. Bấm để xác nhận.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleDashboardAutoAssign}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] flex items-center gap-2"
                  >
                    🤖 Auto-Assign Ngay
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ⚠️ Alert Box — Bài tồn đọng */}
          {isHdyk && (alertArticles.unassigned.length > 0 || alertArticles.staleArticles.length > 0) && (
            <div className="mb-6 glass-card p-4 rounded-xl border-2 border-red-500/40 bg-red-500/5 animate-pulse-slow relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5 pointer-events-none" />
              <div className="relative z-10">
                <h3 className="text-sm font-bold text-red-400 flex items-center gap-2 mb-3">
                  🚨 Cảnh Báo Tồn Đọng
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {alertArticles.unassigned.length > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-[var(--bg-surface)] rounded-lg border border-red-500/20">
                      <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center text-lg shrink-0">📦</div>
                      <div>
                        <p className="text-sm font-bold text-red-400">{alertArticles.unassigned.length} bài chưa assign BS</p>
                        <p className="text-[10px] text-[var(--text-muted)]">Bài đã đạt chuẩn QC nhưng chưa được phân bổ cho bác sĩ duyệt</p>
                      </div>
                      <Link href="/review" className="ml-auto px-3 py-1 text-[10px] font-bold rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 shrink-0">
                        Xem →
                      </Link>
                    </div>
                  )}
                  {alertArticles.staleArticles.length > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-[var(--bg-surface)] rounded-lg border border-orange-500/20">
                      <div className="w-10 h-10 rounded-full bg-orange-500/15 flex items-center justify-center text-lg shrink-0">⏰</div>
                      <div>
                        <p className="text-sm font-bold text-orange-400">{alertArticles.staleArticles.length} bài tồn quá 1 tuần</p>
                        <p className="text-[10px] text-[var(--text-muted)]">Đã tạo hơn 7 ngày mà chưa được duyệt xong</p>
                      </div>
                      <Link href="/review" className="ml-auto px-3 py-1 text-[10px] font-bold rounded bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 shrink-0">
                        Xem →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Role-Specific Metric cards: Bác Sĩ */}
          {bsMetrics && (
            <div className="mb-6">
              <h2 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400 mb-3 flex items-center gap-2">
                🩺 Tiến độ Kiểm duyệt Bác sĩ
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {bsMetrics.map((m) => (
                  <div key={m.label} className="glass-card p-4 rounded-xl border border-[var(--border-default)] flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full ${m.bg} flex items-center justify-center text-xl shrink-0`}>
                      {m.icon}
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${m.text}`}>{m.value}</p>
                      <p className="text-xs text-[var(--text-muted)] font-medium">{m.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Area Chart - Trend */}
            <div className="lg:col-span-2 glass-card p-5 rounded-xl border border-[var(--border-default)]">
              <div className="mb-4">
                <h3 className="font-bold text-[var(--text-primary)] text-sm">Sản lượng Bài viết theo thời gian</h3>
                <p className="text-[10px] text-[var(--text-muted)]">Số lượng bài khởi tạo bởi AI gom theo ngày</p>
              </div>
              <div className="h-[260px] w-full">
                {articlesPerDay.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={articlesPerDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0066cc" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#0066cc" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-strong)" vertical={false} />
                      <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickMargin={10} axisLine={false} tickLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={11} axisLine={false} tickLine={false} allowDecimals={false} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="count" stroke="#0066cc" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" activeDot={{ r: 6, fill: '#0066cc', stroke: '#fff', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm text-[var(--text-muted)]">
                    Chưa có đủ dữ liệu để vẽ biểu đồ
                  </div>
                )}
              </div>
            </div>

            {/* Pie Chart - Status */}
            <div className="glass-card p-5 rounded-xl border border-[var(--border-default)] flex flex-col">
              <div className="mb-2">
                <h3 className="font-bold text-[var(--text-primary)] text-sm">Tỉ lệ Kiểm duyệt</h3>
                <p className="text-[10px] text-[var(--text-muted)]">Phân bổ trạng thái bài viết</p>
              </div>
              <div className="flex-1 min-h-[220px]">
                {articlesByStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={articlesByStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {articlesByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: 'var(--text-secondary)' }}/>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm text-[var(--text-muted)]">
                    Chưa có trạng thái nào hợp lệ
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Category Bar Chart / List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-1 glass-card p-5 rounded-xl border border-[var(--border-default)]">
               <div className="mb-4">
                <h3 className="font-bold text-[var(--text-primary)] text-sm">Phân bổ theo Thể loại</h3>
                <p className="text-[10px] text-[var(--text-muted)]">Top Template được dùng nhiều nhất</p>
              </div>
              <div className="h-[220px]">
                {articlesByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={articlesByCategory} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-strong)" horizontal={true} vertical={false} />
                      <XAxis type="number" stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} allowDecimals={false}/>
                      <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={11} width={80} axisLine={false} tickLine={false} />
                      <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }}/>
                      <Bar dataKey="count" fill="#00cc88" radius={[0, 4, 4, 0]} barSize={20}>
                        {articlesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#00cc88' : '#0066cc'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm text-[var(--text-muted)]">
                    Chưa có chủ đề nào được tạo
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Table (Taking remaining 2 cols) */}
            <div className="lg:col-span-2 glass-card rounded-xl overflow-hidden border border-[var(--border-default)] flex flex-col h-full">
              <div className="px-5 py-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--bg-card-hover)]">
                <div>
                  <h2 className="text-sm font-bold text-[var(--text-primary)]">Bài viết Tạo gần đây</h2>
                  <p className="text-[10px] text-[var(--text-muted)]">Lấy từ Local Storage ({filteredArticles.length} bài)</p>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder="Tìm tiêu đề..." 
                    className="input-field py-1 text-xs w-32 h-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <input
                    type="date"
                    className="input-field py-1 text-xs w-32 h-8 cursor-pointer"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                  />
                  <select 
                    className="input-field py-1 text-xs w-28 h-8 appearance-none cursor-pointer"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="">Tất cả</option>
                    <option value="approved">Approved</option>
                    <option value="pending_review">Pending</option>
                    <option value="ready_for_review">Ready Review</option>
                    <option value="needs_improvement">Cần cải thiện</option>
                    <option value="rework_required">Cần viết lại</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-[1fr_120px_130px_100px_80px] gap-4 px-5 py-2 border-b border-[var(--border-default)] text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider items-center bg-[var(--bg-surface)]">
                <span>Tiêu đề</span>
                <span>Template</span>
                <span className="text-center">QC</span>
                <span className="text-center">Trạng thái</span>
                <span className="text-center">Hành động</span>
              </div>
              <div className="divide-y divide-[var(--border-default)] overflow-y-auto custom-scrollbar flex-1 max-h-[220px]">
                {filteredArticles.length === 0 ? (
                  <div className="p-8 text-center text-[var(--text-muted)] text-sm">
                    Chưa có bài viết nào được tìm thấy.
                  </div>
                ) : (
                  filteredArticles.map((article) => (
                    <div
                      key={article.id}
                      className="grid grid-cols-[1fr_120px_130px_100px_80px] gap-4 px-5 py-2.5 items-center hover:bg-[var(--bg-card-hover)] transition-colors"
                    >
                      <div className="min-w-0">
                        <Link href={`/review?id=${article.id}`} className="block text-xs font-medium text-[var(--text-primary)] truncate hover:text-[var(--lc-primary)] transition-colors">
                          {article.title}
                        </Link>
                        <p className="text-[9px] text-[var(--text-muted)] mt-0.5">
                          {new Date(article.createdAt || Date.now()).toLocaleString('vi-VN')}
                        </p>
                      </div>
                      <span className="text-[10px] text-[var(--text-secondary)] truncate">{article.templateName || 'Khác'}</span>
                      {/* QC Column with explanation */}
                      <div className="text-center flex flex-col items-center gap-0.5">
                        {article.qcScore !== undefined ? (
                          <>
                            <div className="flex items-center gap-1">
                              <span className={`px-1 py-0.5 rounded text-[9px] font-black border ${
                                article.qcGrade === 'A' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                article.qcGrade === 'B' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
                                article.qcGrade === 'C' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                                article.qcGrade === 'D' ? 'bg-orange-500/15 text-orange-400 border-orange-500/30' :
                                'bg-red-500/15 text-red-400 border-red-500/30'
                              }`}>
                                {article.qcGrade}
                              </span>
                              <span className={`text-xs font-bold ${
                                article.qcScore >= 80 ? 'text-emerald-400' :
                                article.qcScore >= 60 ? 'text-amber-400' : 'text-red-400'
                              }`}>
                                {article.qcScore}
                              </span>
                              {article.qcDecision && (
                                <span className={`text-[7px] font-bold ${
                                  article.qcDecision === 'SAFE_TO_PUBLISH' ? 'text-emerald-400' :
                                  article.qcDecision === 'REVIEW' ? 'text-amber-400' :
                                  article.qcDecision === 'REJECT' ? 'text-red-400' : 'text-orange-400'
                                }`}>
                                  {article.qcDecision === 'SAFE_TO_PUBLISH' ? '🛡️' :
                                   article.qcDecision === 'REVIEW' ? '⚠️' :
                                   article.qcDecision === 'REJECT' ? '❌' : '🔧'}
                                </span>
                              )}
                            </div>
                            <p className="text-[7px] text-[var(--text-muted)] leading-tight max-w-[120px] truncate" title={buildScoreExplanation(article)}>
                              {buildScoreExplanation(article)}
                            </p>
                          </>
                        ) : (
                          <span className="text-[9px] text-[var(--text-muted)]">—</span>
                        )}
                      </div>
                      <div className="text-center">
                        <span className={`status-badge !py-0.5 !text-[9px] ${
                          statusColors[article.status] || 'bg-slate-500/15 text-slate-400'
                        }`}>
                          {statusLabels[article.status] || article.status}
                        </span>
                      </div>
                      <div className="text-center">
                        <Link href={`/review?id=${article.id}`} className="p-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--lc-primary)]/20 text-[var(--text-muted)] hover:text-[var(--lc-primary)] transition-colors inline-block">
                          ✍️
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Load Balancing Dashboard */}
          {user && ['hdyk', 'lead', 'superadmin'].includes(user.role) && (
            <div className="glass-card mt-6 p-4 rounded-xl border border-[var(--border-default)]">
              <h2 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 mb-4 flex items-center gap-2">
                🩺 Tiến độ & Khối lượng công việc Bác sĩ (Load Balancing)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userStats.filter(u => u.role === 'bs').map(bs => (
                  <div key={bs.id} className="p-3 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-default)]">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-xs text-[var(--text-primary)]">{bs.name}</p>
                        <p className="text-[10px] text-[var(--text-muted)] truncate max-w-[150px]">{bs.specialties?.join(', ') || 'Đa khoa'}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-bold ${bs.stats.activeCount >= (bs.capacity || 10) ? 'text-red-400' : 'text-emerald-400'}`}>
                          {bs.stats.activeCount}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">/{bs.capacity || 10}</span>
                      </div>
                    </div>
                    <div className="w-full bg-[var(--bg-elevated)] rounded-full h-1.5 mb-2">
                      <div className={`h-1.5 rounded-full ${bs.stats.activeCount >= (bs.capacity || 10) ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min((bs.stats.activeCount / (bs.capacity || 10)) * 100, 100)}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                      <span>Đang làm: <strong className="text-amber-400">{bs.stats.activeCount}</strong> | Xong: <strong className="text-emerald-400">{bs.stats.totalCount - bs.stats.activeCount}</strong></span>
                      <Link href={`/review?filterBsId=${bs.id}`} className="text-teal-400 hover:text-teal-300">Quản lý bài →</Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {user && ['btv', 'lead', 'superadmin'].includes(user.role) && (
            <div className="glass-card mt-6 p-4 rounded-xl border border-[var(--border-default)]">
              <h2 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-4 flex items-center gap-2">
                ✍️ Tiến độ Cộng tác viên (CTV)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userStats.filter(u => u.role === 'ctv').map(ctv => (
                  <div key={ctv.id} className="p-3 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-default)] flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs text-[var(--text-primary)]">{ctv.name}</p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-1">
                        Active: <strong className="text-amber-400">{ctv.stats.activeCount}</strong> / Hoàn thành: <strong className="text-emerald-400">{ctv.stats.totalCount - ctv.stats.activeCount}</strong>
                      </p>
                    </div>
                    <Link href={`/review?ctvId=${ctv.id}`} className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20 text-[10px] font-bold">
                      Chi tiết
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Dashboard Auto-Assign Preview Modal */}
      {showDashboardAutoAssign && (
        <AutoAssignPreviewModal
          articleIds={pendingAssignArticleIds}
          onClose={() => setShowDashboardAutoAssign(false)}
          onConfirm={handleDashboardAutoAssignConfirm}
        />
      )}
    </div>
  );
}

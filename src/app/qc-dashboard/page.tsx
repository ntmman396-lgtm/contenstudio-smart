'use client';

import React, { useState, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { getGeneratedArticles } from '@/lib/storage';
import { TECH_LAYER_CONFIG, CONTENT_LAYER_CONFIG, QC_WEIGHT_CONFIG, QC_FLOOR_CONFIG, computeGrade } from '@/lib/qc/section-config';
import { CheckCircle2, TrendingUp, AlertTriangle, ShieldX, X, Layers, Shield } from 'lucide-react';
import { buildScoreExplanation, buildSafetyExplanation } from '@/lib/qc/qc-explain';
import { useAuth } from '@/contexts/AuthContext';
import { useSite } from '@/contexts/SiteContext';

export default function QcDashboardPage() {
  const [viewLogArticle, setViewLogArticle] = useState<any>(null);
  const [logLayer, setLogLayer] = useState<'tech' | 'content' | 'safety'>('tech');

  const [articles, setArticles] = useState<any[]>([]);
  const { currentSite } = useSite();
  const { user } = useAuth(); // getting role info

  React.useEffect(() => {
    getGeneratedArticles(currentSite).then(data => {
      // Role-based isolation directly on the dashboard
      let filtered = data;
      if (user?.role === 'ctv') {
        filtered = data.filter(a => a.createdBy === user.id || a.assignedCtvId === user.id);
      } else if (user?.role === 'bs') {
        filtered = data.filter(a => a.assignedBsId === user.id);
      }
      setArticles(filtered);
    });
  }, [currentSite, user]);

  // ─── Compute real metrics from articles ────────────────────
  const metrics = useMemo(() => {
    if (articles.length === 0) return { avgScore7d: 0, autoFixRate: 0, passRate: 0, blockedArticles: 0 };

    const now = Date.now();
    const _7days = 7 * 24 * 60 * 60 * 1000;
    const recent = articles.filter(a => {
      const created = new Date(a.createdAt).getTime();
      return now - created < _7days;
    });
    const recentScored = recent.filter(a => a.qcScore !== undefined);
    const scoredArticles = recentScored.length > 0 ? recentScored : articles.filter(a => a.qcScore !== undefined);

    const scores = scoredArticles.map(a => a.qcScore as number);
    const avgScore7d = scores.length > 0 ? Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10 : 0;

    const totalAutoFixes = articles.reduce((s, a) => s + (a.qcAutoFixes || 0), 0);
    const totalManual = articles.reduce((s, a) => s + (a.qcManualIssues || 0), 0);
    const autoFixRate = (totalAutoFixes + totalManual) > 0
      ? Math.round((totalAutoFixes / (totalAutoFixes + totalManual)) * 1000) / 10
      : 0;

    // Pass = Grade A or B (score >= 80)
    const scoredTotal = articles.filter(a => a.qcScore !== undefined);
    const passCount = scoredTotal.filter(a => (a.qcScore as number) >= 80).length;
    const passRate = scoredTotal.length > 0 ? Math.round((passCount / scoredTotal.length) * 1000) / 10 : 0;

    const blockedArticles = articles.filter(a => a.qcSyncBlocked).length;

    // Avg FSI
    const fsiArticles = articles.filter(a => a.qcFinalSafetyIndex !== undefined);
    const avgFsi = fsiArticles.length > 0
      ? Math.round((fsiArticles.reduce((s, a) => s + (a.qcFinalSafetyIndex as number), 0) / fsiArticles.length) * 10) / 10
      : 0;

    return { avgScore7d, autoFixRate, passRate, blockedArticles, avgFsi, fsiCount: fsiArticles.length };
  }, [articles]);

  // ─── Score distribution histogram ──────────────────────────
  const scoreDistribution = useMemo(() => {
    const ranges = [
      { range: '0-59 (E)', min: 0, max: 59, count: 0 },
      { range: '60-69 (D)', min: 60, max: 69, count: 0 },
      { range: '70-79 (C)', min: 70, max: 79, count: 0 },
      { range: '80-89 (B)', min: 80, max: 89, count: 0 },
      { range: '90-100 (A)', min: 90, max: 100, count: 0 },
    ];
    articles.filter(a => a.qcScore !== undefined).forEach(a => {
      const s = a.qcScore as number;
      const match = ranges.find(r => s >= r.min && s <= r.max);
      if (match) match.count++;
    });
    return ranges.map(r => ({ range: r.range, count: r.count }));
  }, [articles]);

  // ─── Trend data (group by day) ─────────────────────────────
  const trendData = useMemo(() => {
    if (articles.length === 0) return [];
    const byDay: Record<string, number[]> = {};
    articles.filter(a => a.qcScore !== undefined).forEach(a => {
      const day = new Date(a.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      const s = a.qcScore as number;
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(s);
    });
    return Object.entries(byDay).map(([date, scores]) => ({
      date,
      score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    })).slice(-30);
  }, [articles]);

  // ─── Template comparison ───────────────────────────────────
  const templateComparison = useMemo(() => {
    const byTemplate: Record<string, number[]> = {};
    articles.filter(a => a.qcScore !== undefined).forEach(a => {
      const key = a.templateName || a.templateId || 'Unknown';
      const s = a.qcScore as number;
      if (!byTemplate[key]) byTemplate[key] = [];
      byTemplate[key].push(s);
    });
    return Object.entries(byTemplate).map(([name, scores]) => ({
      name,
      score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    }));
  }, [articles]);

  // ─── Sub-dimension violations ──────────────────────────────
  const subViolations = useMemo(() => {
    const results: { layer: string; subId: string; label: string; count: number; avgDeduction: number }[] = [];
    
    // Tech layer
    TECH_LAYER_CONFIG.forEach(cfg => {
      let totalDeducted = 0;
      let count = 0;
      articles.forEach(a => {
        const score = a.qcTechScore?.[cfg.id as keyof typeof a.qcTechScore];
        if (score !== undefined && score < cfg.max) {
          totalDeducted += cfg.max - score;
          count++;
        }
      });
      if (count > 0) {
        results.push({ layer: '🔧 Kỹ thuật', subId: cfg.id, label: cfg.label, count, avgDeduction: Math.round(totalDeducted / count * 10) / 10 });
      }
    });

    // Content layer
    CONTENT_LAYER_CONFIG.forEach(cfg => {
      let totalDeducted = 0;
      let count = 0;
      articles.forEach(a => {
        const score = a.qcContentScore?.[cfg.id as keyof typeof a.qcContentScore];
        if (score !== undefined && score < cfg.max) {
          totalDeducted += cfg.max - score;
          count++;
        }
      });
      if (count > 0) {
        results.push({ layer: '📋 Nội dung', subId: cfg.id, label: cfg.label, count, avgDeduction: Math.round(totalDeducted / count * 10) / 10 });
      }
    });

    return results;
  }, [articles]);

  // ─── Recent articles as "runs" ─────────────────────────────
  const recentRuns = useMemo(() => {
    return articles.slice(0, 8).map(a => {
      const isScored = a.qcScore !== undefined;
      const score = a.qcScore ?? 0;
      const grade = a.qcGrade ?? (isScored ? computeGrade(score) : 'N/A');
      const timeDelta = Date.now() - new Date(a.createdAt).getTime();
      const minutes = Math.round(timeDelta / 60000);
      const timeLabel = minutes < 60 ? `${minutes}p trước` : minutes < 1440 ? `${Math.round(minutes / 60)}h trước` : `${Math.round(minutes / 1440)}d trước`;
      return {
        id: a.id,
        title: a.title.length > 40 ? a.title.substring(0, 40) + '...' : a.title,
        template: a.templateName || a.templateId,
        score,
        techScore: a.qcTechScore?.total ?? 0,
        contentScore: a.qcContentScore?.total ?? 0,
        grade,
        fixes: a.qcAutoFixes || 0,
        manualIssues: a.qcManualIssues || 0,
        status: !isScored ? 'pending_qc' : (score >= 80 ? 'ready_for_review' : score >= 70 ? 'needs_improvement' : 'rework_required'),
        time: timeLabel,
        isScored,
        article: a
      };
    });
  }, [articles]);

  const isEmpty = articles.length === 0;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto w-full relative pt-6 px-8 pb-12 custom-scrollbar">
        
        {/* HEADER */}
        <div className="mb-6 flex items-center justify-between">
           <div>
              <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] mb-2 uppercase tracking-wider font-medium">
                <span>Workspace</span>
                <span>/</span>
                <span className="text-[var(--lc-primary)] font-bold">Quality Control Dashboard</span>
              </div>
              <h1 className="text-2xl font-black text-[var(--text-primary)]">Analytics & Reports</h1>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                {isEmpty ? 'Chưa có bài viết nào. Tạo bài viết mới để xem dữ liệu QC.' : `Thống kê từ ${articles.length} bài viết. Mô hình 3 tầng: Kỹ thuật (×${QC_WEIGHT_CONFIG.tech}) + Nội dung (×${QC_WEIGHT_CONFIG.content}) + An Toàn (gate).`}
              </p>
           </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-5 gap-5 mb-8">
          <div className="glass-card p-5 rounded-2xl flex flex-col justify-between border-b-4 border-emerald-500 hover:-translate-y-1 transition-transform">
            <div className="flex justify-between items-start">
               <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Avg QC Score (7D)</span>
               <TrendingUp size={16} className="text-emerald-500" />
            </div>
            <div className="text-4xl font-black text-emerald-400 mt-4">{metrics.avgScore7d || '—'}</div>
            <p className="text-[10px] text-emerald-500 font-medium mt-1">{isEmpty ? 'Chưa có dữ liệu' : `Trung bình ${articles.length} bài`}</p>
          </div>
          
          <div className="glass-card p-5 rounded-2xl flex flex-col justify-between border-b-4 border-blue-500 hover:-translate-y-1 transition-transform">
            <div className="flex justify-between items-start">
               <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Auto-fix Rate</span>
               <CheckCircle2 size={16} className="text-blue-500" />
            </div>
            <div className="flex items-end gap-1 mt-4">
              <span className="text-4xl font-black text-blue-400">{metrics.autoFixRate || '—'}</span>
              {metrics.autoFixRate > 0 && <span className="text-lg font-bold text-blue-400 mb-1">%</span>}
            </div>
            <p className="text-[10px] text-blue-500 font-medium mt-1">{isEmpty ? 'Chưa có dữ liệu' : 'Tỉ lệ tự sửa lỗi thành công'}</p>
          </div>

          <div className="glass-card p-5 rounded-2xl flex flex-col justify-between border-b-4 border-amber-500 hover:-translate-y-1 transition-transform">
            <div className="flex justify-between items-start">
               <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Pass Rate (≥80)</span>
               <AlertTriangle size={16} className="text-amber-500" />
            </div>
            <div className="flex items-end gap-1 mt-4">
              <span className="text-4xl font-black text-amber-400">{metrics.passRate || '—'}</span>
              {metrics.passRate > 0 && <span className="text-lg font-bold text-amber-400 mb-1">%</span>}
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">{isEmpty ? 'Chưa có dữ liệu' : 'Tỉ lệ đạt Grade A/B'}</p>
          </div>

          <div className="glass-card p-5 rounded-2xl flex flex-col justify-between border-b-4 border-cyan-500 hover:-translate-y-1 transition-transform">
            <div className="flex justify-between items-start">
               <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Avg FSI (Safety)</span>
               <Shield size={16} className="text-cyan-500" />
            </div>
            <div className="text-4xl font-black text-cyan-400 mt-4">{metrics.avgFsi || '—'}</div>
            <p className="text-[10px] text-cyan-500 font-medium mt-1">{isEmpty ? 'Chưa có dữ liệu' : `${metrics.fsiCount} bài đã chấm Safety`}</p>
          </div>

          <div className="glass-card p-5 rounded-2xl flex flex-col justify-between border-b-4 border-red-500 hover:-translate-y-1 transition-transform bg-red-500/5">
            <div className="flex justify-between items-start">
               <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Bài bị Blocked</span>
               <ShieldX size={16} className="text-red-500" />
            </div>
            <div className="text-4xl font-black text-red-500 mt-4">{metrics.blockedArticles}</div>
            <p className="text-[10px] text-red-400 font-medium mt-1">{isEmpty ? 'Chưa có dữ liệu' : 'Floor violation hoặc Safety block'}</p>
          </div>
        </div>

        {isEmpty ? (
          <div className="glass-card p-12 rounded-2xl flex flex-col items-center justify-center text-center">
            <span className="text-5xl mb-4 opacity-50">📊</span>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Chưa có dữ liệu QC</h3>
            <p className="text-sm text-[var(--text-muted)] max-w-md">Hãy tạo bài viết mới qua Single Generator hoặc Batch Generator. Sau khi bài viết được tạo và chạy QC Engine, dữ liệu sẽ tự động hiển thị tại đây.</p>
          </div>
        ) : (
          <>
            {/* CHARTS LAYER 1 */}
            <div className="grid grid-cols-2 gap-6 mb-8">
               {/* Chart 1: Histogram Score Distribution */}
               <div className="glass-card p-6 rounded-2xl">
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">Phổ Điểm QC (Tổng trọng số)</h3>
                    <p className="text-xs text-[var(--text-muted)]">Phân bố theo Grade A-E mới (90/80/70/60).</p>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={scoreDistribution}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="range" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: 'none', borderRadius: '8px' }} />
                        <Bar dataKey="count" fill="var(--lc-primary)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
               </div>

               {/* Chart 2: Timeline Trend */}
               <div className="glass-card p-6 rounded-2xl">
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">Xu Hướng Điểm Theo Ngày</h3>
                    <p className="text-xs text-[var(--text-muted)]">Theo dõi chất lượng bài viết theo thời gian.</p>
                  </div>
                  <div className="h-64 w-full">
                    {trendData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                          <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: 'none', borderRadius: '8px' }} />
                          <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">Chưa đủ dữ liệu</div>
                    )}
                  </div>
               </div>
            </div>

            {/* CHARTS LAYER 2 */}
            <div className="grid grid-cols-[1fr_300px] gap-6 mb-8">
               {/* Table: Sub-dimension Violations */}
               <div className="glass-card p-6 rounded-2xl flex flex-col">
                 <div className="mb-4">
                   <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5"><Layers size={14} /> Vi Phạm Theo Chiều Chấm Điểm</h3>
                   <p className="text-xs text-[var(--text-muted)]">Các sub-dimension hay bị trừ điểm (3 tầng).</p>
                 </div>
                 {subViolations.length > 0 ? (
                   <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-[var(--border-default)] text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                            <th className="pb-3 font-semibold">Tầng</th>
                            <th className="pb-3 font-semibold">Chiều chấm</th>
                            <th className="pb-3 font-semibold text-center">Bài bị trừ</th>
                            <th className="pb-3 font-semibold text-right">Avg trừ điểm</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-default)]">
                          {subViolations.map((r, i) => (
                            <tr key={i} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                              <td className="py-3 pr-4">
                                <span className="text-[10px] font-bold text-[var(--text-muted)]">{r.layer}</span>
                              </td>
                              <td className="py-3 pr-4">
                                <p className="font-bold text-[var(--text-primary)] text-xs">{r.label}</p>
                                <p className="text-[10px] text-[var(--text-muted)] font-mono">{r.subId}</p>
                              </td>
                              <td className="py-3 text-center font-bold text-amber-400">{r.count} <span className="text-[10px] font-normal text-gray-500 ml-0.5">bài</span></td>
                              <td className="py-3 text-right text-red-400 text-xs font-mono font-bold">-{r.avgDeduction}đ</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   </div>
                 ) : (
                   <div className="flex-1 flex items-center justify-center text-sm text-[var(--text-muted)]">Chưa có dữ liệu sub-dimension</div>
                 )}
               </div>

               {/* Chart 3: Template Comparison */}
               <div className="glass-card p-6 rounded-2xl flex flex-col">
                 <div className="mb-6">
                   <h3 className="text-sm font-bold text-[var(--text-primary)]">Điểm Theo Template</h3>
                 </div>
                 <div className="flex-1 w-full min-h-[200px]">
                   {templateComparison.length > 0 ? (
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={templateComparison} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                         <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                         <XAxis type="number" domain={[0, 100]} hide />
                         <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={80} />
                         <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: 'none', borderRadius: '8px' }} />
                         <Bar dataKey="score" radius={[0, 4, 4, 0]} fill="#10b981" />
                       </BarChart>
                     </ResponsiveContainer>
                   ) : (
                     <div className="flex items-center justify-center h-full text-sm text-[var(--text-muted)]">Chưa có dữ liệu</div>
                   )}
                 </div>
               </div>
            </div>

            {/* RECENT RUNS */}
            <div className="glass-card rounded-2xl overflow-hidden border border-[var(--border-default)] mb-8">
               <div className="p-6 border-b border-[var(--border-default)]">
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">QC Runs Gần Đây</h3>
                  <p className="text-xs text-[var(--text-muted)]">Danh sách bài viết đã chạy QC Engine (3 tầng).</p>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[var(--bg-secondary)]">
                      <tr className="border-b border-[var(--border-default)] text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                        <th className="py-3 px-6 font-semibold">Tên Bài Viết</th>
                        <th className="py-3 px-4 font-semibold">🔧 Tech</th>
                        <th className="py-3 px-4 font-semibold">📋 Content</th>
                        <th className="py-3 px-4 font-semibold text-center">Tổng</th>
                        <th className="py-3 px-4 font-semibold text-center">🛡️ Safety</th>
                        <th className="py-3 px-4 font-semibold">Fixes</th>
                        <th className="py-3 px-4 font-semibold">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-default)]">
                      {recentRuns.map(run => (
                        <tr key={run.id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                          <td className="py-4 px-6 max-w-[250px]">
                            <p className="text-xs text-[var(--text-primary)] font-bold truncate">{run.title}</p>
                            <p className="text-[8px] text-[var(--text-muted)] mt-0.5 truncate" title={buildScoreExplanation(run.article)}>
                              ↳ {buildScoreExplanation(run.article)}
                            </p>
                            <span className="text-[9px] text-[var(--text-muted)]">{run.template} · {run.time}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`text-[11px] font-bold ${run.techScore >= 80 ? 'text-emerald-400' : run.techScore >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                              {run.techScore || '—'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`text-[11px] font-bold ${run.contentScore >= 80 ? 'text-emerald-400' : run.contentScore >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                              {run.contentScore || '—'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            {run.isScored ? (
                              <span className={`px-2 py-1 rounded text-xs font-bold border ${run.grade === 'A' || run.grade === 'B' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : run.grade === 'C' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                                {run.score} ({run.grade})
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded text-xs font-bold border bg-gray-500/10 text-gray-400 border-gray-500/30">
                                Chưa chấm
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center">
                            {run.article.qcDecision ? (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                                run.article.qcDecision === 'SAFE_TO_PUBLISH' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                run.article.qcDecision === 'REVIEW' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                run.article.qcDecision === 'NEEDS_REVISION' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                'bg-red-500/10 text-red-400 border-red-500/20'
                              }`}>
                                {run.article.qcDecision === 'SAFE_TO_PUBLISH' ? '🛡️ SAFE' :
                                 run.article.qcDecision === 'REVIEW' ? '⚠️ REVIEW' :
                                 run.article.qcDecision === 'NEEDS_REVISION' ? '🔧 REV' :
                                 '❌ REJ'}
                              </span>
                            ) : (
                              <span className="text-[9px] text-[var(--text-muted)]">—</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-xs font-mono text-[var(--text-secondary)]">
                            {run.fixes > 0 && <span className="text-emerald-400">✓{run.fixes}</span>}
                            {run.manualIssues > 0 && <span className="text-amber-400 ml-1">⚠{run.manualIssues}</span>}
                            {run.fixes === 0 && run.manualIssues === 0 && '—'}
                          </td>
                          <td className="py-4 px-4">
                            <button
                              onClick={() => { setViewLogArticle(run.article); setLogLayer('tech'); }}
                              className="text-[10px] font-bold text-[var(--lc-primary)] hover:text-blue-300 transition-colors"
                            >
                              View Log
                            </button>
                          </td>
                        </tr>
                      ))}
                      {recentRuns.length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-sm text-[var(--text-muted)]">
                            Chưa có bài viết nào.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
               </div>
            </div>
          </>
        )}

        {viewLogArticle && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setViewLogArticle(null)}>
            <div
              className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)]">
                <div>
                  <h3 className="font-bold text-[var(--text-primary)] text-sm">QC Log — Chi Tiết (3 Tầng)</h3>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate max-w-md">{viewLogArticle.title}</p>
                </div>
                <button onClick={() => setViewLogArticle(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
                {/* Score overview — 6 cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[var(--bg-card-hover)] p-3 rounded-lg text-center">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Tổng</p>
                    <p className={`text-2xl font-black mt-1 ${(viewLogArticle.qcScore ?? 0) >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {viewLogArticle.qcScore ?? '—'}
                    </p>
                  </div>
                  <div className="bg-[var(--bg-card-hover)] p-3 rounded-lg text-center">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Grade</p>
                    <p className="text-2xl font-black mt-1 text-[var(--text-primary)]">{viewLogArticle.qcGrade ?? '—'}</p>
                  </div>
                  <div className="bg-blue-500/10 p-3 rounded-lg text-center border border-blue-500/15">
                    <p className="text-[10px] text-blue-400 uppercase font-bold">🔧 Kỹ thuật</p>
                    <p className={`text-2xl font-black mt-1 ${(viewLogArticle.qcTechScore?.total ?? 0) >= 80 ? 'text-emerald-400' : (viewLogArticle.qcTechScore?.total ?? 0) >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                      {viewLogArticle.qcTechScore?.total ?? '—'}<span className="text-[10px] text-[var(--text-muted)]">/100</span>
                    </p>
                  </div>
                  <div className="bg-purple-500/10 p-3 rounded-lg text-center border border-purple-500/15">
                    <p className="text-[10px] text-purple-400 uppercase font-bold">📋 Nội dung</p>
                    <p className={`text-2xl font-black mt-1 ${(viewLogArticle.qcContentScore?.total ?? 0) >= 80 ? 'text-emerald-400' : (viewLogArticle.qcContentScore?.total ?? 0) >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                      {viewLogArticle.qcContentScore?.total ?? '—'}<span className="text-[10px] text-[var(--text-muted)]">/100</span>
                    </p>
                  </div>
                  <div className="bg-cyan-500/10 p-3 rounded-lg text-center border border-cyan-500/15">
                    <p className="text-[10px] text-cyan-400 uppercase font-bold">🛡️ Risk</p>
                    <p className={`text-2xl font-black mt-1 ${(viewLogArticle.qcRiskScore ?? 0) < 20 ? 'text-emerald-400' : (viewLogArticle.qcRiskScore ?? 0) < 50 ? 'text-amber-400' : 'text-red-400'}`}>
                      {viewLogArticle.qcRiskScore ?? '—'}<span className="text-[10px] text-[var(--text-muted)]">/100</span>
                    </p>
                  </div>
                  <div className="bg-teal-500/10 p-3 rounded-lg text-center border border-teal-500/15">
                    <p className="text-[10px] text-teal-400 uppercase font-bold">FSI</p>
                    <p className={`text-2xl font-black mt-1 ${(viewLogArticle.qcFinalSafetyIndex ?? 0) >= 50 ? 'text-emerald-400' : (viewLogArticle.qcFinalSafetyIndex ?? 0) >= 20 ? 'text-amber-400' : 'text-red-400'}`}>
                      {viewLogArticle.qcFinalSafetyIndex?.toFixed(1) ?? '—'}
                    </p>
                  </div>
                </div>

                {/* Layer tabs — 3 tabs */}
                <div className="flex bg-[var(--bg-card-hover)] rounded-lg p-0.5">
                  <button onClick={() => setLogLayer('tech')} className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition-all ${logLayer === 'tech' ? 'bg-blue-500/20 text-blue-400 shadow-sm' : 'text-[var(--text-muted)]'}`}>🔧 Kỹ Thuật</button>
                  <button onClick={() => setLogLayer('content')} className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition-all ${logLayer === 'content' ? 'bg-purple-500/20 text-purple-400 shadow-sm' : 'text-[var(--text-muted)]'}`}>📋 Chuyên Môn</button>
                  <button onClick={() => setLogLayer('safety')} className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition-all ${logLayer === 'safety' ? 'bg-cyan-500/20 text-cyan-400 shadow-sm' : 'text-[var(--text-muted)]'}`}>🛡️ An Toàn</button>
                </div>

                {/* Breakdown — Tech or Content */}
                {logLayer !== 'safety' && (
                  <div>
                    <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider mb-3">
                      {logLayer === 'tech' ? 'Tầng 1: Kỹ Thuật' : 'Tầng 2: Chuyên Môn'}
                    </h4>
                    <div className="space-y-2.5">
                      {(logLayer === 'tech' ? TECH_LAYER_CONFIG : CONTENT_LAYER_CONFIG).map(cfg => {
                        const layerData = logLayer === 'tech' ? viewLogArticle.qcTechScore : viewLogArticle.qcContentScore;
                        const sub = layerData?.[cfg.id] ?? Math.round(cfg.max * ((viewLogArticle.qcScore ?? 0) / 100));
                        const pct = (sub / cfg.max) * 100;
                        const isMax = sub === cfg.max;
                        const deducted = cfg.max - sub;
                        return (
                          <div key={cfg.id} className="flex items-center gap-3">
                            <span className="text-[10px] font-semibold text-[var(--text-secondary)] w-40 shrink-0">{cfg.label}</span>
                            <div className="flex-1 h-2 bg-[var(--bg-card-hover)] rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${isMax ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className={`text-[10px] font-bold w-12 text-right ${isMax ? 'text-emerald-400' : pct >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                              {sub}/{cfg.max}
                            </span>
                            {deducted > 0 && (
                              <span className="text-[9px] text-red-400 font-mono w-8">-{deducted}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Safety tab */}
                {logLayer === 'safety' && (
                  <div>
                    <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider mb-3">Tầng 3: An Toàn Y Tế</h4>
                    
                    {viewLogArticle.qcDecision ? (
                      <div className="space-y-3">
                        {/* Decision banner */}
                        <div className={`p-3 rounded-lg border flex items-center gap-3 ${
                          viewLogArticle.qcDecision === 'SAFE_TO_PUBLISH' ? 'bg-emerald-500/10 border-emerald-500/20' :
                          viewLogArticle.qcDecision === 'REVIEW' ? 'bg-amber-500/10 border-amber-500/20' :
                          viewLogArticle.qcDecision === 'NEEDS_REVISION' ? 'bg-orange-500/10 border-orange-500/20' :
                          'bg-red-500/10 border-red-500/20'
                        }`}>
                          <span className="text-2xl">
                            {viewLogArticle.qcDecision === 'SAFE_TO_PUBLISH' ? '🛡️' :
                             viewLogArticle.qcDecision === 'REVIEW' ? '⚠️' :
                             viewLogArticle.qcDecision === 'NEEDS_REVISION' ? '🔧' : '❌'}
                          </span>
                          <div>
                            <p className={`text-sm font-black ${
                              viewLogArticle.qcDecision === 'SAFE_TO_PUBLISH' ? 'text-emerald-400' :
                              viewLogArticle.qcDecision === 'REVIEW' ? 'text-amber-400' :
                              viewLogArticle.qcDecision === 'NEEDS_REVISION' ? 'text-orange-400' : 'text-red-400'
                            }`}>
                              {viewLogArticle.qcDecision.replace(/_/g, ' ')}
                            </p>
                            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{buildSafetyExplanation(viewLogArticle)}</p>
                          </div>
                        </div>

                        {/* Safety metrics breakdown */}
                        <div className="space-y-2">
                          {[{ label: 'Risk Score', value: viewLogArticle.qcRiskScore, max: 100, desc: 'Càng thấp càng tốt (0 = an toàn, 100 = nguy hiểm)', color: (viewLogArticle.qcRiskScore ?? 0) < 20 ? 'emerald' : (viewLogArticle.qcRiskScore ?? 0) < 50 ? 'amber' : 'red' },
                            { label: 'Safety Score', value: viewLogArticle.qcSafetyScore, max: 100, desc: 'Càng cao càng tốt', color: (viewLogArticle.qcSafetyScore ?? 0) >= 80 ? 'emerald' : (viewLogArticle.qcSafetyScore ?? 0) >= 50 ? 'amber' : 'red' },
                            { label: 'Final Safety Index', value: viewLogArticle.qcFinalSafetyIndex?.toFixed(1), max: 100, desc: 'FSI = f(risk, safety) — quyết định xuất bản', color: (viewLogArticle.qcFinalSafetyIndex ?? 0) >= 50 ? 'emerald' : (viewLogArticle.qcFinalSafetyIndex ?? 0) >= 20 ? 'amber' : 'red' },
                          ].map(metric => (
                            <div key={metric.label} className="flex items-center gap-3">
                              <span className="text-[10px] font-semibold text-[var(--text-secondary)] w-36 shrink-0">{metric.label}</span>
                              <div className="flex-1 h-2 bg-[var(--bg-card-hover)] rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all bg-${metric.color}-500`} style={{ width: `${Math.min(Number(metric.value ?? 0), 100)}%` }} />
                              </div>
                              <span className={`text-[10px] font-bold w-12 text-right text-${metric.color}-400`}>
                                {metric.value ?? '—'}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Risk level */}
                        {viewLogArticle.qcRiskLevel && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[var(--text-muted)]">Risk Level:</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              viewLogArticle.qcRiskLevel === 'LOW' ? 'bg-emerald-500/15 text-emerald-400' :
                              viewLogArticle.qcRiskLevel === 'MEDIUM' ? 'bg-amber-500/15 text-amber-400' :
                              viewLogArticle.qcRiskLevel === 'HIGH' ? 'bg-orange-500/15 text-orange-400' :
                              'bg-red-500/15 text-red-400'
                            }`}>
                              {viewLogArticle.qcRiskLevel}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-[var(--text-muted)] text-sm">
                        <p className="text-lg mb-2">🛡️</p>
                        <p>Chưa chạy Layer 3 Safety cho bài này.</p>
                        <p className="text-[10px] mt-1">Safety sẽ tự động chạy khi tạo bài mới hoặc chạy lại QC.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Floor check */}
                {viewLogArticle.qcSyncBlocked && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-[10px] text-red-400 font-bold">🚫 Sync Blocked</p>
                    <p className="text-[10px] text-red-300/80 mt-0.5">{viewLogArticle.qcBlockedReason || 'Floor violation hoặc Safety block'}</p>
                  </div>
                )}

                {/* Metadata */}
                <div className="border-t border-[var(--border-default)] pt-4">
                  <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider mb-2">Thông Tin Bổ Sung</h4>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex justify-between"><span className="text-[var(--text-muted)]">Template</span><span className="text-[var(--text-secondary)]">{viewLogArticle.templateName}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--text-muted)]">Status</span><span className={viewLogArticle.status === 'approved' ? 'text-emerald-400' : viewLogArticle.status === 'rejected' ? 'text-red-400' : 'text-amber-400'}>{viewLogArticle.status}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--text-muted)]">Created</span><span className="text-[var(--text-secondary)]">{new Date(viewLogArticle.createdAt).toLocaleString('vi-VN')}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--text-muted)]">Auto-fix</span><span className="text-emerald-400">{viewLogArticle.qcAutoFixes ?? 0}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--text-muted)]">Manual</span><span className="text-amber-400">{viewLogArticle.qcManualIssues ?? 0}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--text-muted)]">Trọng số</span><span className="text-[var(--text-secondary)]">Tech×{QC_WEIGHT_CONFIG.tech} + Content×{QC_WEIGHT_CONFIG.content}</span></div>
                    {viewLogArticle.qcDecision && (
                      <div className="flex justify-between"><span className="text-[var(--text-muted)]">Safety Decision</span><span className={viewLogArticle.qcDecision === 'SAFE_TO_PUBLISH' ? 'text-emerald-400' : viewLogArticle.qcDecision === 'REJECT' ? 'text-red-400' : 'text-amber-400'}>{viewLogArticle.qcDecision}</span></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

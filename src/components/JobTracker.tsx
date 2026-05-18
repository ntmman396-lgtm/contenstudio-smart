'use client';

import React, { useState, useEffect } from 'react';
import { Job } from '@/types';
import { mockJobs } from '@/lib/mock-data';

const statusConfig: Record<string, { label: string; color: string; bg: string; dotClass: string }> = {
  queued: {
    label: 'Queued',
    color: 'text-slate-400',
    bg: 'bg-slate-500/15',
    dotClass: 'bg-slate-400',
  },
  generating: {
    label: 'Generating',
    color: 'text-blue-400',
    bg: 'bg-blue-500/15',
    dotClass: 'bg-blue-400 animate-pulse',
  },
  qc_running: {
    label: 'QC Running',
    color: 'text-violet-400',
    bg: 'bg-violet-500/15',
    dotClass: 'bg-violet-400 animate-pulse',
  },
  review: {
    label: 'Review',
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    dotClass: 'bg-amber-400',
  },
  completed: {
    label: 'Completed',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    dotClass: 'bg-emerald-400',
  },
  failed: {
    label: 'Failed',
    color: 'text-red-400',
    bg: 'bg-red-500/15',
    dotClass: 'bg-red-400',
  },
};

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

function getGradeColor(grade?: string) {
  if (!grade) return '';
  switch (grade) {
    case 'A': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'B': return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
    case 'C': return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    case 'D': return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    case 'E': return 'bg-red-500/15 text-red-400 border-red-500/30';
    default: return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
  }
}

export default function JobTracker() {
  // Enhance mock jobs with QC data for demonstration
  const [jobs, setJobs] = useState<Job[]>(() => {
    return mockJobs.map((job, i) => ({
      ...job,
      qcScore: job.status === 'completed' ? [92, 78, 88, 65, 96][i % 5] : undefined,
      qcGrade: job.status === 'completed' ? (['A', 'C', 'B', 'D', 'A'] as string[])[i % 5] : undefined,
      qcAutoFixes: job.status === 'completed' ? [2, 5, 3, 0, 1][i % 5] : undefined,
    }));
  });

  // Simulate progress animation for generating jobs
  useEffect(() => {
    const interval = setInterval(() => {
      setJobs((prev) =>
        prev.map((job) => {
          if (job.status === 'generating' && job.progress < 100) {
            const newProgress = Math.min(job.progress + Math.random() * 3, 100);
            if (newProgress >= 100) {
              // Transition to QC running for a brief period
              return { ...job, progress: 85, status: 'qc_running' as any };
            }
            return { ...job, progress: Math.round(newProgress) };
          }
          if (job.status === ('qc_running' as any)) {
            // Simulate QC completion
            return {
              ...job,
              progress: 100,
              status: 'review' as any,
              qcScore: Math.floor(Math.random() * 25 + 70),
              qcGrade: Math.random() > 0.5 ? 'B' : 'C',
              qcAutoFixes: Math.floor(Math.random() * 5 + 1),
            };
          }
          return job;
        })
      );
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const activeCount = jobs.filter(
    (j) => j.status === 'generating' || j.status === 'queued' || j.status === ('qc_running' as any)
  ).length;

  // QC Summary stats
  const completedJobs = jobs.filter(j => j.qcScore !== undefined);
  const passedAB = completedJobs.filter(j => j.qcScore! >= 80).length;
  const needsImprovement = completedJobs.filter(j => j.qcScore! >= 70 && j.qcScore! < 80).length;
  const reworkRequired = completedJobs.filter(j => j.qcScore! < 70).length;
  const totalAutoFixes = completedJobs.reduce((sum, j) => sum + (j.qcAutoFixes || 0), 0);
  const avgScore = completedJobs.length > 0 ? Math.round(completedJobs.reduce((sum, j) => sum + j.qcScore!, 0) / completedJobs.length) : 0;

  return (
    <aside className="job-tracker-panel w-[320px] h-screen flex flex-col border-l border-[var(--border-default)] bg-[var(--bg-secondary)] sticky top-0 shrink-0">
      {/* Header */}
      <div className="p-4 pb-3 border-b border-[var(--border-default)]">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-bold text-[var(--text-primary)]">Job Tracker</h2>
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                {activeCount} active
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--bg-card-hover)] text-[var(--text-muted)]">
              {jobs.length} total
            </span>
          </div>
        </div>
        <p className="text-[11px] text-[var(--text-muted)]">
          Theo dõi tiến trình generate & QC nội dung
        </p>
      </div>

      {/* Job list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {jobs.map((job, index) => {
          const status = statusConfig[job.status] || statusConfig.queued;
          return (
            <div
              key={job.id}
              className="glass-card glass-card-hover p-3.5 rounded-xl animate-fade-in"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              {/* Header row */}
              <div className="flex items-start gap-2.5 mb-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 bg-[var(--bg-card-hover)]">
                  {job.templateName?.charAt(0) || '📝'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate leading-tight">
                    {job.title}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                    {job.templateName} • {job.sourceCount} source(s)
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-2">
                <div className="w-full h-1.5 rounded-full bg-[var(--bg-card-hover)] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                      job.status === 'generating'
                        ? 'animate-shimmer'
                        : job.status === ('qc_running' as any)
                        ? ''
                        : job.status === 'completed'
                        ? 'bg-emerald-500'
                        : job.status === 'failed'
                        ? 'bg-red-500'
                        : job.status === 'review'
                        ? 'bg-amber-500'
                        : 'bg-slate-600'
                    }`}
                    style={{
                      width: `${job.progress}%`,
                      background: job.status === 'generating'
                        ? 'linear-gradient(90deg, #3B82F6, #60A5FA, #3B82F6)'
                        : job.status === ('qc_running' as any)
                        ? 'linear-gradient(90deg, #8B5CF6, #A78BFA, #8B5CF6)'
                        : undefined,
                    }}
                  />
                </div>
              </div>

              {/* Footer row */}
              <div className="flex items-center justify-between">
                <span className={`status-badge ${status.bg} ${status.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
                  {status.label}
                  {job.status === 'generating' && ` ${job.progress}%`}
                  {job.status === ('qc_running' as any) && ' ...'}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  {getRelativeTime(job.createdAt)}
                </span>
              </div>

              {/* QC Result Badge — shown after QC completes */}
              {job.qcScore !== undefined && (
                <div className="mt-2 pt-2 border-t border-[var(--border-default)] flex items-center justify-between animate-fade-in">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-black border ${getGradeColor(job.qcGrade)}`}>
                      {job.qcGrade}
                    </span>
                    <span className={`text-xs font-bold ${
                      job.qcScore >= 80 ? 'text-emerald-400' :
                      job.qcScore >= 70 ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {job.qcScore}đ
                    </span>
                  </div>
                  {job.qcAutoFixes !== undefined && job.qcAutoFixes > 0 && (
                    <span className="text-[9px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded font-bold">
                      ✓ {job.qcAutoFixes} auto-fix
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary footer — enhanced with QC stats */}
      <div className="p-4 border-t border-[var(--border-default)]">
        {/* Row 1: Status counts */}
        <div className="grid grid-cols-3 gap-2 text-center mb-3">
          <div className="p-2 rounded-lg bg-[var(--bg-card-hover)]">
            <p className="text-sm font-bold text-emerald-400">
              {jobs.filter((j) => j.status === 'completed').length}
            </p>
            <p className="text-[10px] text-[var(--text-muted)]">Done</p>
          </div>
          <div className="p-2 rounded-lg bg-[var(--bg-card-hover)]">
            <p className="text-sm font-bold text-amber-400">
              {jobs.filter((j) => j.status === 'review').length}
            </p>
            <p className="text-[10px] text-[var(--text-muted)]">Review</p>
          </div>
          <div className="p-2 rounded-lg bg-[var(--bg-card-hover)]">
            <p className="text-sm font-bold text-red-400">
              {jobs.filter((j) => j.status === 'failed').length}
            </p>
            <p className="text-[10px] text-[var(--text-muted)]">Failed</p>
          </div>
        </div>

        {/* Row 2: QC Summary */}
        {completedJobs.length > 0 && (
          <div className="p-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card-hover)]">
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">QC Summary</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px]">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Avg Score</span>
                <span className={`font-bold ${avgScore >= 80 ? 'text-emerald-400' : avgScore >= 70 ? 'text-amber-400' : 'text-red-400'}`}>{avgScore}đ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Auto-fixes</span>
                <span className="font-bold text-blue-400">{totalAutoFixes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Pass (A/B)</span>
                <span className="font-bold text-emerald-400">{passedAB}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Cần sửa</span>
                <span className="font-bold text-amber-400">{needsImprovement}</span>
              </div>
              <div className="flex justify-between col-span-2 pt-1 border-t border-[var(--border-default)]">
                <span className="text-red-400 font-medium">🚫 Phải viết lại</span>
                <span className="font-bold text-red-400">{reworkRequired}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

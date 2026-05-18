'use client';

import React, { useState, useEffect } from 'react';

interface WorkflowLogEntry {
  id: string;
  articleId: string;
  action: string;
  fromStatus: string;
  toStatus: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  note: string | null;
  createdAt: string;
}

const ACTION_META: Record<string, { icon: string; label: string; color: string }> = {
  submit:            { icon: '📤', label: 'Nộp bài',           color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  approve:           { icon: '✅', label: 'Duyệt bài',         color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  reject:            { icon: '❌', label: 'Từ chối',            color: 'text-red-400 border-red-500/30 bg-red-500/10' },
  request_revision:  { icon: '✏️', label: 'Yêu cầu điều chỉnh', color: 'text-orange-400 border-orange-500/30 bg-orange-500/10' },
  override_approve:  { icon: '👑', label: 'HĐYK override duyệt', color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
  assign_bs:         { icon: '🩺', label: 'Phân bổ BS',         color: 'text-teal-400 border-teal-500/30 bg-teal-500/10' },
  assign_ctv:        { icon: '✍️', label: 'Phân bổ CTV',        color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  reassign_bs:       { icon: '🔄', label: 'Chuyển BS',          color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10' },
  add_cta:           { icon: '🔗', label: 'Thêm CTA',          color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' },
  publish:           { icon: '🚀', label: 'Xuất bản',           color: 'text-green-400 border-green-500/30 bg-green-500/10' },
  close:             { icon: '🔒', label: 'Đóng bài',           color: 'text-gray-400 border-gray-500/30 bg-gray-500/10' },
};

const ROLE_LABEL: Record<string, string> = {
  ctv: 'CTV',
  btv: 'BTV',
  bs: 'Bác sĩ',
  hdyk: 'HĐYK',
  lead: 'Lead',
  superadmin: 'Admin',
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Nháp',
  pending_bs_review: 'Chờ BS',
  under_review: 'Đang duyệt',
  needs_revision: 'Cần điều chỉnh',
  cta_pending: 'Chờ CTA',
  published: 'Đã xuất bản',
  closed: 'Đã đóng',
};

interface WorkflowTimelineProps {
  articleId: string;
  refreshTrigger?: number; // Increment to re-fetch
}

export default function WorkflowTimeline({ articleId, refreshTrigger }: WorkflowTimelineProps) {
  const [logs, setLogs] = useState<WorkflowLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/articles/${articleId}/workflow-logs`)
      .then(res => res.json())
      .then(data => {
        if (data.logs) setLogs(data.logs);
      })
      .catch(err => console.error('Failed to load workflow logs:', err))
      .finally(() => setLoading(false));
  }, [articleId, refreshTrigger]);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="glass-card p-4 rounded-xl">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-2"
      >
        <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
          <span className="text-[var(--lc-primary)]">📋</span> Lịch Sử Workflow
          {logs.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[var(--lc-primary)]/15 text-[var(--lc-primary)] text-[9px] font-bold">
              {logs.length}
            </span>
          )}
        </h3>
        <svg
          className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {expanded && (
        <div className="space-y-0">
          {loading && (
            <div className="flex items-center justify-center py-4">
              <div className="w-4 h-4 border-2 border-[var(--lc-primary)] border-t-transparent rounded-full animate-spin" />
              <span className="ml-2 text-[10px] text-[var(--text-muted)]">Đang tải...</span>
            </div>
          )}

          {!loading && logs.length === 0 && (
            <div className="text-center py-4">
              <span className="text-[10px] text-[var(--text-muted)]">Chưa có lịch sử workflow</span>
            </div>
          )}

          {!loading && logs.map((log, idx) => {
            const meta = ACTION_META[log.action] || { icon: '📝', label: log.action, color: 'text-gray-400 border-gray-500/30 bg-gray-500/10' };
            const isLast = idx === logs.length - 1;

            return (
              <div key={log.id} className="flex gap-2.5">
                {/* Timeline line + dot */}
                <div className="flex flex-col items-center shrink-0">
                  <div className={`w-6 h-6 rounded-full border ${meta.color} flex items-center justify-center text-[10px] shrink-0 z-10`}>
                    {meta.icon}
                  </div>
                  {!isLast && (
                    <div className="w-px flex-1 bg-[var(--border-default)] min-h-[16px]" />
                  )}
                </div>

                {/* Content */}
                <div className="pb-3 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-[var(--text-primary)]">
                      {meta.label}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-default)]">
                      {STATUS_LABEL[log.fromStatus] || log.fromStatus} → {STATUS_LABEL[log.toStatus] || log.toStatus}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[10px] text-[var(--text-secondary)]">
                      {log.actorName}
                    </span>
                    <span className="text-[9px] px-1 py-0 rounded bg-[var(--bg-card-hover)] text-[var(--text-muted)] font-medium">
                      {ROLE_LABEL[log.actorRole] || log.actorRole}
                    </span>
                  </div>

                  {log.note && (
                    <div className="mt-1 p-2 rounded bg-[var(--bg-surface)] border border-[var(--border-default)] text-[10px] text-[var(--text-secondary)] leading-relaxed">
                      💬 {log.note}
                    </div>
                  )}

                  <span className="text-[9px] text-[var(--text-muted)] mt-0.5 block">
                    {formatTime(log.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

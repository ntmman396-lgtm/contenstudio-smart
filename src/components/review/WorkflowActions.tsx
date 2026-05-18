'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { GeneratedArticle } from '@/types';

interface WorkflowActionsProps {
  article: GeneratedArticle;
  onWorkflowChange?: (newStatus: string) => void;
}

const WF_STATUS_LABEL: Record<string, { label: string; color: string; icon: string }> = {
  draft:              { label: 'Nháp',           color: 'text-gray-400 bg-gray-500/15',    icon: '📝' },
  pending_bs_review:  { label: 'Chờ phân bổ BS', color: 'text-amber-400 bg-amber-500/15',  icon: '📦' },
  under_review:       { label: 'Đang duyệt BS',  color: 'text-blue-400 bg-blue-500/15',    icon: '🔍' },
  needs_revision:     { label: 'Cần điều chỉnh',  color: 'text-orange-400 bg-orange-500/15', icon: '✏️' },
  cta_pending:        { label: 'Chờ gắn CTA',    color: 'text-cyan-400 bg-cyan-500/15',    icon: '🔗' },
  published:          { label: 'Đã xuất bản',    color: 'text-emerald-400 bg-emerald-500/15', icon: '🚀' },
  closed:             { label: 'Đã đóng',        color: 'text-gray-400 bg-gray-500/15',    icon: '🔒' },
};

export default function WorkflowActions({ article, onWorkflowChange }: WorkflowActionsProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [revisionNote, setRevisionNote] = useState('');
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const wfStatus = ((article as any).workflowStatus || 'draft') as string;
  const role = user?.role || '';
  const isBsAssigned = role === 'bs' && (article as any).assignedBsId === user?.id;
  const isManagerRole = ['hdyk', 'lead', 'superadmin'].includes(role);
  const isContentOwner =
    (role === 'ctv' && ((article as any).createdBy === user?.id || (article as any).assignedCtvId === user?.id)) ||
    (role === 'btv') ||
    isManagerRole;

  const statusMeta = WF_STATUS_LABEL[wfStatus] || { label: wfStatus, color: 'text-gray-400 bg-gray-500/15', icon: '📄' };

  const handleAction = async (action: string, extraBody?: Record<string, any>) => {
    setLoading(action);
    try {
      const res = await fetch(`/api/articles/${article.id}/workflow`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extraBody }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Lỗi: ${data.error}`);
        return;
      }
      alert(`✅ ${data.message}`);
      onWorkflowChange?.(data.workflowStatus);
      // Reset forms
      setShowRevisionForm(false);
      setShowRejectForm(false);
      setRevisionNote('');
      setRejectionReason('');
    } catch {
      alert('Lỗi kết nối');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="glass-card p-4 rounded-xl border border-[var(--lc-primary)]/20">
      <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <span className="text-[var(--lc-primary)]">⚡</span> Workflow Y Khoa
      </h3>

      {/* Current Workflow Status */}
      <div className="flex items-center gap-2 mb-4 p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)]">
        <span className="text-base">{statusMeta.icon}</span>
        <div className="flex-1">
          <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider font-medium">Trạng thái</span>
          <p className={`text-xs font-bold ${statusMeta.color.split(' ')[0]}`}>{statusMeta.label}</p>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${statusMeta.color}`}>
          {wfStatus}
        </span>
      </div>

      {/* Assigned Info */}
      <div className="space-y-1.5 mb-4 text-[11px]">
        {(article as any).assignedBsId && (
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">BS duyệt</span>
            <span className="text-teal-400 font-medium">🩺 {(article as any).assignedBsName || (article as any).assignedBsId}</span>
          </div>
        )}
        {(article as any).approvedBy && (
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Duyệt bởi</span>
            <span className="text-emerald-400 font-medium">✅ {(article as any).approvedByName || (article as any).approvedBy}</span>
          </div>
        )}
        {(article as any).revisionCount > 0 && (
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Lần chỉnh sửa</span>
            <span className="text-orange-400 font-bold">#{(article as any).revisionCount}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">

        {/* ─── BS Actions: Duyệt / Điều chỉnh / Từ chối ─── */}
        {isBsAssigned && wfStatus === 'under_review' && (
          <>
            <button
              onClick={() => handleAction('approve')}
              disabled={!!loading}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading === 'approve' ? '⏳ Đang xử lý...' : '✅ Duyệt Bài Viết'}
            </button>

            {/* Request Revision */}
            {!showRevisionForm ? (
              <button
                onClick={() => { setShowRevisionForm(true); setShowRejectForm(false); }}
                disabled={!!loading}
                className="w-full py-2 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                ✏️ Yêu Cầu Điều Chỉnh
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/30 space-y-2">
                <label className="text-[10px] font-bold text-amber-400">Ghi chú điều chỉnh cho CTV:</label>
                <textarea
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  className="w-full input-field text-xs resize-none"
                  rows={3}
                  placeholder="Mô tả chi tiết phần cần CTV điều chỉnh..."
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!revisionNote.trim()) { alert('Vui lòng nhập ghi chú điều chỉnh'); return; }
                      handleAction('request_revision', {
                        rejectionReason: revisionNote,
                        inlineComments: [{ note: revisionNote }],
                        revisionChecklist: [{ item: revisionNote, done: false }],
                      });
                    }}
                    disabled={!!loading}
                    className="flex-1 py-1.5 rounded-lg text-[10px] font-bold bg-amber-500 text-white hover:bg-amber-400 transition-colors disabled:opacity-50"
                  >
                    {loading === 'request_revision' ? '⏳...' : '📤 Gửi Yêu Cầu'}
                  </button>
                  <button
                    onClick={() => { setShowRevisionForm(false); setRevisionNote(''); }}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-default)]"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}

            {/* Reject */}
            {!showRejectForm ? (
              <button
                onClick={() => { setShowRejectForm(true); setShowRevisionForm(false); }}
                disabled={!!loading}
                className="w-full py-2 rounded-xl text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                ❌ Từ Chối Bài
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/30 space-y-2">
                <label className="text-[10px] font-bold text-red-400">Lý do từ chối (bắt buộc):</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full input-field text-xs resize-none"
                  rows={3}
                  placeholder="Lý do từ chối bài viết..."
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!rejectionReason.trim()) { alert('Vui lòng nhập lý do từ chối'); return; }
                      handleAction('reject', {
                        rejectionReason,
                        inlineComments: [{ note: rejectionReason }],
                        revisionChecklist: [{ item: rejectionReason, done: false }],
                      });
                    }}
                    disabled={!!loading}
                    className="flex-1 py-1.5 rounded-lg text-[10px] font-bold bg-red-500 text-white hover:bg-red-400 transition-colors disabled:opacity-50"
                  >
                    {loading === 'reject' ? '⏳...' : '❌ Xác Nhận Từ Chối'}
                  </button>
                  <button
                    onClick={() => { setShowRejectForm(false); setRejectionReason(''); }}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-default)]"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ─── HĐYK Override ─── */}
        {isManagerRole && ['under_review', 'pending_bs_review', 'needs_revision'].includes(wfStatus) && (
          <button
            onClick={() => handleAction('override_approve')}
            disabled={!!loading}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 border border-purple-500/30 disabled:opacity-50"
          >
            {loading === 'override_approve' ? '⏳ Đang xử lý...' : '👑 Phê Duyệt Vượt Cấp (HĐYK)'}
          </button>
        )}

        {/* ─── CTV/BTV Submit (from draft/needs_revision) ─── */}
        {isContentOwner && ['draft', 'needs_revision'].includes(wfStatus) && (
          <button
            onClick={() => handleAction('submit')}
            disabled={!!loading}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white transition-all shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading === 'submit' ? '⏳ Đang nộp...' : '📤 Nộp Bài Duyệt Y Khoa'}
          </button>
        )}

        {/* ─── CTV Publish (from cta_pending) ─── */}
        {isContentOwner && wfStatus === 'cta_pending' && (
          <button
            onClick={() => handleAction('publish')}
            disabled={!!loading}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white transition-all shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading === 'publish' ? '⏳ Đang xuất bản...' : '🚀 Xuất Bản'}
          </button>
        )}

        {/* Rejection note display */}
        {wfStatus === 'needs_revision' && (article as any).rejectionReason && (
          <div className="mt-2 p-3 rounded-xl bg-orange-500/5 border border-orange-500/20">
            <p className="text-[10px] font-bold text-orange-400 mb-1">💬 Ghi chú từ BS:</p>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              {(article as any).rejectionReason}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

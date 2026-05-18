'use client';

import React, { useState } from 'react';
import { GeneratedArticle, StrapiArticleFields } from '@/types';
import { toStrapiPreview } from '@/lib/strapi';
import { ImageDropZone, RichTextEditor, Toggle } from '../DetailShared';
import QcScoreCard from '../QcScoreCard';
import QcContentPanel from '../QcContentPanel';
import AIFactCheckPanel from '../AIFactCheckPanel';
import CitationBadges from '../CitationBadges';
import WorkflowTimeline from '../WorkflowTimeline';
import WorkflowActions from '../WorkflowActions';
import ExportDocxButton from '../ExportDocxButton';

interface LayoutProps {
  article: GeneratedArticle;
  onSave: (article: GeneratedArticle, fields: StrapiArticleFields) => void;
  onPublish: (article: GeneratedArticle, fields: StrapiArticleFields) => void;
  onBack: () => void;
  onSoftUpdate?: (article: GeneratedArticle) => void;
}

export default function DuocChatDetail({ article, onSave, onPublish, onBack, onSoftUpdate }: LayoutProps) {
  const [fields, setFields] = useState<StrapiArticleFields>(() => toStrapiPreview(article));
  const [isDirty, setIsDirty] = useState(false);

  const updateField = <K extends keyof StrapiArticleFields>(key: K, value: StrapiArticleFields[K]) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const insertWarningBlock = () => {
    const html = `
      <div style="background-color: #fffbeb; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 16px 0;">
        <h4 style="color: #b45309; margin: 0 0 8px 0;">⚠️ CHÚ Ý QUAN TRỌNG</h4>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #78350f;">
          <li>Tuân thủ đúng chỉ định và liều dùng của bác sĩ.</li>
          <li>Đọc kỹ hướng dẫn sử dụng trước khi dùng.</li>
        </ul>
      </div>
    `;
    updateField('moTa', fields.moTa + html);
  };

  const insertSideEffectList = () => {
    const html = `
      <div style="margin: 16px 0; font-size: 14px;">
        <p><strong>Thường gặp (>1/100):</strong> Đau đầu, chóng mặt, buồn nôn.</p>
        <p><strong>Ít gặp (1/1000 - 1/100):</strong> Rối loạn tiêu hóa, mẩn ngứa.</p>
        <p><strong>Hiếm gặp (<1/1000):</strong> Sốc phản vệ (cần cấp cứu ngay).</p>
      </div>
    `;
    updateField('moTa', fields.moTa + html);
  };

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-[var(--bg-primary)]">
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Back
          </button>
          <div className="flex items-center gap-3">
            <button onClick={() => onPublish(article, fields)} className="px-5 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-[var(--text-primary)] transition-all shadow-lg shadow-blue-600/20">Publish</button>
            <button onClick={() => onSave({ ...article, title: fields.tenBaiViet, content: fields.moTa, sapo: fields.moTaNgan, category: fields.danhMucBaiViet, tags: fields.tags }, fields)} className="px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-[var(--text-primary)] transition-all shadow-lg shadow-emerald-600/20">Save</button>
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Dược Chất (Hoạt Chất) Layout</h1>
          <p className="text-xs text-[var(--text-muted)]">API ID : health-article</p>
        </div>

        <div className="flex gap-6">
          <div className="flex-1 space-y-6">
            <div className="glass-card p-5 rounded-xl space-y-5">
              <div className="space-y-1.5"><label className="text-xs font-semibold text-[var(--text-primary)]">Tên Hoạt Chất*</label><input type="text" value={fields.tenBaiViet} onChange={(e) => updateField('tenBaiViet', e.target.value)} className="input-field text-sm" /></div>
              <div className="space-y-1.5"><label className="text-xs font-semibold text-[var(--text-primary)]">Slug* ID</label><input type="text" value={`bai-viet/${fields.slug}.html`} className="input-field text-sm flex-1 text-[var(--text-muted)]" readOnly /></div>
            </div>

            <div className="glass-card p-5 rounded-xl">
              <div className="space-y-1.5"><label className="text-xs font-semibold text-[var(--text-primary)]">Danh Mục Bài Viết*</label><div className="relative"><select value={fields.danhMucBaiViet} onChange={(e) => updateField('danhMucBaiViet', e.target.value)} className="input-field text-sm w-full appearance-none cursor-pointer"><option value="Dược chất">Dược chất</option></select></div></div>
            </div>

            {/* Dược chất content is usually very text heavy on warnings and lists */}
            <div className="glass-card p-5 rounded-xl border border-amber-500/20">
              <RichTextEditor label="Cơ Chế & Công Dụng & Liều Dùng" value={fields.moTa} onChange={(v) => updateField('moTa', v)} wordCount>
                <button onClick={insertWarningBlock} className="shrink-0 px-2 py-0.5 text-xs text-amber-500 bg-amber-500/10 rounded font-medium hover:bg-amber-500/20 transition-colors">⚠️ Chú ý quan trọng</button>
                <button onClick={insertSideEffectList} className="shrink-0 px-2 py-0.5 text-xs text-emerald-500 bg-emerald-500/10 rounded font-medium hover:bg-emerald-500/20 transition-colors">📋 DS Tác dụng phụ</button>
              </RichTextEditor>
            </div>

            <div className="glass-card p-5 rounded-xl">
              <div className="grid grid-cols-2 gap-4">
                <ImageDropZone label="Ảnh Chính*" value={fields.anhChinh} onChange={(url) => updateField('anhChinh', url)} />
              </div>
            </div>

            <div className="glass-card p-5 rounded-xl">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-primary)]">Mô Tả Ngắn</label>
                <textarea value={fields.moTaNgan} onChange={(e) => updateField('moTaNgan', e.target.value)} className="input-field text-sm resize-none" rows={3} maxLength={300} />
              </div>
            </div>

            <div className="glass-card p-5 rounded-xl">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2"><label className="text-xs font-semibold text-[var(--text-primary)]">Bài Viết Nổi Bật</label><Toggle value={fields.baiVietNoiBat} onChange={(v) => updateField('baiVietNoiBat', v)} /></div>
                <div className="space-y-2"><label className="text-xs font-semibold text-[var(--text-primary)]">Duyệt Bài</label><Toggle value={fields.duyetBai} onChange={(v) => updateField('duyetBai', v)} /></div>
              </div>
            </div>
            
            <div className="glass-card p-5 rounded-xl">
              <RichTextEditor label="Nguồn Tham Khảo (Dược thư FDA/EMA)" value={fields.nguonThamKhao} onChange={(v) => updateField('nguonThamKhao', v)} />
            </div>
          </div>

          <div className="w-[300px] shrink-0 space-y-4 sticky top-6 self-start max-h-[calc(100vh-48px)] overflow-y-auto hidden-scrollbar pb-6 rounded-xl">
            {/* Workflow Y Khoa Actions */}
            <WorkflowActions article={article} />

            <div className="glass-card p-4 rounded-xl border border-amber-500/20 space-y-3">
               <div className="flex items-center gap-2 mb-3">
                 <div className="w-2 h-2 rounded-full bg-amber-400" />
                 <span className="text-xs font-bold text-amber-500">{isDirty ? 'Editing draft version' : 'Draft saved'}</span>
               </div>
               <button onClick={() => onPublish(article, fields)} className="w-full bg-amber-600 hover:bg-amber-500 text-[var(--text-primary)] rounded-lg text-xs py-2.5 font-bold transition-colors">🚀 Sync Knowledge Base</button>
               <ExportDocxButton articleId={article.id} articleTitle={article.title} />
            </div>
            
            <div className="glass-card p-4 rounded-xl">
              <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Information</h3>
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Template</span>
                  <span className="text-[var(--text-secondary)] font-medium">Dược Chất (FDA/EMA)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Created</span>
                  <span className="text-[var(--text-secondary)]">{article.createdAt}</span>
                </div>
                {(article as any).createdByName && (
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Người tạo</span>
                    <span className="text-purple-400 font-medium">✍️ {(article as any).createdByName}</span>
                  </div>
                )}
              </div>
              <CitationBadges article={article} />
            </div>
            
            <QcScoreCard article={article} />

            {/* Workflow Timeline */}
            <WorkflowTimeline articleId={article.id} />

            <QcContentPanel 
               article={article} 
               onQcComplete={onSoftUpdate ? (_res: any, updated: GeneratedArticle) => onSoftUpdate(updated) : undefined} 
            />

            <AIFactCheckPanel article={article} />
          </div>
        </div>
      </div>
    </div>
  );
}

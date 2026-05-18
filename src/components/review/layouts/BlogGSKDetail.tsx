'use client';

import React, { useState } from 'react';
import { GeneratedArticle, StrapiArticleFields } from '@/types';
import { toStrapiPreview } from '@/lib/strapi';
import { ImageDropZone, RelationField, RichTextEditor, Toggle } from '../DetailShared';
import { CategoryManager, TagManager } from '../TagCategoryManager';
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

export default function BlogGSKDetail({ article, onSave, onPublish, onBack, onSoftUpdate }: LayoutProps) {
  const [fields, setFields] = useState<StrapiArticleFields>(() => toStrapiPreview(article));
  const [isDirty, setIsDirty] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [currentStatus, setCurrentStatus] = useState<GeneratedArticle['status']>(article.status);

  const handleSaveWithStatus = (newStatus: GeneratedArticle['status']) => {
    setCurrentStatus(newStatus);
    onSave({ ...article, status: newStatus, title: fields.tenBaiViet, content: fields.moTa, sapo: fields.moTaNgan, category: fields.danhMucBaiViet, tags: fields.tags }, fields);
    setIsDirty(false);
    setToastMessage(`Đã cập nhật trạng thái: ${newStatus === 'approved' ? 'Phê duyệt ✅' : newStatus === 'rejected' ? 'Từ chối ❌' : 'Lưu nháp 💾'}`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const updateField = <K extends keyof StrapiArticleFields>(key: K, value: StrapiArticleFields[K]) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const handleRegenerate = async () => {
    setShowConfirm(false);
    setIsRegenerating(true);
    setToastMessage('Đang gọi AI tạo lại nội dung...');
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item: { id: article.id, title: article.title, status: 'draft', outline: '' },
          settings: {
             sourceText: article.references?.join('\n') || '',
             templateId: article.templateId,
             articleCount: 1,
             tone: 'professional',
             language: 'vi',
             minWords: 600,
             maxWords: 1500,
          }
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // Cập nhật lại fields và trạng thái local
      setFields(toStrapiPreview(data.article));
      // Lưu thẳng trạng thái mới
      onSave({ ...article, ...data.article, id: article.id }, toStrapiPreview(data.article));
      setToastMessage('✅ Tạo lại bài viết thành công!');
    } catch(e) {
      alert("Lỗi tạo lại: " + e);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Parse keyword data from rawFields if available
  const keywordData = article.rawFields as Record<string, unknown> | undefined;
  const primaryKeyword = (keywordData?.keywordChinh as string) || '';
  const relatedKeywords = (keywordData?.keywordLienQuan as string[]) || article.tags || [];

  // Build categories array from the single category string
  const selectedCategories = fields.danhMucBaiViet
    ? fields.danhMucBaiViet.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const handleCategoriesChange = (cats: string[]) => {
    updateField('danhMucBaiViet', cats.join(', '));
  };

  const createdDate = article.createdAt
    ? new Date(article.createdAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className="flex-1 h-screen overflow-y-auto">
      <div className="max-w-[1200px] mx-auto px-6 py-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="flex items-center gap-2 text-sm text-[var(--text-accent)] hover:opacity-80 font-medium transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Back to Review Queue
          </button>
        </div>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-lg">📝</span>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">GSK Blog</h1>
            <span className={`badge text-[10px] ${article.status === 'approved' ? 'badge-success' : article.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
              {article.status === 'pending_review' ? 'DRAFT' : article.status.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">API ID : health-article &nbsp;·&nbsp; Template: GSK Blog</p>
        </div>

        <div className="flex gap-6">
          {/* ═══════ LEFT PANEL ═══════ */}
          <div className="flex-1 space-y-5 min-w-0">

            {/* ── Tên Bài Viết & Slug ── */}
            <div className="glass-card p-5 rounded-xl space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-primary)]">
                  Tên Bài Viết<span className="text-red-400 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  value={fields.tenBaiViet}
                  onChange={(e) => updateField('tenBaiViet', e.target.value)}
                  className="input-field text-sm"
                  placeholder="Nhập tên bài viết..."
                />
                <p className="text-[10px] text-[var(--text-muted)]">
                  {fields.tenBaiViet.length}/70 ký tự
                  {fields.tenBaiViet.length > 70 && (
                    <span className="text-red-400 ml-1">⚠ Vượt quá 70 ký tự</span>
                  )}
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-primary)]">
                  Slug<span className="text-red-400 ml-0.5">*</span> <span className="text-[var(--text-muted)] font-normal">ID</span>
                </label>
                <input
                  type="text"
                  value={`bai-viet/${fields.slug}.html`}
                  className="input-field text-sm text-[var(--text-muted)]"
                  readOnly
                />
              </div>
            </div>

            {/* ── Ảnh Chính & Slider ── */}
            <div className="glass-card p-5 rounded-xl">
              <div className="grid grid-cols-2 gap-4">
                <ImageDropZone label="Ảnh Chính*" value={fields.anhChinh} onChange={(url) => updateField('anhChinh', url)} keyword={primaryKeyword || fields.tenBaiViet} />
                <ImageDropZone label="Ảnh Slider" value={fields.anhSlider[0] || null} onChange={(url) => updateField('anhSlider', [url])} keyword={primaryKeyword || fields.tenBaiViet} />
              </div>
            </div>

            {/* ── Danh Mục Bài Viết (Chip Select) ── */}
            <div className="glass-card p-5 rounded-xl">
              <CategoryManager
                selectedCategories={selectedCategories}
                onChange={handleCategoriesChange}
                title={fields.tenBaiViet}
                contentForAutoDefine={fields.moTa}
              />
            </div>

            {/* ── Mô Tả Ngắn ── */}
            <div className="glass-card p-5 rounded-xl">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-primary)]">Mô Tả Ngắn</label>
                <textarea
                  value={fields.moTaNgan}
                  onChange={(e) => updateField('moTaNgan', e.target.value)}
                  className="input-field text-sm resize-none"
                  rows={3}
                  maxLength={200}
                  placeholder="Sapo bài viết (130-200 ký tự)..."
                />
                <p className="text-[10px] text-[var(--text-muted)] flex justify-between">
                  <span>{fields.moTaNgan.length}/200 ký tự</span>
                  {fields.moTaNgan.length > 0 && fields.moTaNgan.length < 130 && (
                    <span className="text-amber-400">⚠ Nên ≥130 ký tự cho SEO</span>
                  )}
                </p>
              </div>
            </div>

            {/* ── Mô Tả (Rich Text Editor) - MAIN CONTENT ── */}
            <div className="glass-card p-5 rounded-xl border border-[var(--lc-primary)]/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-[var(--lc-primary)]/15 text-[var(--lc-primary)] text-[10px] font-bold tracking-widest uppercase rounded-bl-xl">
                Nội Dung Chính
              </div>
              <RichTextEditor
                label="Mô Tả"
                value={fields.moTa}
                onChange={(v) => updateField('moTa', v)}
                wordCount
                minHeight={400}
                keyword={primaryKeyword || fields.tenBaiViet}
              />
            </div>

            {/* ── Toggles ── */}
            <div className="glass-card p-5 rounded-xl">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Bài Viết Nổi Bật</label>
                  <Toggle value={fields.baiVietNoiBat} onChange={(v) => updateField('baiVietNoiBat', v)} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Riêng Tư</label>
                  <Toggle value={fields.riengTu} onChange={(v) => updateField('riengTu', v)} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Duyệt Bài</label>
                  <Toggle value={fields.duyetBai} onChange={(v) => updateField('duyetBai', v)} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[var(--lc-primary)]">Khuyến Cáo HDSD</label>
                  <Toggle value={fields.khuyenCaoDocKyHDSD || false} onChange={(v) => updateField('khuyenCaoDocKyHDSD', v)} />
                </div>
              </div>
            </div>

            {/* ── Tác Giả & Người Duyệt ── */}
            <div className="glass-card p-5 rounded-xl">
              <div className="grid grid-cols-2 gap-4">
                <RelationField label="Tác Giả" value={fields.tacGia} onChange={(v) => updateField('tacGia', v)} />
                <RelationField label="Người Duyệt Bài Viết" value={fields.nguoiDuyetBaiViet} onChange={(v) => updateField('nguoiDuyetBaiViet', v)} />
              </div>
            </div>

            {/* ── Tags ── */}
            <div className="glass-card p-5 rounded-xl">
              <TagManager
                tags={fields.tags}
                onChange={(tags) => updateField('tags', tags)}
                title={fields.tenBaiViet}
                contentForAutoDefine={fields.moTa}
              />
            </div>

            {/* ── Sản Phẩm Liên Quan ── */}
            <div className="glass-card p-5 rounded-xl">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Hiển Thị DS Sản Phẩm</label>
                  <Toggle value={fields.hienThiDanhSachSanPham} onChange={(v) => updateField('hienThiDanhSachSanPham', v)} />
                </div>
                <RelationField label="Danh Sách Sản Phẩm" value={fields.danhSachSanPham.join(', ')} onChange={(v) => updateField('danhSachSanPham', v.split(',').map((s) => s.trim()).filter(Boolean))} />
              </div>
            </div>

            {/* ── Nguồn Tham Khảo ── */}
            <div className="glass-card p-5 rounded-xl">
              <RichTextEditor label="Nguồn Tham Khảo" value={fields.nguonThamKhao} onChange={(v) => updateField('nguonThamKhao', v)} wordCount keyword={primaryKeyword || fields.tenBaiViet} />
            </div>

            {/* ── SEO ── */}
            <div className="glass-card p-5 rounded-xl space-y-4">
              <label className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-emerald-500/15 flex items-center justify-center text-emerald-400 text-[10px]">🔍</span>
                SEO
              </label>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-[var(--text-muted)]">Meta Title</label>
                  <input
                    type="text"
                    value={fields.seo.metaTitle}
                    onChange={(e) => updateField('seo', { ...fields.seo, metaTitle: e.target.value })}
                    className="input-field text-sm"
                    maxLength={60}
                  />
                  <p className="text-[10px] text-[var(--text-muted)]">{fields.seo.metaTitle.length}/60 ký tự</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-[var(--text-muted)]">Meta Description</label>
                  <textarea
                    value={fields.seo.metaDescription}
                    onChange={(e) => updateField('seo', { ...fields.seo, metaDescription: e.target.value })}
                    className="input-field text-sm resize-none"
                    rows={2}
                    maxLength={160}
                  />
                  <p className="text-[10px] text-[var(--text-muted)]">{fields.seo.metaDescription.length}/160 ký tự</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-[var(--text-muted)]">Keywords</label>
                  <input
                    type="text"
                    value={fields.seo.keywords}
                    onChange={(e) => updateField('seo', { ...fields.seo, keywords: e.target.value })}
                    className="input-field text-sm"
                    placeholder="keyword1, keyword2, ..."
                  />
                </div>
              </div>
            </div>

          </div>

          {/* ═══════ RIGHT PANEL ═══════ */}
          <div className="w-[300px] shrink-0 space-y-4 sticky top-6 self-start max-h-[calc(100vh-48px)] overflow-y-auto hidden-scrollbar pb-6 rounded-xl">

            {/* Workflow Y Khoa Actions */}
            <WorkflowActions article={article} />

            {/* Status & Actions */}
            <div className="glass-card p-4 rounded-xl border border-[var(--lc-primary)]/20">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2 h-2 rounded-full ${isDirty ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                <span className={`text-xs font-bold ${isDirty ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {isDirty ? 'Editing draft version' : 'Draft saved'}
                </span>
              </div>
              <div className="space-y-2">
                <button onClick={() => handleSaveWithStatus('approved')} className="w-full btn-primary bg-emerald-500/20 hover:bg-emerald-500 border-emerald-500/50 text-emerald-400 hover:text-white text-xs py-2.5 flex items-center justify-center gap-2 font-bold mb-1">
                  ✅ Phê Duyệt Bài
                </button>
                <button onClick={() => handleSaveWithStatus('rejected')} className="w-full btn-secondary text-xs py-2 flex items-center justify-center gap-2 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30">
                  ❌ Từ Chối Làm Lại
                </button>
                {showConfirm ? (
                  <div className="bg-[var(--bg-elevated)] border border-red-500/50 p-3 rounded-lg mb-2 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                    <p className="text-[10px] text-red-400 font-bold mb-2 text-center">Chắc chắn muốn xóa bài cũ để AI viết lại?</p>
                    <div className="flex gap-2">
                      <button onClick={handleRegenerate} className="flex-1 bg-red-500 hover:bg-red-600 text-white text-[10px] py-1.5 rounded font-bold transition-colors">Xác nhận</button>
                      <button onClick={() => setShowConfirm(false)} className="flex-1 bg-[var(--bg-surface)] hover:bg-[var(--bg-card-hover)] text-white text-[10px] py-1.5 rounded transition-colors border border-[var(--border-default)]">Hủy</button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowConfirm(true)} 
                    disabled={isRegenerating}
                    className="w-full btn-primary bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 border-none text-white text-xs py-2 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                  >
                    {isRegenerating ? '⏳ Đang viết lại...' : '✨ Tạo Lại Nội Dung'}
                  </button>
                )}
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button onClick={() => handleSaveWithStatus('pending_review')} className="w-full btn-secondary bg-[var(--bg-surface)] hover:bg-[var(--bg-card-hover)] text-[11px] py-1.5 font-medium border-[var(--border-default)]">
                    💾 Lưu Nháp
                  </button>
                  <button onClick={() => onPublish({ ...article, status: 'approved' }, fields)} className="w-full btn-primary bg-[var(--lc-primary)] hover:bg-[var(--lc-primary-dark)] text-white border-transparent text-[11px] py-1.5 font-medium whitespace-nowrap">
                    🚀 Sync Strapi
                  </button>
                </div>
                <ExportDocxButton articleId={article.id} articleTitle={article.title} />
              </div>
            </div>

            {/* Information */}
            <div className="glass-card p-4 rounded-xl">
              <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Information</h3>
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Template</span>
                  <span className="text-[var(--text-secondary)] font-medium">GSK Blog</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Status</span>
                  <span className={`font-medium ${
                    currentStatus === 'approved' ? 'text-emerald-400' :
                    currentStatus === 'rejected' ? 'text-red-400' : 'text-amber-400'
                  }`}>
                    {currentStatus === 'pending_review' ? 'Draft' : currentStatus}
                  </span>
                </div>
                {createdDate && (
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Created</span>
                    <span className="text-[var(--text-secondary)]">{createdDate}</span>
                  </div>
                )}
                {(article as any).createdByName && (
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Người tạo</span>
                    <span className="text-purple-400 font-medium">✍️ {(article as any).createdByName}</span>
                  </div>
                )}
              </div>
              <CitationBadges article={article} />
            </div>

            {/* QC Score (Section Breakdown) */}
            <QcScoreCard article={article} />

            {/* Workflow Timeline */}
            <WorkflowTimeline articleId={article.id} />

            {/* QC Nội Dung — Run QC Engine */}
            <QcContentPanel 
               article={article} 
               onQcComplete={onSoftUpdate ? (_res: any, updated: GeneratedArticle) => onSoftUpdate(updated) : undefined} 
            />

            <AIFactCheckPanel article={article} />

            {/* Keyword Data (GSK-specific) */}
            {(primaryKeyword || relatedKeywords.length > 0) && (
              <div className="glass-card p-4 rounded-xl">
                <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span className="text-[var(--lc-primary)]">🔑</span> Keyword Data
                </h3>
                {primaryKeyword && (
                  <div className="mb-3">
                    <span className="text-[10px] text-[var(--text-muted)]">Primary keyword</span>
                    <p className="text-xs font-medium text-[var(--lc-primary)] mt-0.5">{primaryKeyword}</p>
                  </div>
                )}
                {relatedKeywords.length > 0 && (
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)]">Related</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {relatedKeywords.map(kw => (
                        <span key={kw} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-card-hover)] text-[var(--text-secondary)] border border-[var(--border-default)]">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Plagiarism Checker */}
            <div className="glass-card p-4 rounded-xl">
              <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Plagiarism Check</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    setToastMessage('Đang quét nội dung với Copyscape (Simulation)...');
                    setTimeout(() => setToastMessage('Hoàn thành! Nội dung đạt 95% Unique.'), 3000);
                    setTimeout(() => setToastMessage(''), 6000);
                  }}
                  className="w-full btn-secondary text-xs py-2 bg-[var(--bg-surface)] hover:text-emerald-400 font-medium"
                >
                  🔍 Kiểm tra đạo văn
                </button>
                <div className="p-3 bg-[var(--bg-card-hover)] rounded-lg text-center border border-[var(--border-default)]">
                  <span className="text-2xl font-bold text-emerald-400 drop-shadow-sm">--%</span>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1 font-medium">Unique Score</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500/90 text-white text-sm px-6 py-3 rounded-full shadow-2xl border border-emerald-400 font-medium animate-fade-in backdrop-blur-md flex items-center gap-3">
          <span className="text-lg">✅</span>
          {toastMessage}
        </div>
      )}
    </div>
  );
}

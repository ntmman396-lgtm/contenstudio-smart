'use client';

import React, { useState } from 'react';
import { StrapiArticleFields, GeneratedArticle } from '@/types';
import { toStrapiPreview } from '@/lib/strapi';

import BlogGSKDetail from './layouts/BlogGSKDetail';
import BenhLyDetail from './layouts/BenhLyDetail';
import DuocChatDetail from './layouts/DuocChatDetail';
import HoiDapBacSiDetail from './layouts/HoiDapBacSiDetail';
import { ImageDropZone, RelationField, RichTextEditor, Toggle } from './DetailShared';
import QcScoreCard from './QcScoreCard';
import QcContentPanel from './QcContentPanel';
import AIFactCheckPanel from './AIFactCheckPanel';
import CitationBadges from './CitationBadges';
import WorkflowTimeline from './WorkflowTimeline';
import WorkflowActions from './WorkflowActions';
import ExportDocxButton from './ExportDocxButton';

interface ArticleDetailProps {
  article: GeneratedArticle;
  onSave: (article: GeneratedArticle, fields: StrapiArticleFields) => void;
  onPublish: (article: GeneratedArticle, fields: StrapiArticleFields) => void;
  onBack: () => void;
  onSoftUpdate?: (article: GeneratedArticle) => void;
}

// ─── Router Component ───────────────────────────────────────

export default function ArticleDetail(props: ArticleDetailProps) {
  const { article } = props;

  if (article.templateId === 'gsk-blog') {
    return <BlogGSKDetail {...props} />;
  }
  if (article.templateId === 'benh-ly') {
    return <BenhLyDetail {...props} />;
  }
  if (article.templateId === 'duoc-chat') {
    return <DuocChatDetail {...props} />;
  }
  if (article.templateId === 'hoi-dap-bac-si') {
    return <HoiDapBacSiDetail {...props} />;
  }

  // Fallback to Generic layout
  return <GenericDetail {...props} />;
}

// ─── Generic Layout (for other templates) ───────────────────

function GenericDetail({ article, onSave, onPublish, onBack, onSoftUpdate }: ArticleDetailProps) {
  const [fields, setFields] = useState<StrapiArticleFields>(() => toStrapiPreview(article));
  const [isDirty, setIsDirty] = useState(false);

  const updateField = <K extends keyof StrapiArticleFields>(key: K, value: StrapiArticleFields[K]) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  return (
    <div className="flex-1 h-screen overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Back
          </button>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn đồng bộ và xuất bản bài viết này lên Strapi?')) {
                  onPublish(article, fields);
                }
              }} 
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-[var(--text-primary)] transition-all shadow-lg shadow-blue-600/20"
            >
              Publish
            </button>
            <button onClick={() => { onSave({ ...article, content: fields.moTa, title: fields.tenBaiViet, sapo: fields.moTaNgan, category: fields.danhMucBaiViet, tags: fields.tags }, fields); setIsDirty(false); }} className="px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-[var(--text-primary)] transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2">
              💾 Lưu Nháp
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">{article.status === 'pending_review' ? 'Edit entry' : 'Create an entry'}</h1>
          <p className="text-xs text-[var(--text-muted)]">API ID : health-article</p>
        </div>

        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 space-y-6">
            <div className="glass-card p-5 rounded-xl space-y-5">
              <div className="space-y-1.5"><label className="text-xs font-semibold text-[var(--text-primary)]">Tên Bài Viết*</label><input type="text" value={fields.tenBaiViet} onChange={(e) => updateField('tenBaiViet', e.target.value)} className="input-field text-sm" /></div>
              <div className="space-y-1.5"><label className="text-xs font-semibold text-[var(--text-primary)]">Slug* ID</label><input type="text" value={`bai-viet/${fields.slug}.html`} className="input-field text-sm flex-1 text-[var(--text-muted)]" readOnly /></div>
            </div>

            <div className="glass-card p-5 rounded-xl">
               <div className="grid grid-cols-2 gap-4">
                 <ImageDropZone label="Ảnh Chính*" value={fields.anhChinh} onChange={(url) => updateField('anhChinh', url)} />
                 <ImageDropZone label="Ảnh Slider" value={fields.anhSlider[0] || null} onChange={(url) => updateField('anhSlider', [url])} />
               </div>
            </div>

            <div className="glass-card p-5 rounded-xl">
              <div className="space-y-1.5"><label className="text-xs font-semibold text-[var(--text-primary)]">Danh Mục Bài Viết*</label><div className="relative"><select value={fields.danhMucBaiViet} onChange={(e) => updateField('danhMucBaiViet', e.target.value)} className="input-field text-sm w-full appearance-none cursor-pointer"><option value="">Choose health category</option><option value="Bệnh lý">Bệnh lý</option><option value="Dược liệu">Dược liệu</option><option value="Thuốc">Thuốc</option><option value="TPCN">TPCN</option><option value="Vắc xin">Vắc xin</option><option value="Dược chất">Dược chất</option><option value="Sức khỏe">Sức khỏe tổng hợp</option></select><svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg></div></div>
            </div>

            <div className="glass-card p-5 rounded-xl">
              <div className="space-y-1.5"><label className="text-xs font-semibold text-[var(--text-primary)]">Mô Tả Ngắn</label><textarea value={fields.moTaNgan} onChange={(e) => updateField('moTaNgan', e.target.value)} className="input-field text-sm resize-none" rows={3} maxLength={300} /></div>
            </div>

            <div className="glass-card p-5 rounded-xl">
              <RichTextEditor label="Mô Tả" value={fields.moTa} onChange={(v) => updateField('moTa', v)} wordCount />
            </div>

            <div className="glass-card p-5 rounded-xl">
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2"><label className="text-xs font-semibold text-[var(--text-primary)]">Bài Viết Nổi Bật</label><Toggle value={fields.baiVietNoiBat} onChange={(v) => updateField('baiVietNoiBat', v)} /></div>
                <div className="space-y-2"><label className="text-xs font-semibold text-[var(--text-primary)]">Riêng Tư</label><Toggle value={fields.riengTu} onChange={(v) => updateField('riengTu', v)} /></div>
                <div className="space-y-2"><label className="text-xs font-semibold text-[var(--text-primary)]">Duyệt Bài</label><Toggle value={fields.duyetBai} onChange={(v) => updateField('duyetBai', v)} /></div>
              </div>
            </div>

            <div className="glass-card p-5 rounded-xl">
              <div className="grid grid-cols-2 gap-4">
                <RelationField label="Tác Giả" value={fields.tacGia} onChange={(v) => updateField('tacGia', v)} />
                <RelationField label="Người Duyệt Bài Viết" value={fields.nguoiDuyetBaiViet} onChange={(v) => updateField('nguoiDuyetBaiViet', v)} />
              </div>
            </div>

            <div className="glass-card p-5 rounded-xl">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Tags</label>
                  <div className="input-field text-sm flex flex-wrap gap-1.5 min-h-[40px] items-center">
                    {fields.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/15 text-blue-400 flex items-center gap-1">{tag}<button onClick={() => updateField('tags', fields.tags.filter((t) => t !== tag))} className="text-blue-400/60 hover:text-blue-300">×</button></span>
                    ))}
                    <input type="text" className="bg-transparent border-none outline-none text-xs text-[var(--text-secondary)] flex-1 min-w-[80px]" placeholder="Add tag..." onKeyDown={(e) => { if (e.key === 'Enter' && e.currentTarget.value) { updateField('tags', [...fields.tags, e.currentTarget.value]); e.currentTarget.value = ''; } }} />
                  </div>
                </div>
                <div className="space-y-1.5"><label className="text-xs font-semibold text-[var(--text-primary)]">Link Chuyên Hướng</label><input type="text" value={fields.linkChuyenHuong} onChange={(e) => updateField('linkChuyenHuong', e.target.value)} className="input-field text-sm" /></div>
              </div>
            </div>

            <div className="glass-card p-5 rounded-xl">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-xs font-semibold text-[var(--text-primary)]">Hiển Thị DS Sản Phẩm</label><Toggle value={fields.hienThiDanhSachSanPham} onChange={(v) => updateField('hienThiDanhSachSanPham', v)} /></div>
                <RelationField label="Danh Sách Sản Phẩm" value={fields.danhSachSanPham.join(', ')} onChange={(v) => updateField('danhSachSanPham', v.split(',').map((s) => s.trim()).filter(Boolean))} />
              </div>
            </div>

            <div className="glass-card p-5 rounded-xl">
              <div className="space-y-2"><label className="text-xs font-semibold text-[var(--text-primary)]">Bật Chỉ Đề Long-Form*</label><Toggle value={fields.batChiDeLongForm} onChange={(v) => updateField('batChiDeLongForm', v)} /></div>
            </div>

            <div className="glass-card p-5 rounded-xl">
              <RichTextEditor label="Nguồn Tham Khảo" value={fields.nguonThamKhao} onChange={(v) => updateField('nguonThamKhao', v)} wordCount />
            </div>

            <div className="glass-card p-5 rounded-xl space-y-4">
              <label className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">SEO</label>
              <div className="space-y-3">
                <div className="space-y-1.5"><label className="text-[11px] text-[var(--text-muted)]">Meta Title</label><input type="text" value={fields.seo.metaTitle} onChange={(e) => updateField('seo', { ...fields.seo, metaTitle: e.target.value })} className="input-field text-sm" maxLength={60} /></div>
                <div className="space-y-1.5"><label className="text-[11px] text-[var(--text-muted)]">Meta Description</label><textarea value={fields.seo.metaDescription} onChange={(e) => updateField('seo', { ...fields.seo, metaDescription: e.target.value })} className="input-field text-sm resize-none" rows={2} maxLength={160} /></div>
                <div className="space-y-1.5"><label className="text-[11px] text-[var(--text-muted)]">Keywords</label><input type="text" value={fields.seo.keywords} onChange={(e) => updateField('seo', { ...fields.seo, keywords: e.target.value })} className="input-field text-sm" /></div>
              </div>
            </div>

            <div className="glass-card p-5 rounded-xl">
              <div className="space-y-1.5"><label className="text-xs font-semibold text-[var(--text-primary)]">sourceArticle</label><input type="text" value={fields.sourceArticle} onChange={(e) => updateField('sourceArticle', e.target.value)} className="input-field text-sm" maxLength={255} /></div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-[280px] shrink-0 space-y-4 sticky top-6 self-start max-h-[calc(100vh-48px)] overflow-y-auto hidden-scrollbar">
            {/* Workflow Y Khoa Actions */}
            <WorkflowActions article={article} />

            <div className="glass-card p-4 rounded-xl border border-blue-500/20">
               <div className="flex items-center gap-2 mb-3">
                 <div className="w-2 h-2 rounded-full bg-blue-400" />
                 <span className="text-xs font-bold text-blue-400">{isDirty ? 'Editing draft version' : 'Draft saved'}</span>
               </div>
               <div className="space-y-2 text-[11px]">
                 <div className="flex items-center justify-between"><span className="text-[var(--text-muted)] font-semibold uppercase tracking-wider">Information</span></div>
                 <div className="space-y-1.5 pt-2 border-t border-[var(--border-default)]">
                   <div className="flex justify-between"><span className="text-[var(--text-muted)]">Template</span><span className="text-[var(--text-secondary)]">{article.templateName}</span></div>
                   <div className="flex justify-between"><span className="text-[var(--text-muted)]">Status</span><span className={`font-medium ${article.status === 'approved' ? 'text-emerald-400' : 'text-amber-400'}`}>{article.status}</span></div>
                   <div className="flex justify-between"><span className="text-[var(--text-muted)]">Created</span><span className="text-[var(--text-secondary)]">{article.createdAt}</span></div>
                   {(article as any).createdByName && (
                     <div className="flex justify-between"><span className="text-[var(--text-muted)]">Người tạo</span><span className="text-purple-400 font-medium">✍️ {(article as any).createdByName}</span></div>
                   )}
                 </div>
                 <CitationBadges article={article} />
               </div>
            </div>

            <QcScoreCard article={article} />

            {/* Workflow Timeline */}
            <WorkflowTimeline articleId={article.id} />

            {/* QC Nội Dung — Run QC Engine */}
            <QcContentPanel 
               article={article} 
               onQcComplete={onSoftUpdate ? (_res: any, updated: GeneratedArticle) => onSoftUpdate(updated) : undefined} 
            />
            
            <AIFactCheckPanel article={article} />

            <div className="glass-card p-4 rounded-xl space-y-2">
              <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Actions</h3>
              <button onClick={() => onPublish(article, fields)} className="w-full btn-primary text-xs py-2.5 flex items-center justify-center gap-2">🚀 Sync to Strapi</button>
              <button onClick={() => { onSave({ ...article, content: fields.moTa, title: fields.tenBaiViet, sapo: fields.moTaNgan, category: fields.danhMucBaiViet, tags: fields.tags }, fields); setIsDirty(false); }} className="w-full btn-secondary text-xs py-2.5 flex items-center justify-center gap-2">💾 Lưu Nháp</button>
              <ExportDocxButton articleId={article.id} articleTitle={article.title} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

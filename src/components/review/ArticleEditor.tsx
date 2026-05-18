'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import { GeneratedArticle } from '@/types';
import QcPanel from './QcPanel';

// ─── Section Status Types ───────────────────────────────────

type SectionStatus = 'approved' | 'edited' | 'needs_rework' | 'pending';

interface Section {
  id: string;
  heading: string;
  content: string;
  status: SectionStatus;
}

// ─── Props ──────────────────────────────────────────────────

interface ArticleEditorProps {
  article: GeneratedArticle;
  onSave: (article: GeneratedArticle) => void;
  onApprove: (article: GeneratedArticle) => void;
  onReject: (article: GeneratedArticle) => void;
  onClose: () => void;
}

// ─── Field Checklist ────────────────────────────────────────

interface FieldCheck {
  label: string;
  key: string;
  done: boolean;
}

// ─── Helper: Parse H2 Sections ──────────────────────────────

function parseSections(html: string): Section[] {
  const sections: Section[] = [];
  const parts = html.split(/<h2/i);

  for (let i = 0; i < parts.length; i++) {
    if (i === 0 && parts[i].trim()) {
      sections.push({
        id: `sec-intro`,
        heading: 'Introduction',
        content: parts[i].trim(),
        status: 'pending',
      });
      continue;
    }
    if (i === 0) continue;

    const full = '<h2' + parts[i];
    const headingMatch = full.match(/<h2[^>]*>(.*?)<\/h2>/i);
    const heading = headingMatch ? headingMatch[1].replace(/<[^>]+>/g, '') : `Section ${i}`;

    sections.push({
      id: `sec-${i}`,
      heading,
      content: full,
      status: 'pending',
    });
  }

  return sections;
}

// ─── Status Config ──────────────────────────────────────────

const statusBorder: Record<SectionStatus, string> = {
  approved: 'border-l-emerald-500',
  edited: 'border-l-amber-500',
  needs_rework: 'border-l-red-500',
  pending: 'border-l-slate-600',
};

const statusLabel: Record<SectionStatus, string> = {
  approved: '✅ Approved',
  edited: '✏️ Edited',
  needs_rework: '🔄 Needs Rework',
  pending: '⏳ Pending',
};

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

export default function ArticleEditor({
  article,
  onSave,
  onApprove,
  onReject,
  onClose,
}: ArticleEditorProps) {
  const [editedArticle, setEditedArticle] = useState<GeneratedArticle>({ ...article });
  const [sections, setSections] = useState<Section[]>(() => parseSections(article.content));
  const [activeSection, setActiveSection] = useState<string | null>(sections[0]?.id || null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [activeRightTab, setActiveRightTab] = useState<'ai' | 'qc'>('qc');
  
  // TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
    ],
    content: article.content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[400px] px-6 py-4',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setEditedArticle((prev) => ({ ...prev, content: html }));
      // re-parse sections on edit
      const newSections = parseSections(html);
      setSections((prev) =>
        newSections.map((ns) => {
          const existing = prev.find((p) => p.heading === ns.heading);
          return existing
            ? { ...ns, status: ns.content !== existing.content ? 'edited' : existing.status }
            : ns;
        })
      );
    },
  });

  // Field checklist
  const fieldChecks: FieldCheck[] = useMemo(() => [
    { label: 'Title', key: 'title', done: editedArticle.title.length > 0 && editedArticle.title.length <= 70 },
    { label: 'Sapo', key: 'sapo', done: editedArticle.sapo.length > 0 && editedArticle.sapo.length < 300 },
    { label: 'Content', key: 'content', done: editedArticle.content.length > 500 },
    { label: 'References', key: 'references', done: editedArticle.references.length > 0 },
    { label: 'SEO Meta', key: 'seoMeta', done: !!editedArticle.seoMeta.title && !!editedArticle.seoMeta.description },
    { label: 'Tags', key: 'tags', done: editedArticle.tags.length > 0 },
  ], [editedArticle]);

  const completionPercent = Math.round(
    (fieldChecks.filter((f) => f.done).length / fieldChecks.length) * 100
  );

  // Set section status
  const setSectionStatus = useCallback((sectionId: string, status: SectionStatus) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, status } : s))
    );
  }, []);

  // Regenerate a single section
  const regenerateSection = useCallback(async (section: Section) => {
    setIsRegenerating(true);
    try {
      const response = await fetch('/api/regenerate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionHeading: section.heading,
          sectionContent: section.content,
          articleTitle: editedArticle.title,
          templateId: editedArticle.templateId,
          sourceSnippet: editedArticle.references.join('\n'),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Replace the section content in the editor
        if (editor && data.newContent) {
          const currentHTML = editor.getHTML();
          const updated = currentHTML.replace(section.content, data.newContent);
          editor.commands.setContent(updated);
          setSectionStatus(section.id, 'edited');
        }
      }
    } catch (error) {
      console.error('Regeneration failed:', error);
    } finally {
      setIsRegenerating(false);
    }
  }, [editor, editedArticle, setSectionStatus]);

  // Save draft
  const handleSave = useCallback(() => {
    if (editor) {
      const updated = { ...editedArticle, content: editor.getHTML() };
      onSave(updated);
    }
  }, [editor, editedArticle, onSave]);

  // Approve & sync to Strapi
  const handleApproveAndSync = useCallback(async () => {
    setIsSyncing(true);
    setSyncStatus('Đang đồng bộ lên Strapi CMS...');
    try {
      const response = await fetch('/api/strapi-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article: { ...editedArticle, content: editor?.getHTML() || editedArticle.content },
        }),
      });

      if (response.ok) {
        setSyncStatus('✅ Đã đồng bộ thành công lên Strapi');
        setTimeout(() => {
          onApprove({ ...editedArticle, status: 'approved' });
        }, 1500);
      } else {
        const data = await response.json();
        setSyncStatus(`⚠️ ${data.error || 'Sync failed'}`);
      }
    } catch (error) {
      setSyncStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    } finally {
      setIsSyncing(false);
    }
  }, [editor, editedArticle, onApprove]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--bg-primary)]">
      {/* ─── TOP BAR ──────────────────────────────────────── */}
      <div className="h-14 flex items-center justify-between px-5 border-b border-[var(--border-default)] bg-[var(--bg-secondary)] shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-card-hover)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            ✕
          </button>
          <div className="w-px h-6 bg-[var(--bg-card-hover)]" />
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate max-w-[400px]">
              {editedArticle.title}
            </p>
            <p className="text-[10px] text-[var(--text-muted)]">
              {editedArticle.templateName} • {editedArticle.category}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Completion ring */}
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8">
              <svg viewBox="0 0 36 36" className="w-full h-full">
                <path
                  d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3"
                />
                <path
                  d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="#3B82F6" strokeWidth="3"
                  strokeDasharray={`${completionPercent}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-[var(--text-accent)]">
                {completionPercent}%
              </span>
            </div>
          </div>
          <div className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            (editedArticle.qcScore ?? 0) >= 80
              ? 'bg-emerald-500/15 text-emerald-400'
              : (editedArticle.qcScore ?? 0) >= 60
              ? 'bg-amber-500/15 text-amber-400'
              : 'bg-red-500/15 text-red-400'
          }`}>
            QC: {editedArticle.qcScore ?? '—'}
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ──────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL — 60% Editor */}
        <div className="w-[60%] flex flex-col border-r border-[var(--border-default)] overflow-y-auto">
          {/* Title & Sapo editable fields */}
          <div className="px-6 py-4 border-b border-[var(--border-default)] space-y-3">
            <div>
              <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Title ({editedArticle.title.length}/70)
              </label>
              <input
                type="text"
                value={editedArticle.title}
                onChange={(e) => setEditedArticle((p) => ({ ...p, title: e.target.value }))}
                className="input-field mt-1 text-base font-semibold"
                maxLength={70}
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Sapo ({editedArticle.sapo.length}/300)
              </label>
              <textarea
                value={editedArticle.sapo}
                onChange={(e) => setEditedArticle((p) => ({ ...p, sapo: e.target.value }))}
                className="input-field mt-1 resize-none"
                rows={2}
                maxLength={300}
              />
            </div>
          </div>

          {/* Editor toolbar */}
          {editor && (
            <div className="flex items-center gap-1 px-6 py-2 border-b border-[var(--border-default)] bg-[var(--bg-surface)]">
              {[
                { label: 'B', action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold') },
                { label: 'I', action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic') },
                { label: 'U', action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive('underline') },
                { label: 'H2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }) },
                { label: 'H3', action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }) },
                { label: '•', action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList') },
                { label: '1.', action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList') },
              ].map((btn) => (
                <button
                  key={btn.label}
                  onClick={btn.action}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                    btn.active
                      ? 'bg-[var(--lc-primary)]/20 text-[var(--text-accent)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          )}

          {/* Section-based editor with colored borders */}
          <div className="flex-1 overflow-y-auto">
            {sections.length > 0 ? (
              <div className="divide-y divide-[var(--border-default)]">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className={`border-l-4 ${statusBorder[section.status]} transition-all duration-300 ${
                      activeSection === section.id ? 'bg-[var(--bg-card-hover)]' : ''
                    }`}
                    onClick={() => setActiveSection(section.id)}
                  >
                    <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-card-hover)]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[var(--text-primary)]">
                          {section.heading}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {statusLabel[section.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSectionStatus(section.id, 'approved'); }}
                          className="w-6 h-6 rounded flex items-center justify-center text-[10px] hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                          title="Approve section"
                        >✓</button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSectionStatus(section.id, 'needs_rework'); }}
                          className="w-6 h-6 rounded flex items-center justify-center text-[10px] hover:bg-red-500/20 text-red-400 transition-colors"
                          title="Mark needs rework"
                        >✗</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            {/* Main editor content */}
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* RIGHT PANEL — 40% AI Assistant vs QC Panel */}
        <div className="w-[40%] flex flex-col bg-[var(--bg-secondary)] overflow-hidden">
          
          {/* Tabs Navigation */}
          <div className="flex border-b border-[var(--border-default)] shrink-0">
            <button 
              onClick={() => setActiveRightTab('ai')}
              className={`flex-1 py-3 text-xs font-bold transition-colors ${activeRightTab === 'ai' ? 'text-[var(--lc-primary)] border-b-2 border-[var(--lc-primary)] bg-[var(--lc-primary)]/5' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]' }`}
            >
              🤖 Assistant
            </button>
            <button 
              onClick={() => setActiveRightTab('qc')}
               className={`flex-1 flex gap-2 justify-center items-center py-3 text-xs font-bold transition-colors ${activeRightTab === 'qc' ? 'text-[var(--lc-primary)] border-b-2 border-[var(--lc-primary)] bg-[var(--lc-primary)]/5' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]' }`}
            >
              🛡️ QC Audit <span className="bg-red-500 text-white rounded px-1.5 py-0.5 text-[9px]">4 lỗi</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto w-full flex flex-col">
          {activeRightTab === 'ai' ? (
             <>
                {/* Source snippet */}
                <div className="px-5 py-4 border-b border-[var(--border-default)]">
                  <h4 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                    Source Document
                  </h4>
                  <div className="glass-card p-3 rounded-xl max-h-[150px] overflow-y-auto">
              {editedArticle.references.length > 0 ? (
                <ul className="space-y-1.5">
                  {editedArticle.references.map((ref, i) => (
                    <li key={i} className="text-[11px] text-[var(--text-secondary)] flex items-start gap-1.5">
                      <span className="text-[var(--text-muted)] shrink-0">📎</span>
                      {ref}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-[var(--text-muted)] italic">No source references</p>
              )}
            </div>
          </div>

          {/* Regenerate section */}
          {activeSection && (
            <div className="px-5 py-4 border-b border-[var(--border-default)] animate-fade-in">
              <h4 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                Active Section
              </h4>
              <div className="glass-card p-3 rounded-xl">
                <p className="text-xs font-semibold text-[var(--text-primary)] mb-2">
                  {sections.find((s) => s.id === activeSection)?.heading}
                </p>
                <button
                  onClick={() => {
                    const section = sections.find((s) => s.id === activeSection);
                    if (section) regenerateSection(section);
                  }}
                  disabled={isRegenerating}
                  className="btn-secondary text-xs w-full flex items-center justify-center gap-2"
                >
                  {isRegenerating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>🔄 Regenerate this section</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Quality Indicators — QC 2-Layer */}
          <div className="px-5 py-4 border-b border-[var(--border-default)]">
            <h4 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
              QC 2-Layer Scores
            </h4>
            <div className="space-y-3">
              {/* Tech Layer */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">🔧 Kỹ thuật</span>
                  <span className={`text-xs font-bold ${(editedArticle.qcTechScore?.total ?? 0) >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {editedArticle.qcTechScore?.total ?? 0}/100
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[var(--bg-card-hover)]">
                  <div className={`h-full rounded-full transition-all duration-500 ${(editedArticle.qcTechScore?.total ?? 0) >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${editedArticle.qcTechScore?.total ?? 0}%` }} />
                </div>
              </div>
              {/* Content Layer */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">📋 Nội dung</span>
                  <span className={`text-xs font-bold ${(editedArticle.qcContentScore?.total ?? 0) >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {editedArticle.qcContentScore?.total ?? 0}/100
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[var(--bg-card-hover)]">
                  <div className={`h-full rounded-full transition-all duration-500 ${(editedArticle.qcContentScore?.total ?? 0) >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${editedArticle.qcContentScore?.total ?? 0}%` }} />
                </div>
              </div>
              {/* Weighted total */}
              <div className="pt-2 border-t border-[var(--border-default)]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">= Kỹ thuật×0.4 + Nội dung×0.6</span>
                  <span className={`text-xs font-black ${(editedArticle.qcScore ?? 0) >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {editedArticle.qcScore ?? 0}/100
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Field Checklist */}
          <div className="px-5 py-4 border-b border-[var(--border-default)]">
            <h4 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
              Field Checklist
            </h4>
            <div className="space-y-1.5">
              {fieldChecks.map((field) => (
                <div
                  key={field.key}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-card-hover)]"
                >
                  <span className={`text-sm ${field.done ? 'text-emerald-400' : 'text-[var(--text-muted)]'}`}>
                    {field.done ? '✓' : '○'}
                  </span>
                  <span className={`text-xs ${field.done ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                    {field.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* SEO Meta editor */}
          <div className="px-5 py-4">
            <h4 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
              SEO Meta
            </h4>
            <div className="space-y-2">
              <input
                type="text"
                value={editedArticle.seoMeta.title}
                onChange={(e) => setEditedArticle((p) => ({
                  ...p, seoMeta: { ...p.seoMeta, title: e.target.value }
                }))}
                placeholder="SEO Title (≤60 chars)"
                className="input-field text-xs"
                maxLength={60}
              />
              <textarea
                value={editedArticle.seoMeta.description}
                onChange={(e) => setEditedArticle((p) => ({
                  ...p, seoMeta: { ...p.seoMeta, description: e.target.value }
                }))}
                placeholder="Meta description (≤160 chars)"
                className="input-field text-xs resize-none"
                rows={2}
                maxLength={160}
              />
            </div>
          </div>
          </>
          ) : (
            <div className="p-8 text-center text-[var(--text-muted)]">
              <p className="text-sm font-bold mb-2">🛡️ QC Audit</p>
              <p className="text-[10px]">Chuyển sang tab QC để xem kết quả kiểm duyệt chi tiết.</p>
              <p className="text-[10px] mt-1">Điểm QC: {editedArticle.qcScore ?? '—'}/100</p>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* ─── BOTTOM BAR ──────────────────────────────────── */}
      <div className="h-16 flex items-center justify-between px-6 border-t border-[var(--border-default)] bg-[var(--bg-secondary)] shrink-0">
        <div className="flex items-center gap-2">
          {syncStatus && (
            <span className="text-xs text-[var(--text-secondary)] animate-fade-in">{syncStatus}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onReject(editedArticle)}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-all duration-200"
          >
            Reject
          </button>
          <button
            onClick={handleSave}
            className="btn-secondary"
          >
            💾 Save Draft
          </button>
          <button
            onClick={handleApproveAndSync}
            disabled={isSyncing || (editedArticle.qcScore ?? 0) < 70}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title={(editedArticle.qcScore ?? 0) < 70 ? 'Phải đạt ít nhất 70 điểm để Approved' : ''}
          >
            {isSyncing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Syncing...
              </>
            ) : (
              <>✅ Approve & Sync to Strapi</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

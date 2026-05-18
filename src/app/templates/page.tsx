'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import {
  TEMPLATES,
  ContentTemplate,
  OutlineSection,
} from '@/lib/templates';

// ═══════════════════════════════════════════════════════════
// TEMPLATE LIST VIEW
// ═══════════════════════════════════════════════════════════

function TemplateCard({
  template,
  onOpen,
  onDuplicate,
  onDelete,
}: {
  template: ContentTemplate;
  onOpen: () => void;
  onDuplicate: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      className="glass-card glass-card-hover p-5 rounded-xl cursor-pointer group animate-fade-in"
      onClick={onOpen}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-[var(--bg-card-hover)] group-hover:scale-110 transition-transform duration-300">
            {template.icon}
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              {template.name}
            </h3>
            <p className="text-[11px] text-[var(--text-muted)]">
              {template.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-medium">
            {template.stepCount} steps
          </span>
          <button 
            onClick={onDuplicate}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--bg-card-hover)] hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-xs"
            title="Duplicate"
          >
            📋
          </button>
          <button 
            onClick={onDelete}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--bg-card-hover)] hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400 transition-colors text-xs"
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Steps pipeline */}
      <div className="flex flex-wrap gap-1 mb-4">
        {template.steps.map((step, i) => (
          <span
            key={step}
            className="px-2 py-0.5 rounded text-[9px] font-mono font-medium bg-[var(--bg-card-hover)] text-[var(--text-muted)]"
          >
            {i > 0 && <span className="text-[var(--text-muted)] mr-1">→</span>}
            {step}
          </span>
        ))}
      </div>

      {/* Meta info */}
      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] border-t border-[var(--border-default)] pt-3">
        <div className="flex gap-3">
          <span title="Last Used in Single Generator">🕒 2h ago</span>
          <span title="Total Generations">📈 14 usages</span>
        </div>
        <span className="text-blue-400 font-medium group-hover:text-blue-300 transition-colors flex items-center gap-1">
          Chỉnh sửa <span>→</span>
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TEMPLATE DETAIL / EDITOR VIEW
// ═══════════════════════════════════════════════════════════

function OutlineTree({ sections, depth = 0 }: { sections: OutlineSection[]; depth?: number }) {
  return (
    <div className={`space-y-1 ${depth > 0 ? 'ml-5 border-l border-[var(--border-default)] pl-3' : ''}`}>
      {sections.map((section, i) => (
        <div key={`${section.label}-${i}`}>
          <div className="flex items-center gap-2 py-1.5 group">
            {/* Type badge */}
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                section.type === 'h2'
                  ? 'bg-blue-500/15 text-blue-400'
                  : section.type === 'h3'
                  ? 'bg-cyan-500/15 text-cyan-400'
                  : section.type === 'required'
                  ? 'bg-red-500/15 text-red-400'
                  : 'bg-amber-500/15 text-amber-400'
              }`}
            >
              {section.type}
            </span>
            {/* Label */}
            <span className="text-sm text-[var(--text-secondary)]">{section.label}</span>
            {/* Field key */}
            {section.fieldKey && (
              <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-card-hover)] px-1.5 py-0.5 rounded opacity-60 group-hover:opacity-100 transition-opacity">
                {section.fieldKey}
              </span>
            )}
          </div>
          {section.children && <OutlineTree sections={section.children} depth={depth + 1} />}
        </div>
      ))}
    </div>
  );
}

function TemplateDetail({
  template: initialTemplate,
  onBack,
  onSave,
}: {
  template: ContentTemplate;
  onBack: () => void;
  onSave: (t: ContentTemplate) => void;
}) {
  const [template, setTemplate] = useState<ContentTemplate>({ ...initialTemplate });
  const [activeTab, setActiveTab] = useState<'outline' | 'prompt' | 'settings'>('outline');
  const [isDirty, setIsDirty] = useState(false);

  const updateField = <K extends keyof ContentTemplate>(key: K, value: ContentTemplate[K]) => {
    setTemplate((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const tabs = [
    { id: 'outline' as const, label: 'Outline & Cấu trúc', icon: '🏗️' },
    { id: 'prompt' as const, label: 'System Prompt', icon: '🤖' },
    { id: 'settings' as const, label: 'Settings', icon: '⚙️' },
  ];

  return (
    <main className="flex-1 h-screen overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Quay lại
          </button>
          <div className="flex items-center gap-3">
            {isDirty && (
              <span className="text-[11px] text-amber-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Chưa lưu
              </span>
            )}
            <button
              onClick={() => {
                setIsDirty(false);
                onSave(template);
              }}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-[var(--text-primary)] transition-all duration-200 shadow-lg shadow-emerald-600/20"
            >
              💾 Lưu thay đổi
            </button>
          </div>
        </div>

        {/* Header card */}
        <div className="glass-card p-6 rounded-xl mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl bg-[var(--bg-card-hover)]">
              {template.icon}
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={template.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="text-xl font-bold text-[var(--text-primary)] bg-transparent border-none outline-none w-full hover:bg-[var(--bg-card-hover)] focus:bg-[var(--bg-card-hover)] px-2 py-1 -ml-2 rounded-lg transition-colors"
              />
              <div className="flex items-center gap-4 mt-1 text-[11px] text-[var(--text-muted)]">
                <span className="font-mono bg-[var(--bg-card-hover)] px-2 py-0.5 rounded">{template.id}</span>
                <span>{template.stepCount} steps</span>
                <span>
                  {template.estimatedWords.min}–{template.estimatedWords.max} từ
                </span>
              </div>
            </div>
          </div>

          {/* Steps pipeline display */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-[var(--border-default)]">
            {template.steps.map((step, i) => (
              <React.Fragment key={step}>
                {i > 0 && <span className="text-[var(--text-muted)] text-xs">→</span>}
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {step}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-1 mb-6 bg-[var(--bg-card-hover)] rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-500/15 text-blue-400 shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── Tab: Outline ─────────────────────────────── */}
        {activeTab === 'outline' && (
          <div className="space-y-6">
            {/* Outline tree */}
            <div className="glass-card p-5 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Cấu trúc bài viết (Outline)
                </h3>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-500/40" /> H2</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-cyan-500/40" /> H3</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500/40" /> Meta</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-500/40" /> Required</span>
                </div>
              </div>
              <OutlineTree sections={template.outline} />
            </div>

            {/* Required fields */}
            <div className="glass-card p-5 rounded-xl">
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">
                Required Fields (Strapi)
              </h3>
              <div className="flex flex-wrap gap-2">
                {template.requiredFields.map((field) => (
                  <span
                    key={field}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1.5"
                  >
                    <span className="text-red-400">*</span>
                    {field}
                  </span>
                ))}
              </div>
            </div>

            {/* Notes */}
            {template.notes && template.notes.length > 0 && (
              <div className="glass-card p-5 rounded-xl">
                <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">
                  📌 Quy tắc & Lưu ý quan trọng
                </h3>
                <ul className="space-y-2">
                  {template.notes.map((note, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                      <span className="text-amber-400 mt-0.5 shrink-0">⚡</span>
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: System Prompt ──────────────────────── */}
        {activeTab === 'prompt' && (
          <div className="glass-card p-5 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                System Prompt (Gemini API)
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--text-muted)]">
                  {template.systemPrompt.length.toLocaleString()} chars
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(template.systemPrompt)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
                >
                  📋 Copy
                </button>
              </div>
            </div>
            <textarea
              value={template.systemPrompt}
              onChange={(e) => updateField('systemPrompt', e.target.value)}
              className="w-full min-h-[500px] p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-default)] text-sm text-[var(--text-secondary)] font-mono leading-relaxed resize-y focus:outline-none focus:border-blue-500/30 transition-colors"
              spellCheck={false}
            />
          </div>
        )}

        {/* ── Tab: Settings ───────────────────────────── */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Basic settings */}
            <div className="glass-card p-5 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Cài đặt cơ bản</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Template ID</label>
                  <input
                    type="text"
                    value={template.id}
                    className="input-field text-sm font-mono"
                    readOnly
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Icon</label>
                  <input
                    type="text"
                    value={template.icon}
                    onChange={(e) => updateField('icon', e.target.value)}
                    className="input-field text-sm text-center text-2xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Min Words</label>
                  <input
                    type="number"
                    value={template.estimatedWords.min}
                    onChange={(e) =>
                      updateField('estimatedWords', {
                        ...template.estimatedWords,
                        min: parseInt(e.target.value) || 0,
                      })
                    }
                    className="input-field text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Max Words</label>
                  <input
                    type="number"
                    value={template.estimatedWords.max}
                    onChange={(e) =>
                      updateField('estimatedWords', {
                        ...template.estimatedWords,
                        max: parseInt(e.target.value) || 0,
                      })
                    }
                    className="input-field text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Steps editor */}
            <div className="glass-card p-5 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Pipeline Steps ({template.steps.length})
                </h3>
                <button
                  onClick={() => {
                    const name = prompt('Tên step mới (viết hoa, VD: NEW_STEP):');
                    if (name) {
                      updateField('steps', [...template.steps, name.toUpperCase()]);
                      updateField('stepCount', template.steps.length + 1);
                    }
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors font-medium"
                >
                  + Add Step
                </button>
              </div>
              <div className="space-y-2">
                {template.steps.map((step, i) => (
                  <div key={`${step}-${i}`} className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--text-muted)] w-5 text-right">{i + 1}</span>
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => {
                        const newSteps = [...template.steps];
                        newSteps[i] = e.target.value;
                        updateField('steps', newSteps);
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-default)] text-sm font-mono text-[var(--text-secondary)] focus:outline-none focus:border-blue-500/30 transition-colors"
                    />
                    <button
                      onClick={() => {
                        const newSteps = template.steps.filter((_, idx) => idx !== i);
                        updateField('steps', newSteps);
                        updateField('stepCount', newSteps.length);
                      }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-colors text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Required fields editor */}
            <div className="glass-card p-5 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Required Fields</h3>
                <button
                  onClick={() => {
                    const field = prompt('Tên field mới (VD: tenBaiViet):');
                    if (field) updateField('requiredFields', [...template.requiredFields, field]);
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors font-medium"
                >
                  + Add Field
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {template.requiredFields.map((field) => (
                  <span
                    key={field}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono bg-[var(--bg-card-hover)] text-[var(--text-secondary)] flex items-center gap-2 group"
                  >
                    {field}
                    <button
                      onClick={() =>
                        updateField('requiredFields', template.requiredFields.filter((f) => f !== field))
                      }
                      className="text-red-400/30 group-hover:text-red-400 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Notes editor */}
            <div className="glass-card p-5 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Notes & Rules</h3>
                <button
                  onClick={() => {
                    const note = prompt('Thêm lưu ý:');
                    if (note) updateField('notes', [...(template.notes || []), note]);
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors font-medium"
                >
                  + Add Note
                </button>
              </div>
              <div className="space-y-2">
                {(template.notes || []).map((note, i) => (
                  <div key={i} className="flex items-start gap-2 group">
                    <textarea
                      value={note}
                      onChange={(e) => {
                        const newNotes = [...(template.notes || [])];
                        newNotes[i] = e.target.value;
                        updateField('notes', newNotes);
                      }}
                      className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-default)] text-sm text-[var(--text-secondary)] resize-none focus:outline-none focus:border-blue-500/30 transition-colors"
                      rows={1}
                    />
                    <button
                      onClick={() => {
                        const newNotes = (template.notes || []).filter((_, idx) => idx !== i);
                        updateField('notes', newNotes);
                      }}
                      className="mt-1 w-6 h-6 rounded flex items-center justify-center text-red-400/30 group-hover:text-red-400 hover:bg-red-500/10 transition-colors text-xs shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════

export default function TemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      const dbTmpls: ContentTemplate[] = await res.json();
      
      if (!dbTmpls || dbTmpls.length === 0) {
        // Seed default templates if DB is empty
        await fetch('/api/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(TEMPLATES) });
        setTemplates(TEMPLATES);
      } else {
        // Merge: ensure TEMPLATES from code that are NOT in DB get added automatically!
        const parsedIds = new Set(dbTmpls.map((p) => p.id));
        const newFromCode = TEMPLATES.filter(t => !parsedIds.has(t.id));
        if (newFromCode.length > 0) {
          await fetch('/api/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newFromCode) });
          setTemplates([...dbTmpls, ...newFromCode]);
        } else {
          setTemplates(dbTmpls);
        }
      }
    } catch(e) {
      console.error(e);
      setTemplates(TEMPLATES); // fallback
    }
  };

  React.useEffect(() => {
    fetchTemplates();
  }, []);

  const saveTemplateApi = async (template: ContentTemplate) => {
    try {
      await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });
      await fetchTemplates();
    } catch (e) { console.error('Lỗi khi lưu Template', e); }
  };

  const handleSaveDetail = async (updated: ContentTemplate) => {
    // Optimistic update
    const exists = templates.find(t => t.id === updated.id);
    const newTemplates = exists 
      ? templates.map(t => t.id === updated.id ? updated : t)
      : [updated, ...templates];
    setTemplates(newTemplates);
    setSelectedTemplate(null);

    // DB Update
    await saveTemplateApi(updated);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(confirm('Are you sure you want to delete this template?')) {
      setTemplates(templates.filter(t => t.id !== id)); // Optimistic
      await fetch(`/api/templates?id=${id}`, { method: 'DELETE' });
    }
  };

  const handleDuplicate = async (e: React.MouseEvent, t: ContentTemplate) => {
    e.stopPropagation();
    const copy: ContentTemplate = {
      ...t,
      id: `${t.id}-copy-${Date.now()}`,
      name: `${t.name} (Copy)`,
      sites: t.sites || ['nha-thuoc', 'tiem-chung'],
    };
    setTemplates([copy, ...templates]); // Optimistic
    await saveTemplateApi(copy);
  };

  const handleCreateNew = () => {
    const fresh: ContentTemplate = {
      id: `custom-${Date.now()}`,
      name: 'New Custom Template',
      icon: '✨',
      stepCount: 1,
      steps: ['INPUT'],
      estimatedWords: { min: 1000, max: 2000 },
      systemPrompt: 'You are an AI assistant...',
      outline: [],
      requiredFields: ['tenBaiViet', 'slug', 'seo'],
      notes: [],
      sites: ['nha-thuoc', 'tiem-chung'],
    };
    setSelectedTemplate(fresh);
  };

  // Detail view
  if (selectedTemplate) {
    return (
      <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
        <Sidebar />
        <TemplateDetail
          template={selectedTemplate}
          onBack={() => setSelectedTemplate(null)}
          onSave={handleSaveDetail}
        />
      </div>
    );
  }

  // List view
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] mb-2 uppercase tracking-wider font-medium">
              <span>Workspace</span>
              <span>/</span>
              <span className="text-[var(--text-accent)]">Templates</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                  Content Templates
                </h1>
                <p className="text-sm text-[var(--text-secondary)]">
                  {templates.length} templates • Quản lý outline, system prompt, và quy tắc cho từng loại nội dung
                </p>
              </div>
              <button 
                onClick={handleCreateNew}
                className="btn-primary px-5 py-2 flex items-center gap-2 shadow-[0_0_15px_rgba(0,102,204,0.3)]"
              >
                <span>✨</span> Create New
              </button>
            </div>
          </div>

          {/* Template grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {templates.map((tmpl, i) => (
              <div key={tmpl.id} style={{ animationDelay: `${i * 30}ms` }} className="animate-fade-in">
                <TemplateCard 
                  template={tmpl} 
                  onOpen={() => setSelectedTemplate(tmpl)} 
                  onDuplicate={(e) => handleDuplicate(e, tmpl)}
                  onDelete={(e) => handleDelete(e, tmpl.id)}
                />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Template, SiteId } from '@/types';
import { ContentTemplate, TEMPLATE_MAP } from '@/lib/templates';

/**
 * Convert a ContentTemplate (from DB/API) → Template (UI type used by BatchGenerator).
 * Custom/new templates from DB won't have color or fields metadata,
 * so we provide sensible defaults.
 */
function contentTemplateToTemplate(ct: ContentTemplate): Template {
  // Try to find a matching mock template for color/fields
  const staticEntry = TEMPLATE_MAP[ct.id];

  return {
    id: ct.id,
    name: ct.name,
    slug: ct.id, // use id as slug fallback
    description: ct.steps?.join(' → ') || ct.name,
    color: staticEntry ? '' : '#6366F1', // purple default for custom templates
    fields: staticEntry
      ? [] // will be filled from mock if exists
      : (ct.requiredFields || []).map((f: string) => ({
          key: f,
          label: f,
          type: 'text' as const,
          required: true,
        })),
    outline: ct.outline,
  };
}

interface TemplateStepProps {
  selectedTemplate: Template | null;
  onSelectTemplate: (template: Template) => void;
  siteId?: SiteId;
}

export default function TemplateStep({ selectedTemplate, onSelectTemplate, siteId }: TemplateStepProps) {
  const [dbTemplates, setDbTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch templates from DB API on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/templates');
        if (res.ok) {
          const contentTemplates: ContentTemplate[] = await res.json();

          // Filter by site if siteId provided
          const filtered = siteId
            ? contentTemplates.filter(ct => ct.sites?.includes(siteId))
            : contentTemplates;

          // Convert to Template UI type
          const converted = filtered.map(contentTemplateToTemplate);
          setDbTemplates(converted);
        } else {
          console.error('Failed to fetch templates from API');
        }
      } catch (e) {
        console.error('Error fetching templates:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplates();
  }, [siteId]);

  // Color palette for templates without a preset color
  const colorPalette = [
    '#EF4444', '#22C55E', '#3B82F6', '#8B5CF6',
    '#F59E0B', '#EC4899', '#06B6D4', '#14B8A6', '#A855F7',
    '#6366F1', '#F97316', '#84CC16',
  ];

  const getColor = (template: Template, index: number): string => {
    if (template.color && template.color !== '#6366F1') return template.color;
    // Check if there's a static entry with color info
    const staticFields = TEMPLATE_MAP[template.id];
    if (staticFields) {
      // Use the icon or return a palette color
      return colorPalette[index % colorPalette.length];
    }
    return colorPalette[index % colorPalette.length];
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
          Select Template
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Chọn mẫu nội dung phù hợp với loại bài viết y khoa cần tạo
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-sm text-[var(--text-muted)]">Đang tải templates...</span>
        </div>
      ) : dbTemplates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-[var(--text-muted)]">Không có template nào. Hãy tạo template mới tại trang <a href="/templates" className="text-[var(--lc-primary)] underline">Templates</a>.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 stagger-children">
          {dbTemplates.map((template, index) => {
            const isSelected = selectedTemplate?.id === template.id;
            const color = getColor(template, index);
            const ct = TEMPLATE_MAP[template.id];
            const icon = ct?.icon || template.name.charAt(0);

            return (
              <button
                key={template.id}
                onClick={() => onSelectTemplate(template)}
                className={`
                  relative text-left p-4 rounded-xl border transition-all duration-300 group
                  ${isSelected
                    ? 'border-[var(--lc-primary)]/50 bg-[var(--lc-primary)]/8 shadow-[0_0_24px_rgba(0,102,204,0.12)]'
                    : 'border-[var(--border-default)] bg-[var(--bg-card)] hover:border-[var(--border-default)] hover:bg-[var(--bg-card-hover)]'
                  }
                `}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[var(--lc-primary)] flex items-center justify-center">
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
                <div
                  className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center font-bold text-lg"
                  style={{ background: `${color}15`, color: color || 'var(--lc-primary)' }}
                >
                  {icon}
                </div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                  {template.name}
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed line-clamp-2">
                  {template.description}
                </p>
                <div className="flex items-center gap-1 mt-3">
                  {ct && (
                    <span className="text-[10px] font-medium text-[var(--text-muted)] bg-[var(--bg-card-hover)] px-2 py-0.5 rounded-full">
                      {ct.stepCount} steps
                    </span>
                  )}
                  {ct && (
                    <span className="text-[10px] font-medium text-[var(--text-muted)] bg-[var(--bg-card-hover)] px-2 py-0.5 rounded-full">
                      {ct.estimatedWords.min}–{ct.estimatedWords.max} từ
                    </span>
                  )}
                  {!ct && (
                    <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      Custom
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected template preview */}
      {selectedTemplate && (
        <div className="glass-card p-4 rounded-xl animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {selectedTemplate.name} — Template Info
            </h3>
          </div>
          {(() => {
            const ct = TEMPLATE_MAP[selectedTemplate.id];
            if (ct) {
              return (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {ct.steps.map((step, i) => (
                      <span key={step} className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-card-hover)] px-2 py-0.5 rounded">
                        {i > 0 && <span className="mr-1">→</span>}
                        {step}
                      </span>
                    ))}
                  </div>
                  {ct.notes && ct.notes.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {ct.notes.slice(0, 3).map((note, i) => (
                        <li key={i} className="text-[10px] text-[var(--text-muted)] flex items-start gap-1">
                          <span className="text-amber-400 shrink-0">⚡</span> {note}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            }
            // Custom template — show basic info
            return (
              <div className="grid grid-cols-2 gap-2">
                {selectedTemplate.fields.map((field) => (
                  <div
                    key={field.key}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-card-hover)]"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${field.required ? 'bg-[var(--lc-primary)]' : 'bg-[var(--text-muted)]'}`} />
                    <span className="text-xs text-[var(--text-secondary)]">{field.label}</span>
                    <span className="ml-auto text-[10px] text-[var(--text-muted)] bg-[var(--bg-card-hover)] px-1.5 py-0.5 rounded">
                      {field.type}
                    </span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

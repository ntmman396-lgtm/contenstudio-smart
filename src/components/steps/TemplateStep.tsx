'use client';

import React from 'react';
import { Template, SiteId } from '@/types';
import { templates } from '@/lib/mock-data';
import { TEMPLATE_MAP } from '@/lib/templates';

interface TemplateStepProps {
  selectedTemplate: Template | null;
  onSelectTemplate: (template: Template) => void;
  siteId?: SiteId;
}

export default function TemplateStep({ selectedTemplate, onSelectTemplate, siteId }: TemplateStepProps) {
  // Filter templates by site if siteId provided
  const filteredTemplates = siteId
    ? templates.filter(t => {
        const contentTemplate = TEMPLATE_MAP[t.id];
        return contentTemplate ? contentTemplate.sites.includes(siteId) : true;
      })
    : templates;

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

      <div className="grid grid-cols-2 gap-3 stagger-children">
        {filteredTemplates.map((template) => {
          const isSelected = selectedTemplate?.id === template.id;
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
                style={{ background: `${template.color}15`, color: template.color || 'var(--lc-primary)' }}
              >
                {template.name.charAt(0)}
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                {template.name}
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed line-clamp-2">
                {template.description}
              </p>
              <div className="flex items-center gap-1 mt-3">
                <span className="text-[10px] font-medium text-[var(--text-muted)] bg-[var(--bg-card-hover)] px-2 py-0.5 rounded-full">
                  {template.fields.length} fields
                </span>
                <span className="text-[10px] font-medium text-[var(--text-muted)] bg-[var(--bg-card-hover)] px-2 py-0.5 rounded-full">
                  {template.fields.filter(f => f.required).length} required
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected template preview */}
      {selectedTemplate && (
        <div className="glass-card p-4 rounded-xl animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {selectedTemplate.name} — Fields Preview
            </h3>
          </div>
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
        </div>
      )}
    </div>
  );
}

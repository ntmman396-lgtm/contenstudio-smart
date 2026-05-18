'use client';

import React, { useState } from 'react';
import { BatchConfig, Template } from '@/types';

interface ConfigStepProps {
  config: BatchConfig;
  onConfigChange: (config: BatchConfig) => void;
  selectedTemplate: Template | null;
  sourceCount: number;
  onGenerate: () => void;
  extractedText?: string;
}

export default function ConfigStep({
  config,
  onConfigChange,
  selectedTemplate,
  sourceCount,
  onGenerate,
  extractedText,
}: ConfigStepProps) {
  const [showPreview, setShowPreview] = useState(false);

  const updateConfig = (key: keyof BatchConfig, value: string | number) => {
    onConfigChange({ ...config, [key]: value });
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
          Configure Settings
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Tùy chỉnh cài đặt AI trước khi generate batch nội dung
        </p>
      </div>

      {/* Summary card */}
      <div className="glass-card gradient-border p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div>
              <p className="text-xs text-[var(--text-muted)]">Template</p>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {selectedTemplate?.name}
              </p>
            </div>
          </div>
          <div className="w-px h-8 bg-[var(--bg-card-hover)]" />
          <div>
            <p className="text-xs text-[var(--text-muted)]">Sources</p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {sourceCount} file(s)
            </p>
          </div>
          <div className="w-px h-8 bg-[var(--bg-card-hover)]" />
          <div>
            <p className="text-xs text-[var(--text-muted)]">Fields</p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {selectedTemplate?.fields.length || 0}
            </p>
          </div>
        </div>
        
        {extractedText && (
          <button 
            onClick={() => setShowPreview(true)}
            className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-2 border border-[var(--lc-primary)]/30 text-[var(--lc-primary)] hover:bg-[var(--lc-primary)]/10"
          >
            <span>📄</span> Xem trước Extracted Text
          </button>
        )}
      </div>

      {/* Config fields */}
      <div className="grid grid-cols-2 gap-4">
        {/* Article Count */}
        <div className="space-y-2 col-span-2 md:col-span-1">
          <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Số lượng bài viết cần tạo
          </label>
          <input
            type="number"
            value={config.articleCount}
            onChange={(e) => updateConfig('articleCount', parseInt(e.target.value) || 1)}
            className="input-field"
            min={1}
            max={20}
          />
        </div>
        
        {/* Tone */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Giọng văn
          </label>
          <select
            value={config.tone}
            onChange={(e) => updateConfig('tone', e.target.value)}
            className="input-field appearance-none cursor-pointer"
          >
            <option value="professional">🏥 Chuyên nghiệp y khoa</option>
            <option value="friendly">😊 Thân thiện, dễ hiểu</option>
            <option value="academic">📚 Học thuật</option>
            <option value="conversational">💬 Hội thoại tự nhiên</option>
          </select>
        </div>

        {/* Language */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Ngôn ngữ
          </label>
          <select
            value={config.language}
            onChange={(e) => updateConfig('language', e.target.value)}
            className="input-field appearance-none cursor-pointer"
          >
            <option value="vi">🇻🇳 Tiếng Việt</option>
            <option value="en">🇺🇸 English</option>
            <option value="vi-en">🌐 Song ngữ Việt-Anh</option>
          </select>
        </div>

        {/* Min words */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Số từ tối thiểu
          </label>
          <input
            type="number"
            value={config.minWords}
            onChange={(e) => updateConfig('minWords', parseInt(e.target.value) || 0)}
            className="input-field"
            min={100}
            step={100}
          />
        </div>

        {/* Max words */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Số từ tối đa
          </label>
          <input
            type="number"
            value={config.maxWords}
            onChange={(e) => updateConfig('maxWords', parseInt(e.target.value) || 0)}
            className="input-field"
            min={100}
            step={100}
          />
        </div>
      </div>

      {/* Custom instructions */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          Hướng dẫn bổ sung (Optional)
        </label>
        <textarea
          value={config.customInstructions}
          onChange={(e) => updateConfig('customInstructions', e.target.value)}
          placeholder="Ví dụ: Tập trung vào đối tượng người cao tuổi, thêm số liệu thống kê Việt Nam..."
          className="input-field min-h-[100px] resize-y"
          rows={4}
        />
      </div>

      {/* Generate button */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span>AI sẽ phân tích và lên danh sách tiêu đề/dàn ý độc lập</span>
        </div>
        <button
          onClick={onGenerate}
          className="btn-primary flex items-center gap-2 text-base px-8 py-3"
        >
          <span>🎯</span>
          <span>Generate Plan</span>
        </button>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-[#0A0C10]/80 flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setShowPreview(false)}>
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)]">
              <h3 className="font-bold text-[var(--text-primary)]">Pre-generation Source Text Preview</h3>
              <button onClick={() => setShowPreview(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors">✕</button>
            </div>
            <div className="p-6 overflow-y-auto whitespace-pre-wrap text-[13px] text-[var(--text-secondary)] font-mono leading-relaxed custom-scrollbar">
              {extractedText}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

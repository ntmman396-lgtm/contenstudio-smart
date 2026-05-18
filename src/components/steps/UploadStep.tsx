'use client';

import React, { useState, useCallback } from 'react';
import { UploadedSource } from '@/types';

interface UploadStepProps {
  sources: UploadedSource[];
  onSourcesChange: (sources: UploadedSource[]) => void;
}

export default function UploadStep({ sources, onSourcesChange }: UploadStepProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === 'application/pdf'
    );
    const newSources: UploadedSource[] = files.map((file) => ({
      id: `src-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      type: 'pdf' as const,
      size: file.size,
      file,
    }));
    onSourcesChange([...sources, ...newSources]);
  }, [sources, onSourcesChange]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newSources: UploadedSource[] = files.map((file) => ({
      id: `src-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      type: 'pdf' as const,
      size: file.size,
      file,
    }));
    onSourcesChange([...sources, ...newSources]);
  }, [sources, onSourcesChange]);

  const addUrl = useCallback(() => {
    const url = urlInput.trim();
    if (!url) return;

    try {
      new URL(url);
    } catch {
      alert('Định dạng URL không hợp lệ. Vui lòng nhập URL hợp lệ bắt đầu bằng http:// hoặc https://');
      return;
    }

    const newSource: UploadedSource = {
      id: `src-${Date.now()}`,
      name: url,
      type: 'url',
      url: url,
    };
    onSourcesChange([...sources, newSource]);
    setUrlInput('');
  }, [urlInput, sources, onSourcesChange]);

  const removeSource = useCallback((id: string) => {
    onSourcesChange(sources.filter((s) => s.id !== id));
  }, [sources, onSourcesChange]);

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
          Upload Sources
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Thêm file PDF hoặc URLs làm nguồn tham khảo cho AI content generation
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-10 text-center
          transition-all duration-300 cursor-pointer group
          ${isDragging
            ? 'border-[var(--lc-primary)] bg-[var(--lc-primary)]/5 scale-[1.01]'
            : 'border-[var(--border-default)] hover:border-[var(--border-default)] hover:bg-[var(--bg-card-hover)]'
          }
        `}
      >
        <input
          type="file"
          accept=".pdf"
          multiple
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="space-y-3">
          <div className={`
            w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl
            transition-all duration-300
            ${isDragging ? 'scale-110 animate-float' : 'group-hover:scale-105'}
          `}
            style={{ background: 'linear-gradient(135deg, rgba(0,102,204,0.15), rgba(0,204,136,0.15))' }}
          >
            📄
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Kéo thả file PDF vào đây
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              hoặc click để chọn file • Hỗ trợ nhiều file cùng lúc
            </p>
          </div>
        </div>
      </div>

      {/* URL Input */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          Hoặc thêm URL
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addUrl()}
            placeholder="https://example.com/medical-article"
            className="input-field flex-1"
          />
          <button
            onClick={addUrl}
            disabled={!urlInput.trim()}
            className="btn-primary whitespace-nowrap"
          >
            + Thêm
          </button>
        </div>
      </div>

      {/* Source List */}
      {sources.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Nguồn đã thêm ({sources.length})
            </label>
          </div>
          <div className="space-y-2 stagger-children">
            {sources.map((source) => (
              <div
                key={source.id}
                className="glass-card glass-card-hover flex items-center gap-3 px-4 py-3 rounded-xl"
              >
                <div className={`
                  w-9 h-9 rounded-lg flex items-center justify-center text-sm shrink-0
                  ${source.type === 'pdf'
                    ? 'bg-red-500/15 text-red-400'
                    : 'bg-blue-500/15 text-blue-400'
                  }
                `}>
                  {source.type === 'pdf' ? '📄' : '🔗'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {source.name}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {source.type === 'pdf' ? `PDF • ${formatSize(source.size)}` : 'URL'}
                  </p>
                </div>
                <button
                  onClick={() => removeSource(source.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

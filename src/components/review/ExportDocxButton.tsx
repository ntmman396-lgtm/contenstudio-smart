'use client';

import React, { useState } from 'react';
import { exportBatchToDocx } from '@/lib/export-docx';

interface ExportDocxButtonProps {
  articleId: string;
  articleTitle?: string;
  /** Full width button style (for sidebar) */
  fullWidth?: boolean;
  /** Compact icon-only style (for inline) */
  compact?: boolean;
}

export default function ExportDocxButton({ articleId, articleTitle, fullWidth = true, compact = false }: ExportDocxButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExporting(true);
    try {
      const res = await fetch('/api/articles/export-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleIds: [articleId] }),
      });
      if (!res.ok) throw new Error('Failed to fetch article');
      const data = await res.json();
      if (data.length > 0) {
        // Use keyword from rawFields for filename, fallback to articleTitle/title
        const keyword = data[0].rawFields?.keywordChinh;
        const title = (keyword || articleTitle || data[0].title || 'article')
          .replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF\s-]/g, '').replace(/\s+/g, '_').slice(0, 50);
        const articlesWithKeyword = data.map((a: any) => ({ ...a, keyword: a.rawFields?.keywordChinh || a.keyword }));
        await exportBatchToDocx(articlesWithKeyword, title);
      }
    } catch (error) {
      console.error('DOCX export error:', error);
      alert('❌ Lỗi khi export DOCX.');
    } finally {
      setIsExporting(false);
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="text-[10px] font-medium px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
        title="Export DOCX"
      >
        {isExporting ? (
          <span className="w-3 h-3 border border-emerald-400 border-t-transparent rounded-full animate-spin inline-block" />
        ) : (
          '📄'
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={`${fullWidth ? 'w-full' : ''} btn-secondary text-xs py-2 flex items-center justify-center gap-2 
        bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 
        hover:border-emerald-500/40 transition-all disabled:opacity-50 disabled:cursor-wait font-medium`}
    >
      {isExporting ? (
        <>
          <span className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          Đang export...
        </>
      ) : (
        <>
          <span>📄</span> Export DOCX
        </>
      )}
    </button>
  );
}

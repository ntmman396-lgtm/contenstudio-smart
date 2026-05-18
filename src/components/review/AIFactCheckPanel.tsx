'use client';

import React, { useState } from 'react';
import { GeneratedArticle } from '@/types';
import { Bot, RefreshCw, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import type { AIFactCheckResult, AIFactCheckFinding } from '@/lib/qc/layers/layer2-ai-factcheck';

interface AIFactCheckPanelProps {
  article: GeneratedArticle;
  // Khối này có thể lấy content trực tiếp từ editor hoặc sử dụng content đã lưu trong Article
  contentOverride?: string;
}

export default function AIFactCheckPanel({ article, contentOverride }: AIFactCheckPanelProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<AIFactCheckResult | null>(null);
  const [error, setError] = useState('');

  // Initial load: parse existing AI findings from the article if they were saved previously
  const [existingFindings] = useState<AIFactCheckFinding[]>(() => {
    if (!article.qcFindings) return [];
    return article.qcFindings.filter((f: any) => f.rule_code?.startsWith('AI-FC-')) as any as AIFactCheckFinding[];
  });

  const handleRunFactCheck = async () => {
    setIsRunning(true);
    setError('');
    try {
      const res = await fetch('/api/qc-factcheck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          articleId: article.id,
          contentOverride: contentOverride || article.content 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'AI Fact-check execution failed');
      }

      setResult(data.result);
    } catch (e) {
      setError('Lỗi khi chạy Fact Check: ' + (e as Error).message);
    } finally {
      setIsRunning(false);
    }
  };

  const displayFindings = result?.findings || (result === null ? existingFindings : []);

  return (
    <div className="glass-card p-4 rounded-xl mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-bold text-[var(--lc-primary)] uppercase tracking-wider flex items-center gap-1.5">
          <Bot size={12} /> Fact Check (AI)
        </h3>
        <button
          onClick={handleRunFactCheck}
          disabled={isRunning}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] font-bold border transition-all ${
            isRunning
              ? 'bg-[var(--bg-card-hover)] text-[var(--text-muted)] border-[var(--border-default)] cursor-wait'
              : 'bg-purple-500/15 text-purple-400 border-purple-500/30 hover:bg-purple-500/25'
          }`}
        >
          <RefreshCw size={10} className={isRunning ? 'animate-spin' : ''} />
          {isRunning ? 'Đang phân tích...' : result ? 'Kiểm tra lại' : 'Kiểm tra Fact'}
        </button>
      </div>

      {error && (
        <div className="p-2 mb-3 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] text-red-400">
          {error}
        </div>
      )}

      {!result && existingFindings.length === 0 && !error && (
        <div className="text-center py-4">
          <p className="text-[10px] text-[var(--text-muted)] mb-1">
            Bấm "Kiểm tra Fact" để AI rà soát lỗi nội dung y khoa, nhầm lẫn khái niệm.
          </p>
          <p className="text-[9px] text-[var(--text-muted)]/60">
            *Dành cho người dụng tự kiểm tra lại sau khi đã chỉnh sửa bài.
          </p>
        </div>
      )}

      {(result || existingFindings.length > 0) && (
        <div className="space-y-3">
          {result && (
            <div className="p-2 rounded-lg bg-[var(--bg-card-hover)] text-center text-[10px] text-[var(--text-primary)] font-semibold">
              {result.summary}
            </div>
          )}

          {displayFindings.length > 0 ? (
            <div className="space-y-2">
              {displayFindings.map((finding, idx) => (
                <div key={idx} className={`p-2 rounded-lg border text-[9px] ${
                  finding.severity === 'critical' ? 'bg-red-500/10 border-red-500/20' :
                  finding.severity === 'warning' ? 'bg-amber-500/10 border-amber-500/20' :
                  'bg-blue-500/10 border-blue-500/20'
                }`}>
                  <div className="flex items-center gap-1 mb-1">
                    {finding.severity === 'critical' ? <ShieldAlert size={10} className="text-red-400" /> :
                     finding.severity === 'warning' ? <AlertTriangle size={10} className="text-amber-400" /> :
                     <Info size={10} className="text-blue-400" />}
                    <span className={`font-bold ${
                      finding.severity === 'critical' ? 'text-red-400' :
                      finding.severity === 'warning' ? 'text-amber-400' : 'text-blue-400'
                    }`}>
                      {finding.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[10px] font-semibold text-[var(--text-primary)] mb-1">{finding.detail}</p>
                  {finding.quote && (
                    <p className="pl-2 border-l-2 border-[var(--border-default)] text-[var(--text-muted)] italic mb-1.5">
                      "{finding.quote}"
                    </p>
                  )}
                  {finding.suggestion && (
                    <p className="text-emerald-400 font-medium">Gợi ý: {finding.suggestion}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
             <div className="p-3 text-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-bold">
               ✓ Bài viết an toàn, không phát hiện lỗi fact y khoa!
             </div>
          )}
        </div>
      )}
    </div>
  );
}

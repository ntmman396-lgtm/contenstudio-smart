import React from 'react';
import { GeneratedArticle, CitationVerification } from '@/types';

export default function CitationBadges({ article }: { article: GeneratedArticle }) {
  const rawVerification = article.citationVerification;
  let verifications: CitationVerification[] = [];

  if (Array.isArray(rawVerification)) {
    verifications = rawVerification;
  } else if (typeof rawVerification === 'string') {
    try {
      const parsed = JSON.parse(rawVerification);
      if (Array.isArray(parsed)) {
        verifications = parsed;
      }
    } catch (e) {}
  }

  if (verifications.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-[var(--border-default)]">
      <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
        Trạng Thái Link Tham Khảo (Auto-Verified)
      </h4>
      <div className="space-y-2">
        {verifications.map((verify: CitationVerification, i: number) => {
          let badge = null;
          if (verify.status === 'verified') {
            badge = <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-medium">✅ Sống (có nội dung)</span>;
          } else if (verify.status === 'dead') {
            badge = <span className="text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20 font-medium">❌ Link Chết ({verify.httpStatus || 404})</span>;
          } else if (verify.status === 'timeout') {
            badge = <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20 font-medium">⏱️ Timeout</span>;
          } else {
            badge = <span className="text-[10px] bg-[var(--bg-card-hover)] text-[var(--text-muted)] px-1.5 py-0.5 rounded border border-[var(--border-default)]">Không có URL</span>;
          }

          return (
            <div key={i} className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-default)]">
              <div className="flex items-start justify-between gap-2">
                <a 
                  href={verify.url || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[11px] font-medium text-[var(--lc-primary)] hover:underline truncate max-w-[80%]"
                >
                  {verify.url || 'Reference text only'}
                </a>
                {badge}
              </div>
              {verify.pageTitle && (
                <p className="text-[10px] text-[var(--text-secondary)] font-semibold truncate">Tựa đề: {verify.pageTitle}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

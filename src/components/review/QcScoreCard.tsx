'use client';

import React, { useState } from 'react';
import { GeneratedArticle } from '@/types';
import { TECH_LAYER_CONFIG, CONTENT_LAYER_CONFIG, QC_WEIGHT_CONFIG, computeGrade } from '@/lib/qc/section-config';
import { getDeductionReason } from '@/lib/qc/qc-explain';

type TabKey = 'overview' | 'tech' | 'content' | 'risk' | 'safety' | 'links';

export default function QcScoreCard({ article }: { article: GeneratedArticle }) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Use real data only — no mock fallback
  const hasFullQc = article.qcTechScore !== undefined && article.qcContentScore !== undefined;
  const resolvedTotal = article.qcScore ?? 0;

  const techScore = hasFullQc ? article.qcTechScore! : { total: 0, format: 0, link: 0, image: 0, seo: 0 };
  const contentScore = hasFullQc ? article.qcContentScore! : { total: 0, accuracy: 0, depth: 0, citation: 0, tone: 0 };

  const overallGrade = (article.qcGrade ?? computeGrade(resolvedTotal)) as string;
  const techGrade = hasFullQc ? (article.qcTechGrade ?? computeGrade(techScore.total)) : computeGrade(techScore.total);
  const contentGrade = hasFullQc ? (article.qcContentGrade ?? computeGrade(contentScore.total)) : computeGrade(contentScore.total);

  const autoFixCount = article.qcAutoFixes ?? 0;
  const manualCount = article.qcManualIssues ?? 0;

  // Layer 3 data from article
  const riskScore = article.qcRiskScore ?? null;
  const safetyScore = article.qcSafetyScore ?? null;
  const fsi = article.qcFinalSafetyIndex ?? null;
  const decision = article.qcDecision ?? null;
  const riskLevel = article.qcRiskLevel ?? null;

  const gradeColor = 
    overallGrade === 'A' || overallGrade === 'B' ? 'text-emerald-400' :
    overallGrade === 'C' ? 'text-amber-400' : 'text-red-400';

  const ringColor =
    resolvedTotal >= 80 ? '#34d399' :
    resolvedTotal >= 70 ? '#fbbf24' :
    resolvedTotal >= 60 ? '#f97316' : '#f87171';

  const decisionColor = !decision ? 'text-gray-400' :
    decision === 'SAFE_TO_PUBLISH' ? 'text-emerald-400' :
    decision === 'REVIEW' ? 'text-amber-400' :
    decision === 'NEEDS_REVISION' ? 'text-orange-400' : 'text-red-400';

  const decisionBg = !decision ? 'bg-gray-500/10 border-gray-500/15' :
    decision === 'SAFE_TO_PUBLISH' ? 'bg-emerald-500/10 border-emerald-500/20' :
    decision === 'REVIEW' ? 'bg-amber-500/10 border-amber-500/20' :
    decision === 'NEEDS_REVISION' ? 'bg-orange-500/10 border-orange-500/20' : 'bg-red-500/10 border-red-500/20';

  return (
    <div className="glass-card p-4 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">QC Score</h3>
        <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
          overallGrade === 'A' || overallGrade === 'B' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
          overallGrade === 'C' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
          'bg-red-500/15 text-red-400 border-red-500/30'
        }`}>
          Grade {overallGrade}
        </span>
      </div>

      {/* Ring */}
      <div className="flex items-center justify-center mb-2">
        <div className="relative w-20 h-20">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
            <circle cx="18" cy="18" r="16" fill="none" stroke={ringColor} strokeWidth="3" strokeDasharray={`${resolvedTotal}, 100`} strokeLinecap="round" />
          </svg>
          <span className={`absolute inset-0 flex items-center justify-center text-lg font-black ${gradeColor}`}>
            {resolvedTotal}
          </span>
        </div>
      </div>

      {/* Formula */}
      <p className="text-[9px] text-[var(--text-muted)] text-center mb-3 font-mono">
        = {techScore.total}×{QC_WEIGHT_CONFIG.tech} + {contentScore.total}×{QC_WEIGHT_CONFIG.content}
      </p>

      {/* ─── LAYER 3 DECISION BADGE ────────────────────────── */}
      {decision && (
        <div className={`p-2.5 rounded-lg border mb-3 ${decisionBg}`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${decisionColor}`}>
              🛡️ {decision.replace(/_/g, ' ')}
            </span>
            {fsi !== null && (
              <span className={`text-xs font-black ${decisionColor}`}>
                FSI: {fsi.toFixed(1)}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="text-center p-1 rounded bg-black/15">
              <p className="text-[7px] text-[var(--text-muted)] uppercase font-bold">Risk</p>
              <p className={`text-[11px] font-black ${
                riskScore !== null && riskScore >= 50 ? 'text-red-400' :
                riskScore !== null && riskScore >= 20 ? 'text-amber-400' : 'text-emerald-400'
              }`}>{riskScore ?? '—'}</p>
            </div>
            <div className="text-center p-1 rounded bg-black/15">
              <p className="text-[7px] text-[var(--text-muted)] uppercase font-bold">Safety</p>
              <p className={`text-[11px] font-black ${
                safetyScore !== null && safetyScore >= 80 ? 'text-emerald-400' :
                safetyScore !== null && safetyScore >= 50 ? 'text-amber-400' : 'text-red-400'
              }`}>{safetyScore ?? '—'}</p>
            </div>
          </div>
          {riskLevel && (
            <div className={`mt-1.5 text-center text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
              riskLevel === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
              riskLevel === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
              riskLevel === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' :
              'bg-emerald-500/20 text-emerald-400'
            }`}>
              Risk Level: {riskLevel}
            </div>
          )}
        </div>
      )}

      {/* Layer Tab Selector — Now 6 tabs */}
      <div className="flex bg-[var(--bg-card-hover)] rounded-lg p-0.5 mb-3 flex-wrap gap-0.5">
        {[
          { id: 'overview' as TabKey, label: 'Tổng', activeColor: 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm' },
          { id: 'tech' as TabKey, label: '🔧 KT', activeColor: 'bg-blue-500/20 text-blue-400 shadow-sm' },
          { id: 'content' as TabKey, label: '📋 ND', activeColor: 'bg-purple-500/20 text-purple-400 shadow-sm' },
          { id: 'risk' as TabKey, label: '⚡ RR', activeColor: 'bg-red-500/20 text-red-400 shadow-sm' },
          { id: 'safety' as TabKey, label: '🛡️ AT', activeColor: 'bg-emerald-500/20 text-emerald-400 shadow-sm' },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 text-[8px] font-bold py-1 rounded-md transition-all ${
              activeTab === tab.id ? tab.activeColor : 'text-[var(--text-muted)]'
            }`}
          >{tab.label}</button>
        ))}
      </div>

      {/* Layer Content */}
      {activeTab === 'overview' ? (
        <div className="space-y-2 mb-3">
          {/* Tech summary row */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/5 border border-blue-500/10">
            <span className="text-[9px] font-bold text-blue-400 w-16">🔧 KT</span>
            <div className="flex-1 h-1.5 bg-[var(--bg-card-hover)] rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${techScore.total >= 80 ? 'bg-emerald-500' : techScore.total >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${techScore.total}%` }} />
            </div>
            <span className={`text-[9px] font-bold w-14 text-right ${techScore.total >= 80 ? 'text-emerald-400' : techScore.total >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
              {techScore.total}/100
            </span>
          </div>
          {/* Content summary row */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-500/5 border border-purple-500/10">
            <span className="text-[9px] font-bold text-purple-400 w-16">📋 ND</span>
            <div className="flex-1 h-1.5 bg-[var(--bg-card-hover)] rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${contentScore.total >= 80 ? 'bg-emerald-500' : contentScore.total >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${contentScore.total}%` }} />
            </div>
            <span className={`text-[9px] font-bold w-14 text-right ${contentScore.total >= 80 ? 'text-emerald-400' : contentScore.total >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
              {contentScore.total}/100
            </span>
          </div>
          {/* Risk row */}
          {riskScore !== null && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/5 border border-red-500/10">
              <span className="text-[9px] font-bold text-red-400 w-16">⚡ RR</span>
              <div className="flex-1 h-1.5 bg-[var(--bg-card-hover)] rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-red-500" style={{ width: `${riskScore}%` }} />
              </div>
              <span className={`text-[9px] font-bold w-14 text-right ${riskScore >= 50 ? 'text-red-400' : riskScore >= 20 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {riskScore}/100
              </span>
            </div>
          )}
          {/* Safety row */}
          {safetyScore !== null && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
              <span className="text-[9px] font-bold text-emerald-400 w-16">🛡️ AT</span>
              <div className="flex-1 h-1.5 bg-[var(--bg-card-hover)] rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${safetyScore}%` }} />
              </div>
              <span className={`text-[9px] font-bold w-14 text-right ${safetyScore >= 80 ? 'text-emerald-400' : safetyScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                {safetyScore}/100
              </span>
            </div>
          )}
        </div>
      ) : activeTab === 'risk' ? (
        <div className="space-y-2 mb-3">
          {riskScore !== null ? (
            <>
              <div className={`p-2.5 rounded-lg border text-center ${
                riskLevel === 'CRITICAL' ? 'bg-red-500/10 border-red-500/20' :
                riskLevel === 'HIGH' ? 'bg-orange-500/10 border-orange-500/20' :
                riskLevel === 'MEDIUM' ? 'bg-amber-500/10 border-amber-500/20' :
                'bg-emerald-500/10 border-emerald-500/20'
              }`}>
                <p className="text-[8px] text-[var(--text-muted)] uppercase font-bold">Risk Score</p>
                <p className={`text-2xl font-black ${
                  riskScore >= 50 ? 'text-red-400' : riskScore >= 20 ? 'text-amber-400' : 'text-emerald-400'
                }`}>{riskScore}</p>
                <p className={`text-[9px] font-black uppercase ${
                  riskLevel === 'CRITICAL' ? 'text-red-400' :
                  riskLevel === 'HIGH' ? 'text-orange-400' :
                  riskLevel === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
                }`}>{riskLevel}</p>
              </div>
              <p className="text-[8px] text-[var(--text-muted)] font-mono p-2 bg-black/15 rounded">
                = claim×40 + self×8 + dosage×25 + warn×15 + conflict×30
              </p>
            </>
          ) : (
            <div className="text-center py-4 text-[var(--text-muted)]">
              <p className="text-[10px]">🛡️ Chưa chạy Layer 3A</p>
              <p className="text-[8px] mt-1">Chạy lại QC để kích hoạt phân tích rủi ro</p>
            </div>
          )}
        </div>
      ) : activeTab === 'safety' ? (
        <div className="space-y-2 mb-3">
          {safetyScore !== null ? (
            <>
              <div className={`p-2.5 rounded-lg border text-center ${
                safetyScore >= 80 ? 'bg-emerald-500/10 border-emerald-500/20' :
                safetyScore >= 50 ? 'bg-amber-500/10 border-amber-500/20' :
                'bg-red-500/10 border-red-500/20'
              }`}>
                <p className="text-[8px] text-[var(--text-muted)] uppercase font-bold">Safety Score</p>
                <p className={`text-2xl font-black ${
                  safetyScore >= 80 ? 'text-emerald-400' : safetyScore >= 50 ? 'text-amber-400' : 'text-red-400'
                }`}>{safetyScore}</p>
              </div>
              {fsi !== null && (
                <div className="p-2 bg-black/15 rounded">
                  <p className="text-[8px] text-[var(--text-muted)] font-mono">
                    FSI = safety({safetyScore}) − risk({riskScore})×0.8
                  </p>
                  <p className={`text-sm font-black ${
                    fsi >= 60 ? 'text-emerald-400' : fsi >= 30 ? 'text-amber-400' : 'text-red-400'
                  }`}>= {fsi.toFixed(1)}</p>
                </div>
              )}
              <p className="text-[8px] text-[var(--text-muted)] font-mono p-2 bg-black/15 rounded">
                = disclaimer×20 + escalation×25 + warning×20 + condition×20 + population×15
              </p>
            </>
          ) : (
            <div className="text-center py-4 text-[var(--text-muted)]">
              <p className="text-[10px]">🛡️ Chưa chạy Layer 3B</p>
              <p className="text-[8px] mt-1">Layer 3B kiểm tra sau khi editor chỉnh sửa</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-1.5 mb-3">
          {(activeTab === 'tech' ? TECH_LAYER_CONFIG : CONTENT_LAYER_CONFIG).map(cfg => {
            const currentLayer = activeTab as 'tech' | 'content';
            const sub = currentLayer === 'tech' ? (techScore as any)[cfg.id] ?? cfg.max : (contentScore as any)[cfg.id] ?? cfg.max;
            const pct = (sub / cfg.max) * 100;
            const isMax = sub === cfg.max;
            
            // Get REAL findings for this sub-dimension (specific to this article)
            const realFindings = (article.qcFindings || []).filter(
              f => f.layer === currentLayer && f.sub === cfg.id && f.deduction > 0 && f.detail
            );
            // Fallback to generic reason if no real findings saved (older articles)
            const fallbackReason = realFindings.length === 0 && !isMax
              ? getDeductionReason(currentLayer, cfg.id, sub, cfg.max)
              : null;
            
            return (
              <div key={cfg.id}>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-semibold text-[var(--text-secondary)] w-20 shrink-0 truncate" title={cfg.label}>
                    {cfg.shortLabel}
                  </span>
                  <div className="flex-1 h-1.5 bg-[var(--bg-card-hover)] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${isMax ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={`text-[9px] font-bold w-10 text-right ${isMax ? 'text-emerald-400' : pct >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                    {sub}/{cfg.max}
                  </span>
                </div>
                {/* Real findings: show each specific deduction reason */}
                {realFindings.map((f, i) => (
                  <div key={i} className="ml-[88px] mt-1">
                    <p className={`text-[8px] leading-tight font-medium ${
                      f.severity === 'critical' ? 'text-red-400' : f.severity === 'warning' ? 'text-amber-400' : 'text-blue-400'
                    }`}>
                      {f.severity === 'critical' ? '🔴' : f.severity === 'warning' ? '🟡' : '🔵'}{' '}
                      −{f.deduction}đ: {f.detail}
                    </p>
                    {f.quote && (
                      <p className="text-[7.5px] text-[var(--text-muted)] mt-0.5 pl-2 border-l border-[var(--border-default)] italic leading-snug line-clamp-2">
                        &ldquo;{f.quote}&rdquo;
                      </p>
                    )}
                    {f.suggestion && (
                      <p className="text-[7.5px] text-emerald-400/70 mt-0.5 leading-snug">
                        💡 {f.suggestion}
                      </p>
                    )}
                  </div>
                ))}
                {/* Fallback generic reason */}
                {fallbackReason && (
                  <p className="text-[8px] text-amber-400/80 ml-[88px] mt-0.5 leading-tight">↳ {fallbackReason}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Auto-fix summary */}
      {autoFixCount > 0 && (
        <div className="pt-2 border-t border-[var(--border-default)]">
          <p className="text-[9px] text-emerald-400 font-bold mb-1">✓ {autoFixCount} lỗi đã auto-fix</p>
        </div>
      )}

      {/* Manual issues */}
      {manualCount > 0 && (
        <div className="pt-1">
          <p className="text-[9px] text-amber-400 font-bold">⚠ {manualCount} lỗi cần sửa tay</p>
        </div>
      )}
    </div>
  );
}

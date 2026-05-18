'use client';

import React, { useState } from 'react';
import { GeneratedArticle } from '@/types';
import { TECH_LAYER_CONFIG, CONTENT_LAYER_CONFIG, QC_FLOOR_CONFIG } from '@/lib/qc/section-config';
import type { QCResult } from '@/lib/qc/engine';
import type { FinalQCReport } from '@/lib/qc/safety-types';
import { 
  CheckCircle2, AlertTriangle, RefreshCw, ChevronDown, ChevronUp, ShieldAlert,
  Shield, Zap, Link2, MapPin, ArrowRight
} from 'lucide-react';

interface QcContentPanelProps {
  article: GeneratedArticle;
  onQcComplete?: (result: QCResult, updatedArticle: GeneratedArticle) => void;
}

export default function QcContentPanel({ article, onQcComplete }: QcContentPanelProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [qcResult, setQcResult] = useState<QCResult | null>(null);
  const [safetyReport, setSafetyReport] = useState<FinalQCReport | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAutoFixHistory, setShowAutoFixHistory] = useState(false);
  const [activeLayer, setActiveLayer] = useState<'tech' | 'content' | 'risk' | 'safety' | 'links'>('tech');
  const [error, setError] = useState('');

  const hasQcData = article.qcScore !== undefined;

  const handleRunQC = async () => {
    setIsRunning(true);
    setError('');
    try {
      const res = await fetch('/api/qc-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: article.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'QC execution failed');
      }

      const result = data.qcResult as QCResult;
      setQcResult(result);

      if (data.safetyReport) {
        setSafetyReport(data.safetyReport as FinalQCReport);
      }

      if (data.updatedArticle) {
        onQcComplete?.(result, data.updatedArticle as GeneratedArticle);
      }
    } catch (e) {
      setError('Lỗi khi chạy QC: ' + (e as Error).message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunFix = async () => {
    setIsFixing(true);
    setError('');
    try {
      const res = await fetch('/api/qc-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: article.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI Fix failed');
      
      // Auto re-run QC after a successful fix
      if (data.success && data.fixedCount > 0) {
        await handleRunQC(); // Re-evaluate and fetch new article state
      } else {
        setError(data.message || 'Không có lỗi cần sửa');
      }
    } catch (e) {
      setError('Lỗi AI sửa bài: ' + (e as Error).message);
    } finally {
      setIsFixing(false);
    }
  };

  // Convenience references
  const riskData = safetyReport?.details?.risk;
  const safetyData = safetyReport?.details?.safety;
  const editHistory = safetyReport?.editHistory;
  const linkAnalysis = safetyReport?.linkAnalysis;

  const decisionColor = !safetyReport ? '' :
    safetyReport.decision === 'SAFE_TO_PUBLISH' ? 'text-emerald-400' :
    safetyReport.decision === 'REVIEW' ? 'text-amber-400' :
    safetyReport.decision === 'NEEDS_REVISION' ? 'text-orange-400' : 'text-red-400';

  return (
    <div className="glass-card p-4 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
          <span className="text-[var(--lc-primary)]">🔍</span> QC TỔNG THỂ (CORE)
        </h3>
        <button
          onClick={handleRunQC}
          disabled={isRunning}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] font-bold border transition-all ${
            isRunning
              ? 'bg-[var(--bg-card-hover)] text-[var(--text-muted)] border-[var(--border-default)] cursor-wait'
              : 'bg-[var(--lc-primary)]/15 text-[var(--lc-primary)] border-[var(--lc-primary)]/30 hover:bg-[var(--lc-primary)]/25'
          }`}
        >
          <RefreshCw size={10} className={isRunning ? 'animate-spin' : ''} />
          {isRunning ? 'Đang chạy...' : qcResult ? 'Chạy lại QC' : 'Chạy QC'}
        </button>
      </div>

      {error && (
        <div className="p-2 mb-3 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] text-red-400">
          {error}
        </div>
      )}

      {/* If QC has been run, show results */}
      {qcResult ? (
        <div className="space-y-3">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[var(--bg-card-hover)] p-2 rounded-lg text-center">
              <p className="text-[9px] text-[var(--text-muted)] font-bold">Tổng</p>
              <p className={`text-lg font-black ${qcResult.scoreTotal >= 80 ? 'text-emerald-400' : qcResult.scoreTotal >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                {qcResult.scoreTotal}
              </p>
            </div>
            <div className="bg-[var(--bg-card-hover)] p-2 rounded-lg text-center">
              <p className="text-[9px] text-[var(--text-muted)] font-bold">Auto-fix</p>
              <p className="text-lg font-black text-emerald-400">{qcResult.autoFixed.length}</p>
            </div>
            <div className="bg-[var(--bg-card-hover)] p-2 rounded-lg text-center">
              <p className="text-[9px] text-[var(--text-muted)] font-bold">Manual</p>
              <p className="text-lg font-black text-amber-400">{qcResult.manualRequired.length}</p>
            </div>
          </div>

          {/* ─── LAYER 3 DECISION BADGE ────────────────────── */}
          {safetyReport && (
            <div className={`p-2.5 rounded-lg border ${
              safetyReport.decision === 'SAFE_TO_PUBLISH' ? 'bg-emerald-500/10 border-emerald-500/20' :
              safetyReport.decision === 'REVIEW' ? 'bg-amber-500/10 border-amber-500/20' :
              safetyReport.decision === 'NEEDS_REVISION' ? 'bg-orange-500/10 border-orange-500/20' :
              'bg-red-500/10 border-red-500/20'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${decisionColor}`}>
                  <Shield size={10} /> {safetyReport.decision.replace(/_/g, ' ')}
                </span>
                <span className={`text-xs font-black ${decisionColor}`}>
                  FSI: {safetyReport.final_safety_index.toFixed(1)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="text-center p-1 rounded bg-black/15">
                  <p className="text-[7px] text-[var(--text-muted)] uppercase font-bold">Risk</p>
                  <p className={`text-[11px] font-black ${safetyReport.risk_score >= 50 ? 'text-red-400' : safetyReport.risk_score >= 20 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {safetyReport.risk_score}/100
                  </p>
                </div>
                <div className="text-center p-1 rounded bg-black/15">
                  <p className="text-[7px] text-[var(--text-muted)] uppercase font-bold">Safety</p>
                  <p className={`text-[11px] font-black ${safetyReport.safety_score >= 80 ? 'text-emerald-400' : safetyReport.safety_score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                    {safetyReport.safety_score}/100
                  </p>
                </div>
              </div>
              {safetyReport.isHardBlocked && (
                <div className="mt-1.5 p-1.5 bg-red-500/20 rounded text-[9px] text-red-300 font-bold flex items-center gap-1">
                  <ShieldAlert size={10} /> BLOCKED: {safetyReport.blockReason}
                </div>
              )}
            </div>
          )}

          {/* Two-Layer Summary */}
          <div className="grid grid-cols-2 gap-2">
            <div className={`p-2 rounded-lg border text-center ${
              qcResult.techScore.total >= QC_FLOOR_CONFIG.techMin ? 'bg-blue-500/5 border-blue-500/15' : 'bg-red-500/10 border-red-500/25'
            }`}>
              <p className="text-[9px] text-blue-400 font-bold">🔧 Kỹ thuật</p>
              <p className={`text-sm font-black mt-0.5 ${qcResult.techScore.total >= 80 ? 'text-emerald-400' : qcResult.techScore.total >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                {qcResult.techScore.total}/100
              </p>
              <span className={`text-[8px] font-bold ${qcResult.techGrade === 'A' || qcResult.techGrade === 'B' ? 'text-emerald-400' : 'text-amber-400'}`}>
                Grade {qcResult.techGrade}
              </span>
            </div>
            <div className={`p-2 rounded-lg border text-center ${
              qcResult.contentScore.total >= QC_FLOOR_CONFIG.contentMin ? 'bg-purple-500/5 border-purple-500/15' : 'bg-red-500/10 border-red-500/25'
            }`}>
              <p className="text-[9px] text-purple-400 font-bold">📋 Nội dung</p>
              <p className={`text-sm font-black mt-0.5 ${qcResult.contentScore.total >= 80 ? 'text-emerald-400' : qcResult.contentScore.total >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                {qcResult.contentScore.total}/100
              </p>
              <span className={`text-[8px] font-bold ${qcResult.contentGrade === 'A' || qcResult.contentGrade === 'B' ? 'text-emerald-400' : 'text-amber-400'}`}>
                Grade {qcResult.contentGrade}
              </span>
            </div>
          </div>

          {/* Floor violation */}
          {qcResult.syncBlocked && qcResult.blockedReason && (
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-[9px] text-red-400 font-bold flex items-center gap-1">
                <ShieldAlert size={10} /> Sync Blocked
              </p>
              <p className="text-[9px] text-red-300/80 mt-0.5">{qcResult.blockedReason}</p>
            </div>
          )}

          {/* ─── AUTO-FIX HISTORY WITH POSITIONS ──────────── */}
          <div>
            <button
              onClick={() => setShowAutoFixHistory(!showAutoFixHistory)}
              className="w-full flex items-center justify-between text-[9px] font-bold text-emerald-400 py-1"
            >
              <span className="flex items-center gap-1">
                <CheckCircle2 size={10} /> Lịch Sử Auto-Fix
                ({editHistory ? editHistory.reduce((s, h) => s + h.total_edits, 0) : qcResult.autoFixed.length} chỉnh sửa)
              </span>
              {showAutoFixHistory ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </button>

            {showAutoFixHistory && editHistory && editHistory.length > 0 && (
              <div className="space-y-3 mt-1">
                {editHistory.map((layerHist, layerIdx) => (
                  <div key={layerIdx}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                        layerHist.layer === 'tech' ? 'bg-blue-500/15 text-blue-400' : 'bg-purple-500/15 text-purple-400'
                      }`}>
                        {layerHist.layer === 'tech' ? '🔧 L1' : '📋 L2'} ({layerHist.total_edits})
                      </span>
                    </div>
                    {layerHist.edits.length > 0 ? (
                      <div className="space-y-1">
                        {layerHist.edits.map((edit, idx) => (
                          <div key={idx} className="p-1.5 bg-black/15 rounded border border-[var(--border-default)]">
                            <div className="flex items-center gap-1 text-[8px] text-[var(--text-muted)] mb-0.5">
                              <MapPin size={8} />
                              <span className="font-bold">{edit.section}</span>
                              {edit.lineApprox > 0 && <span>· L{edit.lineApprox}</span>}
                              <span className="ml-auto font-mono text-[7px]">{edit.rule_code}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[9px]">
                              <span className="text-red-400 line-through truncate max-w-[40%]">{edit.original}</span>
                              <ArrowRight size={8} className="text-[var(--text-muted)] shrink-0" />
                              <span className="text-emerald-400 font-bold truncate max-w-[40%]">{edit.fixed}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[8px] text-emerald-400/50 italic">Không có chỉnh sửa</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {showAutoFixHistory && !editHistory && qcResult.autoFixed.length > 0 && (
              <div className="space-y-1 mt-1">
                {qcResult.autoFixed.map((fix: any, i: number) => (
                  <div key={i} className="text-[9px] bg-emerald-500/5 border border-emerald-500/10 p-1.5 rounded">
                    <div className="flex items-center gap-1">
                      <span className="text-emerald-400">✓</span>
                      <span className="font-semibold text-[var(--text-primary)]">{fix.name || fix.original}</span>
                      <span className="text-[8px] text-[var(--text-muted)] ml-auto">{fix.layer === 'tech' ? '🔧' : '📋'} {fix.sub}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Manual issues */}
          {qcResult.manualRequired.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[9px] font-bold text-amber-400 flex items-center gap-1">
                  <AlertTriangle size={10} /> Cần Sửa Tay ({qcResult.manualRequired.length})
                </p>
                <button
                  onClick={handleRunFix}
                  disabled={isFixing || isRunning}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold transition-all ${
                    isFixing 
                      ? 'bg-[var(--bg-card-hover)] text-[var(--text-muted)] cursor-wait'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                  }`}
                  title="Tự động sửa các lỗi Nội dung và Y khoa bằng AI"
                >
                  <Zap size={9} className={isFixing ? 'animate-pulse text-amber-400' : ''} />
                  {isFixing ? 'AI Đang Sửa Lỗi...' : 'AI Sửa Lỗi (1 Click)'}
                </button>
              </div>
              <div className="space-y-1">
                {qcResult.manualRequired.map((issue: any, i: number) => (
                  <div key={i} className={`text-[9px] p-1.5 rounded border space-y-0.5 ${
                    issue.severity === 'critical'
                      ? 'bg-red-500/5 border-red-500/20'
                      : 'bg-amber-500/5 border-amber-500/10'
                  }`}>
                    <div className="flex items-center gap-1">
                      <span className={issue.severity === 'critical' ? 'text-red-400' : 'text-amber-400'}>
                        {issue.severity === 'critical' ? '✕' : '⚠'}
                      </span>
                      <span className="font-semibold text-[var(--text-primary)]">{issue.name}</span>
                      <span className="text-[8px] text-[var(--text-muted)] ml-auto">{issue.layer === 'tech' ? '🔧' : '📋'} {issue.sub}</span>
                    </div>
                    {issue.description && (
                      <p className="text-[var(--text-muted)] pl-3">{issue.description}</p>
                    )}
                    {issue.fix_instruction && (
                      <p className="text-blue-400/70 pl-3">→ {issue.fix_instruction}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Toggle full details */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-center gap-1 text-[9px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] py-1 transition-colors"
          >
            {showDetails ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            {showDetails ? 'Thu gọn' : 'Xem chi tiết theo tầng'}
          </button>

          {showDetails && (
            <div className="space-y-3 pt-1 border-t border-[var(--border-default)]">
              {/* 5-Layer tab */}
              <div className="flex bg-[var(--bg-card-hover)] rounded p-0.5 flex-wrap gap-0.5">
                {[
                  { id: 'tech' as const, label: `🔧 KT (${qcResult.techScore.total})`, color: 'blue' },
                  { id: 'content' as const, label: `📋 ND (${qcResult.contentScore.total})`, color: 'purple' },
                  { id: 'risk' as const, label: `⚡ RR (${safetyReport?.risk_score ?? '—'})`, color: 'red' },
                  { id: 'safety' as const, label: `🛡️ AT (${safetyReport?.safety_score ?? '—'})`, color: 'emerald' },
                  { id: 'links' as const, label: `🔗 (${linkAnalysis?.total_links ?? '—'})`, color: 'cyan' },
                ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveLayer(tab.id)} 
                    className={`flex-1 text-[8px] font-bold py-1 rounded transition-all ${
                      activeLayer === tab.id 
                        ? `bg-${tab.color}-500/20 text-${tab.color}-400` 
                        : 'text-[var(--text-muted)]'
                    }`}
                  >{tab.label}</button>
                ))}
              </div>
              
              {/* Tech / Content breakdown */}
              {(activeLayer === 'tech' || activeLayer === 'content') && (
                (activeLayer === 'tech' ? TECH_LAYER_CONFIG : CONTENT_LAYER_CONFIG).map(cfg => {
                  const score = activeLayer === 'tech' ? (qcResult.techScore as any)[cfg.id] ?? cfg.max : (qcResult.contentScore as any)[cfg.id] ?? cfg.max;
                  const pct = (score / cfg.max) * 100;
                  const isMax = score === cfg.max;
                  return (
                    <div key={cfg.id} className="flex items-center gap-2">
                      <span className="text-[9px] font-semibold text-[var(--text-secondary)] w-24 shrink-0 truncate">{cfg.shortLabel}</span>
                      <div className="flex-1 h-1.5 bg-[var(--bg-card-hover)] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${isMax ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={`text-[9px] font-bold w-10 text-right ${isMax ? 'text-emerald-400' : pct >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                        {score}/{cfg.max}
                      </span>
                    </div>
                  );
                })
              )}

              {/* Risk breakdown */}
              {activeLayer === 'risk' && riskData && (
                <div className="space-y-1.5">
                  {[
                    { label: '🚫 Dangerous Claim', active: riskData.dangerous_claim, desc: riskData.details.dangerous_claim_desc },
                    { label: '⚠️ Self-Treatment Risk', active: riskData.self_treatment_risk >= 3, desc: riskData.details.self_treatment_desc },
                    { label: '💊 Dosage Issue', active: riskData.dosage_issue, desc: riskData.details.dosage_issue_desc },
                    { label: '📝 Missing Warning', active: riskData.missing_warning, desc: riskData.details.missing_warning_desc },
                    { label: '🔀 Conflicting Dosage', active: riskData.conflicting_dosage, desc: riskData.details.conflicting_dosage_desc },
                  ].map((item, idx) => (
                    <div key={idx} className={`p-1.5 rounded border text-[9px] ${
                      item.active ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/5 border-emerald-500/10'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className="font-bold">{item.label}</span>
                        <span className={`font-bold ${item.active ? 'text-red-400' : 'text-emerald-400'}`}>
                          {item.active ? '⛔ DETECTED' : '✓ OK'}
                        </span>
                      </div>
                      {item.active && item.desc && (
                        <p className="text-red-300/70 mt-0.5 italic pl-4">{item.desc}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Safety breakdown */}
              {activeLayer === 'safety' && safetyData && (
                <div className="space-y-1.5">
                  {[
                    { label: 'Disclaimer (Khuyến cáo)', present: safetyData.has_disclaimer, w: 20 },
                    { label: 'Escalation (Khi nào đi khám)', present: safetyData.has_escalation, w: 25 },
                    { label: 'Warning (Chống chỉ định)', present: safetyData.has_warning, w: 20 },
                    { label: 'Condition Limit (Giới hạn)', present: safetyData.has_condition_limit, w: 20 },
                    { label: 'Special Population (Thai phụ...)', present: safetyData.has_special_population_warning, w: 15 },
                  ].map((item, idx) => (
                    <div key={idx} className={`p-1.5 rounded border text-[9px] flex justify-between ${
                      item.present ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-red-500/10 border-red-500/20'
                    }`}>
                      <span className="font-semibold text-[var(--text-secondary)]">{item.label}</span>
                      <span className={`font-bold ${item.present ? 'text-emerald-400' : 'text-red-400'}`}>
                        {item.present ? `✓ +${item.w}đ` : '✗ THIẾU'}
                      </span>
                    </div>
                  ))}
                  {safetyReport && (
                    <div className="p-1.5 bg-black/15 rounded text-[8px] font-mono text-[var(--text-muted)]">
                      FSI = {safetyData.safety_score} − {safetyReport.risk_score}×0.8 = <span className={`font-black text-[10px] ${safetyReport.final_safety_index >= 60 ? 'text-emerald-400' : 'text-red-400'}`}>{safetyReport.final_safety_index.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Links analysis */}
              {activeLayer === 'links' && linkAnalysis && (
                <div className="space-y-2">
                  <div className={`p-2 rounded-lg border text-center ${
                    linkAnalysis.total_links >= 5 && linkAnalysis.total_links <= 10
                      ? 'bg-emerald-500/10 border-emerald-500/20'
                      : 'bg-red-500/10 border-red-500/20'
                  }`}>
                    <p className="text-[8px] text-[var(--text-muted)] uppercase font-bold">Internal Links</p>
                    <p className={`text-sm font-black ${
                      linkAnalysis.total_links >= 5 && linkAnalysis.total_links <= 10 ? 'text-emerald-400' : 'text-red-400'
                    }`}>{linkAnalysis.total_links} <span className="text-[9px] text-[var(--text-muted)]">(5-10)</span></p>
                  </div>
                  {Object.entries(linkAnalysis.distribution_by_section).map(([section, count]) => (
                    <div key={section} className="flex justify-between text-[9px] py-0.5 border-b border-[var(--border-default)]">
                      <span className="text-[var(--text-secondary)] flex items-center gap-1"><MapPin size={8} /> {section}</span>
                      <span className="font-bold">{count as number}</span>
                    </div>
                  ))}
                  {linkAnalysis.issues.length > 0 && (
                    <div className="space-y-1">
                      {linkAnalysis.issues.map((issue, idx) => (
                        <div key={idx} className="p-1.5 bg-red-500/10 border border-red-500/20 rounded text-[9px] text-red-300">
                          ⚠ {issue}
                        </div>
                      ))}
                    </div>
                  )}
                  {linkAnalysis.is_balanced && (
                    <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 size={10} /> Links phân bổ đều ✓
                    </div>
                  )}
                </div>
              )}

              {activeLayer === 'risk' && !riskData && (
                <p className="text-[9px] text-[var(--text-muted)] text-center py-3">Chưa có dữ liệu Layer 3A</p>
              )}
              {activeLayer === 'safety' && !safetyData && (
                <p className="text-[9px] text-[var(--text-muted)] text-center py-3">Chưa có dữ liệu Layer 3B</p>
              )}
              {activeLayer === 'links' && !linkAnalysis && (
                <p className="text-[9px] text-[var(--text-muted)] text-center py-3">Chưa có dữ liệu phân tích link</p>
              )}
            </div>
          )}
        </div>
      ) : (
        /* No QC result yet — show prompt */
        <div className="text-center py-4">
          <p className="text-[10px] text-[var(--text-muted)] mb-2">
            {hasQcData ? 'Bấm "Chạy lại QC" để kiểm tra nội dung chi tiết.' : 'Bấm "Chạy QC" để kiểm tra chất lượng nội dung.'}
          </p>
          <p className="text-[9px] text-[var(--text-muted)]/60">
            5 tầng: Kỹ thuật + Nội dung + Rủi ro (3A) + An toàn (3B) + Internal Links
          </p>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { QCResult } from '@/lib/qc/engine';
import { TECH_LAYER_CONFIG, CONTENT_LAYER_CONFIG, QC_FLOOR_CONFIG } from '@/lib/qc/section-config';
import { 
  AlertCircle, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, 
  Play, Info, ShieldAlert, Layers, Shield, Link2, FileWarning, 
  Eye, Zap, MapPin, ArrowRight
} from 'lucide-react';

// Import safety types for Layer 3 display
import type { FinalQCReport, LayerEditHistory, LinkSiloAnalysis } from '@/lib/qc/safety-types';

interface QcPanelProps {
  result: QCResult;
  onRescore: () => void;
  // New: optional Layer 3 report
  safetyReport?: FinalQCReport | null;
}


export default function QcPanel({ result, onRescore, safetyReport }: QcPanelProps) {
  const [showAutoFix, setShowAutoFix] = useState(false);
  const [isRescoring, setIsRescoring] = useState(false);
  const [activeLayer, setActiveLayer] = useState<'tech' | 'content' | 'risk' | 'safety' | 'links'>('tech');

  const handleRescore = () => {
    setIsRescoring(true);
    setTimeout(() => {
      setIsRescoring(false);
      onRescore();
    }, 1500);
  };

  const criticalIssues = result.manualRequired.filter(i => i.severity === 'critical');
  const warningIssues = result.manualRequired.filter(i => i.severity === 'warning');
  const infoIssues = result.manualRequired.filter(i => i.severity === 'info');

  const techBelowFloor = result.techScore.total < QC_FLOOR_CONFIG.techMin;
  const contentBelowFloor = result.contentScore.total < QC_FLOOR_CONFIG.contentMin;

  // Safety report data
  const riskData = safetyReport?.details?.risk;
  const safetyData = safetyReport?.details?.safety;
  const editHistory = safetyReport?.editHistory;
  const linkAnalysis = safetyReport?.linkAnalysis;

  // Decision color
  const decisionColor = !safetyReport ? 'text-gray-500' :
    safetyReport.decision === 'SAFE_TO_PUBLISH' ? 'text-emerald-400' :
    safetyReport.decision === 'REVIEW' ? 'text-amber-400' :
    safetyReport.decision === 'NEEDS_REVISION' ? 'text-orange-400' : 'text-red-400';

  const decisionBg = !safetyReport ? 'bg-gray-500/10 border-gray-500/20' :
    safetyReport.decision === 'SAFE_TO_PUBLISH' ? 'bg-emerald-500/10 border-emerald-500/20' :
    safetyReport.decision === 'REVIEW' ? 'bg-amber-500/10 border-amber-500/20' :
    safetyReport.decision === 'NEEDS_REVISION' ? 'bg-orange-500/10 border-orange-500/20' : 'bg-red-500/10 border-red-500/20';

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)] overflow-y-auto custom-scrollbar border-l border-[var(--border-default)]">
      
      {/* ─── OVERALL SCORE CARD ────────────────────────────── */}
      <div className="p-5 border-b border-[var(--border-default)] bg-[var(--bg-secondary)] flex flex-col items-center">
        <div className="flex items-center justify-between w-full mb-4">
          <span className={`px-2.5 py-1 text-xs font-black uppercase tracking-wider rounded-lg border ${
             result.overallGrade === 'A' || result.overallGrade === 'B' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
             result.overallGrade === 'C' ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' :
             'bg-red-500/20 text-red-500 border-red-500/30'
          }`}>
             Grade {result.overallGrade}
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">2 phút trước</span>
        </div>
        
        <div className="flex flex-col items-center mb-4">
          <span className={`text-5xl font-black ${
            result.scoreTotal >= 80 ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]' :
            result.scoreTotal >= 70 ? 'text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]' :
            'text-red-400 drop-shadow-[0_0_15px_rgba(248,113,113,0.3)]'
          }`}>
            {result.scoreTotal}
            <span className="text-xl text-[var(--text-muted)] ml-1">/100</span>
          </span>
          <span className="text-[9px] text-[var(--text-muted)] mt-1 font-mono">
            = Kỹ thuật×0.4 + Nội dung×0.6
          </span>
          <span className="text-xs font-semibold text-[var(--text-secondary)] mt-2 bg-[var(--bg-card-hover)] px-3 py-1 rounded-full border border-[var(--border-default)] shadow-sm">
            {result.qcStatus}
          </span>
        </div>

        {/* ─── SAFETY DECISION BADGE (Layer 3) ──────────────── */}
        {safetyReport && (
          <div className={`w-full mb-3 p-3 rounded-lg border ${decisionBg}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Shield size={14} className={decisionColor} />
                <span className={`text-[10px] font-black uppercase tracking-wider ${decisionColor}`}>
                  {safetyReport.decision.replace(/_/g, ' ')}
                </span>
              </div>
              <span className={`text-xs font-black ${decisionColor}`}>
                FSI: {safetyReport.final_safety_index.toFixed(1)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-1.5 rounded bg-black/20">
                <p className="text-[8px] text-[var(--text-muted)] uppercase font-bold">Risk</p>
                <p className={`text-sm font-black ${
                  safetyReport.risk_score >= 50 ? 'text-red-400' : 
                  safetyReport.risk_score >= 20 ? 'text-amber-400' : 'text-emerald-400'
                }`}>{safetyReport.risk_score}</p>
              </div>
              <div className="text-center p-1.5 rounded bg-black/20">
                <p className="text-[8px] text-[var(--text-muted)] uppercase font-bold">Safety</p>
                <p className={`text-sm font-black ${
                  safetyReport.safety_score >= 80 ? 'text-emerald-400' : 
                  safetyReport.safety_score >= 50 ? 'text-amber-400' : 'text-red-400'
                }`}>{safetyReport.safety_score}</p>
              </div>
            </div>
            {safetyReport.isHardBlocked && (
              <div className="mt-2 p-1.5 bg-red-500/20 rounded text-[10px] text-red-300 font-bold flex items-center gap-1.5">
                <FileWarning size={12} /> BLOCKED: {safetyReport.blockReason}
              </div>
            )}
          </div>
        )}

        {/* Floor violation alerts */}
        {(techBelowFloor || contentBelowFloor) && (
          <div className="w-full mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/25">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 mb-1">
              <ShieldAlert size={12} /> NGƯỠNG TỐI THIỂU VI PHẠM
            </div>
            {techBelowFloor && (
              <p className="text-[10px] text-red-300/80">⚠ Kỹ thuật: {result.techScore.total}/100 &lt; {QC_FLOOR_CONFIG.techMin} → Block sync</p>
            )}
            {contentBelowFloor && (
              <p className="text-[10px] text-red-300/80">⚠ Nội dung: {result.contentScore.total}/100 &lt; {QC_FLOOR_CONFIG.contentMin} → Block sync</p>
            )}
          </div>
        )}

        <button 
          onClick={handleRescore}
          disabled={isRescoring}
          className="w-full flex justify-center items-center gap-2 btn-secondary py-2.5 text-xs border border-[var(--lc-primary)]/40 hover:bg-[var(--lc-primary)]/10 text-[var(--text-primary)]"
        >
          {isRescoring ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Play size={14} className="text-[var(--lc-primary)]" />}
          Chạy lại QC
        </button>
      </div>

      {/* ─── 5-TAB LAYER SELECTOR ─────────────────────────── */}
      <div className="flex border-b border-[var(--border-default)] bg-[var(--bg-secondary)]">
        {[
          { id: 'tech' as const, label: 'Kỹ Thuật', icon: '🔧', score: result.techScore.total, color: 'blue' },
          { id: 'content' as const, label: 'Nội Dung', icon: '📋', score: result.contentScore.total, color: 'purple' },
          { id: 'risk' as const, label: 'Rủi Ro', icon: '⚡', score: safetyReport?.risk_score ?? 0, color: 'red' },
          { id: 'safety' as const, label: 'An Toàn', icon: '🛡️', score: safetyReport?.safety_score ?? 0, color: 'emerald' },
          { id: 'links' as const, label: 'Links', icon: '🔗', score: linkAnalysis?.total_links ?? 0, color: 'cyan' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveLayer(tab.id)}
            className={`flex-1 p-2 text-center transition-all border-b-2 ${
              activeLayer === tab.id 
                ? `bg-${tab.color}-500/10 border-${tab.color}-500 text-${tab.color}-400` 
                : 'border-transparent hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)]'
            }`}
          >
            <p className="text-[10px]">{tab.icon}</p>
            <p className="text-[8px] font-bold uppercase mt-0.5">{tab.label}</p>
            <p className={`text-xs font-black mt-0.5 ${
              activeLayer === tab.id ? `text-${tab.color}-400` : 'text-[var(--text-secondary)]'
            }`}>{tab.score}</p>
          </button>
        ))}
      </div>

      {/* ─── LAYER BREAKDOWN ───────────────────────────────── */}
      <div className="p-5 border-b border-[var(--border-default)]">

        {/* ── Tech / Content Layer ── */}
        {(activeLayer === 'tech' || activeLayer === 'content') && (
          <>
            <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Layers size={12} />
              {activeLayer === 'tech' ? 'Tầng 1: Kỹ Thuật' : 'Tầng 2: Chuyên Môn'}
            </h4>
            <div className="space-y-3.5">
              {(activeLayer === 'tech' ? TECH_LAYER_CONFIG : CONTENT_LAYER_CONFIG).map(config => {
                 const score = activeLayer === 'tech' 
                   ? (result.techScore as any)[config.id] || 0
                   : (result.contentScore as any)[config.id] || 0;
                 const percentage = (score / config.max) * 100;
                 
                 return (
                  <div key={config.id} className="group relative">
                    <div className="flex justify-between items-center text-[10px] mb-1">
                      <span className="font-semibold text-[var(--text-secondary)]">{config.label}</span>
                      <span className={`font-bold ${score === config.max ? 'text-emerald-400' : score >= config.max * 0.6 ? 'text-amber-400' : 'text-red-400'}`}>
                        {score}/{config.max}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--bg-card-hover)] rounded-full overflow-hidden flex">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          score === config.max ? 'bg-emerald-500' : 
                          score >= config.max * 0.6 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                      <div className="h-full bg-red-400 opacity-20" style={{ width: `${100 - percentage}%`}} />
                    </div>
                    <p className="text-[9px] text-[var(--text-muted)] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">{config.description}</p>
                  </div>
                 );
              })}
            </div>
          </>
        )}

        {/* ── Layer 3A: Risk Precheck ── */}
        {activeLayer === 'risk' && (
          <>
            <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Zap size={12} /> Tầng 3A: Phân Tích Rủi Ro
            </h4>
            {riskData ? (
              <div className="space-y-3">
                {/* Risk Level Badge */}
                <div className={`p-3 rounded-lg border ${
                  riskData.risk_level === 'CRITICAL' ? 'bg-red-500/15 border-red-500/30' :
                  riskData.risk_level === 'HIGH' ? 'bg-orange-500/15 border-orange-500/30' :
                  riskData.risk_level === 'MEDIUM' ? 'bg-amber-500/15 border-amber-500/30' :
                  'bg-emerald-500/15 border-emerald-500/30'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-black ${
                      riskData.risk_level === 'CRITICAL' ? 'text-red-400' :
                      riskData.risk_level === 'HIGH' ? 'text-orange-400' :
                      riskData.risk_level === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
                    }`}>{riskData.risk_level}</span>
                    <span className="text-lg font-black text-[var(--text-primary)]">{riskData.risk_score}<span className="text-[10px] text-[var(--text-muted)]">/100</span></span>
                  </div>
                </div>

                {/* Risk Checklist */}
                {[
                  { label: 'Dangerous Claim', active: riskData.dangerous_claim, desc: riskData.details.dangerous_claim_desc, weight: 40, icon: '🚫' },
                  { label: 'Self-Treatment Risk', active: riskData.self_treatment_risk >= 3, desc: riskData.details.self_treatment_desc, weight: `${riskData.self_treatment_risk}/5`, icon: '⚠️' },
                  { label: 'Dosage Issue', active: riskData.dosage_issue, desc: riskData.details.dosage_issue_desc, weight: 25, icon: '💊' },
                  { label: 'Missing Warning', active: riskData.missing_warning, desc: riskData.details.missing_warning_desc, weight: 15, icon: '📝' },
                  { label: 'Conflicting Dosage', active: riskData.conflicting_dosage, desc: riskData.details.conflicting_dosage_desc, weight: 30, icon: '🔀' },
                ].map((item, idx) => (
                  <div key={idx} className={`p-2.5 rounded-lg border ${
                    item.active ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/5 border-emerald-500/10'
                  }`}>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="flex items-center gap-1.5 font-bold">
                        {item.icon} {item.label}
                      </span>
                      <span className={`font-bold ${item.active ? 'text-red-400' : 'text-emerald-400'}`}>
                        {item.active ? `⛔ +${item.weight}đ` : '✓ OK'}
                      </span>
                    </div>
                    {item.active && item.desc && (
                      <p className="text-[9px] text-red-300/80 mt-1 pl-5 italic">{item.desc}</p>
                    )}
                  </div>
                ))}

                {/* Formula */}
                <div className="p-2 bg-black/20 rounded text-[9px] text-[var(--text-muted)] font-mono">
                  risk = (claim×40) + (self×8) + (dosage×25) + (warn×15) + (conflict×30) = {riskData.risk_score}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-muted)]">
                <Shield size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-[10px]">Chưa chạy phân tích rủi ro</p>
                <p className="text-[9px] mt-1">Nhấn &quot;Chạy lại QC&quot; để kích hoạt Layer 3</p>
              </div>
            )}
          </>
        )}

        {/* ── Layer 3B: Safety Enforcement ── */}
        {activeLayer === 'safety' && (
          <>
            <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Shield size={12} /> Tầng 3B: Kiểm Tra An Toàn
            </h4>
            {safetyData ? (
              <div className="space-y-3">
                {/* Safety Score */}
                <div className={`p-3 rounded-lg border ${
                  safetyData.safety_score >= 80 ? 'bg-emerald-500/15 border-emerald-500/30' :
                  safetyData.safety_score >= 50 ? 'bg-amber-500/15 border-amber-500/30' :
                  'bg-red-500/15 border-red-500/30'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-[var(--text-secondary)]">Safety Score</span>
                    <span className="text-lg font-black text-[var(--text-primary)]">{safetyData.safety_score}<span className="text-[10px] text-[var(--text-muted)]">/100</span></span>
                  </div>
                </div>

                {/* Safety Checklist */}
                {[
                  { label: 'Disclaimer (Khuyến cáo chung)', present: safetyData.has_disclaimer, weight: 20 },
                  { label: 'Escalation (Khi nào đi khám)', present: safetyData.has_escalation, weight: 25 },
                  { label: 'Warning (Chống chỉ định)', present: safetyData.has_warning, weight: 20 },
                  { label: 'Condition Limit (Giới hạn)', present: safetyData.has_condition_limit, weight: 20 },
                  { label: 'Special Population (Thai phụ, trẻ em...)', present: safetyData.has_special_population_warning, weight: 15 },
                ].map((item, idx) => (
                  <div key={idx} className={`p-2.5 rounded-lg border flex items-center justify-between ${
                    item.present ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-red-500/10 border-red-500/20'
                  }`}>
                    <span className="text-[10px] font-semibold text-[var(--text-secondary)]">{item.label}</span>
                    <span className={`text-[10px] font-bold ${item.present ? 'text-emerald-400' : 'text-red-400'}`}>
                      {item.present ? `✓ +${item.weight}đ` : `✗ THIẾU`}
                    </span>
                  </div>
                ))}

                {/* Final Safety Index */}
                {safetyReport && (
                  <div className="p-3 bg-black/20 rounded-lg">
                    <p className="text-[9px] text-[var(--text-muted)] font-mono mb-1">
                      FSI = safety({safetyData.safety_score}) - risk({safetyReport.risk_score})×0.8
                    </p>
                    <p className={`text-lg font-black ${
                      safetyReport.final_safety_index >= 60 ? 'text-emerald-400' :
                      safetyReport.final_safety_index >= 30 ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      = {safetyReport.final_safety_index.toFixed(1)}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-muted)]">
                <Shield size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-[10px]">Chưa chạy kiểm tra an toàn</p>
                <p className="text-[9px] mt-1">Layer 3B chạy sau khi editor chỉnh sửa</p>
              </div>
            )}
          </>
        )}

        {/* ── Links Silo Analysis ── */}
        {activeLayer === 'links' && (
          <>
            <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Link2 size={12} /> Phân Tích Internal Links
            </h4>
            {linkAnalysis ? (
              <div className="space-y-3">
                {/* Summary */}
                <div className={`p-3 rounded-lg border ${
                  linkAnalysis.total_links >= 5 && linkAnalysis.total_links <= 10 
                    ? 'bg-emerald-500/15 border-emerald-500/30' 
                    : 'bg-red-500/15 border-red-500/30'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)]">Tổng Internal Links</span>
                    <span className={`text-lg font-black ${
                      linkAnalysis.total_links >= 5 && linkAnalysis.total_links <= 10 
                        ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {linkAnalysis.total_links}
                      <span className="text-[10px] text-[var(--text-muted)] ml-1">(5-10)</span>
                    </span>
                  </div>
                </div>

                {/* Distribution by Section */}
                <div>
                  <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase mb-2">Phân bổ theo Section</p>
                  {Object.entries(linkAnalysis.distribution_by_section).map(([section, count]) => (
                    <div key={section} className="flex items-center justify-between text-[10px] py-1 border-b border-[var(--border-default)]">
                      <span className="text-[var(--text-secondary)] flex items-center gap-1">
                        <MapPin size={10} className="text-[var(--text-muted)]" /> {section}
                      </span>
                      <span className="font-bold text-[var(--text-primary)]">{count as number} link{(count as number) > 1 ? 's' : ''}</span>
                    </div>
                  ))}
                </div>

                {/* Silo Coverage */}
                <div>
                  <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase mb-2">Silo Coverage</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(linkAnalysis.silo_coverage).map(([silo, count]) => (
                      <span key={silo} className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/20 text-[9px] text-cyan-400 font-bold">
                        {silo}: {count as number}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Issues */}
                {linkAnalysis.issues.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-bold text-red-400 uppercase">Vấn đề phát hiện</p>
                    {linkAnalysis.issues.map((issue, idx) => (
                      <div key={idx} className="p-2 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-300">
                        ⚠ {issue}
                      </div>
                    ))}
                  </div>
                )}

                {linkAnalysis.is_balanced && (
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={12} /> Links phân bổ đều theo cấu trúc silo ✓
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-muted)]">
                <Link2 size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-[10px]">Chưa có dữ liệu phân tích link</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── AUTO-FIX LOG WITH POSITIONS ──────────────────── */}
      <div className="border-b border-[var(--border-default)]">
         <button 
           onClick={() => setShowAutoFix(!showAutoFix)}
           className="w-full px-5 py-3 flex justify-between items-center bg-[var(--bg-secondary)] hover:bg-[var(--bg-card-hover)] transition-colors"
         >
           <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-2">
             <CheckCircle2 size={14} /> Lịch Sử Auto-Fix 
             {editHistory ? (
               <span className="text-[var(--text-muted)]">
                 ({editHistory.reduce((sum, h) => sum + h.total_edits, 0)} chỉnh sửa)
               </span>
             ) : (
               <span className="text-[var(--text-muted)]">({result.autoFixed.length} lỗi)</span>
             )}
           </span>
           {showAutoFix ? <ChevronUp size={14} className="text-[var(--text-muted)]" /> : <ChevronDown size={14} className="text-[var(--text-muted)]" />}
         </button>
         
         {showAutoFix && (
           <div className="bg-[var(--bg-card-hover)] p-4 border-t border-[var(--border-default)]">
             {editHistory && editHistory.length > 0 ? (
               <div className="space-y-4">
                 {editHistory.map((layerHist, layerIdx) => (
                   <div key={layerIdx}>
                     <div className="flex items-center gap-2 mb-2">
                       <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                         layerHist.layer === 'tech' ? 'bg-blue-500/15 text-blue-400' : 'bg-purple-500/15 text-purple-400'
                       }`}>
                         {layerHist.layer === 'tech' ? '🔧 Layer 1' : '📋 Layer 2'}
                       </span>
                       <span className="text-[9px] text-[var(--text-muted)]">{layerHist.total_edits} chỉnh sửa</span>
                     </div>
                     {layerHist.edits.length > 0 ? (
                       <ul className="space-y-2">
                         {layerHist.edits.map((edit, idx) => (
                           <li key={idx} className="p-2 bg-black/20 rounded border border-[var(--border-default)]">
                             <div className="flex items-center gap-1.5 text-[9px] text-[var(--text-muted)] mb-1">
                               <MapPin size={9} /> 
                               <span className="font-bold">{edit.section}</span>
                               {edit.lineApprox > 0 && <span>· dòng ~{edit.lineApprox}</span>}
                               <span className="ml-auto px-1 py-0.5 rounded bg-[var(--bg-card-hover)] text-[8px] font-mono">{edit.rule_code}</span>
                             </div>
                             <div className="flex items-center gap-2 text-[10px]">
                               <span className="text-red-400 line-through">{edit.original}</span>
                               <ArrowRight size={10} className="text-[var(--text-muted)] shrink-0" />
                               <span className="text-emerald-400 font-bold">{edit.fixed}</span>
                             </div>
                           </li>
                         ))}
                       </ul>
                     ) : (
                       <p className="text-[9px] text-emerald-400/60 italic">Không có chỉnh sửa nào</p>
                     )}
                   </div>
                 ))}
               </div>
             ) : (
               /* Fallback to old format */
               <ul className="space-y-2">
                 {result.autoFixed.map((fix, idx) => (
                   <li key={idx} className="flex gap-2 text-[10px] text-[var(--text-secondary)]">
                     <span className="text-emerald-500 font-bold shrink-0">✓</span> {fix.text || fix.original || JSON.stringify(fix)}
                   </li>
                 ))}
               </ul>
             )}
           </div>
         )}
      </div>

      {/* ─── ISSUES LIST ───────────────────────────────────── */}
      <div className="p-5 flex-1 w-full relative">
        <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider mb-4">
          Lỗi Cần Xử Lý Thủ Công
        </h4>

        <div className="space-y-4">
          
          {/* Critical Group */}
          <div>
            <div className={`flex items-center gap-2 text-xs font-bold mb-2 pb-1 border-b border-[var(--border-default)] ${criticalIssues.length > 0 ? 'text-red-400' : 'text-gray-500'}`}>
               <AlertCircle size={14} /> [!] CRITICAL ({criticalIssues.length})
               {criticalIssues.length === 0 && <span className="font-normal text-[10px] ml-auto text-gray-500">Sạch lỗi nghiêm trọng</span>}
            </div>
            {criticalIssues.map((issue, i) => (
               <div key={i} className="mb-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                 <p className="text-[11px] font-bold text-red-100 flex justify-between">
                    <span>{issue.text}</span>
                    <span className="text-red-400 shrink-0 ml-2">-{issue.deduction}đ {issue.layer === 'tech' ? '🔧' : '📋'} {issue.sub}</span>
                 </p>
               </div>
            ))}
          </div>

          {/* Warning Group */}
          <div>
            <div className={`flex items-center gap-2 text-xs font-bold mb-2 pb-1 border-b border-[var(--border-default)] ${warningIssues.length > 0 ? 'text-amber-500' : 'text-gray-500'}`}>
               <AlertTriangle size={14} /> [⚠] WARNING ({warningIssues.length})
            </div>
            {warningIssues.map((issue, i) => (
               <div key={i} className="mb-2 p-3 border border-amber-500/20 bg-amber-500/5 rounded-lg transition-colors hover:border-amber-500/40 group">
                 <p className="text-[11px] font-bold text-amber-200/90 leading-snug flex justify-between mb-1.5">
                    <span>• {issue.text}</span>
                    <span className="text-amber-500 shrink-0 ml-2 font-mono">-{issue.deduction}đ {issue.layer === 'tech' ? '🔧' : '📋'} {issue.sub}</span>
                 </p>
                 <div className="bg-[var(--bg-primary)] p-2 rounded text-[10px] text-amber-400/80 italic mb-2 border border-amber-500/10 leading-snug">
                   Gợi ý sửa: {issue.suggestion}
                 </div>
                 <div className="flex gap-2">
                   <button className="px-2 py-0.5 bg-[var(--bg-card-hover)] hover:bg-[var(--lc-primary)]/20 hover:text-[var(--lc-primary)] text-[var(--text-muted)] rounded text-[9px] font-bold transition-colors">
                     Jump to text
                   </button>
                   <button className="px-2 py-0.5 bg-[var(--bg-card-hover)] hover:bg-red-500/20 hover:text-red-400 text-[var(--text-muted)] rounded text-[9px] transition-colors">
                     Bỏ qua
                   </button>
                 </div>
               </div>
            ))}
          </div>

          {/* Info Group */}
          <div>
            <div className={`flex items-center gap-2 text-xs font-bold mb-2 pb-1 border-b border-[var(--border-default)] ${infoIssues.length > 0 ? 'text-blue-400' : 'text-gray-500'}`}>
               <Info size={14} /> [ℹ] INFO ({infoIssues.length})
            </div>
            {infoIssues.map((issue, i) => (
               <div key={i} className="mb-2 p-2 border border-[var(--border-default)] rounded-lg hover:border-blue-500/30 transition-colors">
                 <p className="text-[10px] text-[var(--text-secondary)] flex justify-between items-center mb-1.5">
                    <span className="line-clamp-1 flex-1">• {issue.text}</span>
                    <span className="text-[var(--text-muted)] shrink-0 ml-2">-{issue.deduction}đ {issue.layer === 'tech' ? '🔧' : '📋'} {issue.sub}</span>
                 </p>
                 <div className="flex gap-2">
                   <button className="px-2 py-0.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded text-[9px] transition-colors">
                     Auto-fill Suggestion
                   </button>
                 </div>
               </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

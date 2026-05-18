// ─── QC Score Explanation Generator ─────────────────────────
// Sinh dòng chú giải ngắn gọn giải thích TẠI SAO bài được chấm số điểm đó.
// Dùng data sub-dimension có sẵn trên article (qcTechScore, qcContentScore, qcDecision...).

import { TECH_LAYER_CONFIG, CONTENT_LAYER_CONFIG } from './section-config';
import type { GeneratedArticle } from '@/types';

// ─── Label Maps ─────────────────────────────────────────────

const TECH_LABELS: Record<string, string> = {
  format: 'chính tả',
  link: 'link',
  image: 'ảnh',
  seo: 'SEO',
};

const CONTENT_LABELS: Record<string, string> = {
  accuracy: 'chính xác',
  depth: 'độ sâu',
  citation: 'trích dẫn',
  tone: 'tone',
};

const DECISION_ICONS: Record<string, string> = {
  SAFE_TO_PUBLISH: '🛡️ SAFE',
  REVIEW: '⚠️ REVIEW',
  NEEDS_REVISION: '🔧 REVISION',
  REJECT: '❌ REJECT',
};

// ─── Build Deduction Summary for a Score Object ─────────────

function buildDeductions(
  scoreObj: Record<string, number> | undefined,
  config: readonly { id: string; max: number }[],
  labels: Record<string, string>,
  threshold: number = 5
): string {
  if (!scoreObj) return '';
  
  const deductions: string[] = [];
  for (const cfg of config) {
    const actual = scoreObj[cfg.id] ?? cfg.max;
    const lost = cfg.max - actual;
    if (lost >= threshold) {
      deductions.push(`${labels[cfg.id]} -${lost}`);
    }
  }
  return deductions.length > 0 ? ` (${deductions.join(', ')})` : '';
}

// ─── Main: Build Score Explanation (1 line, for tables) ─────

export function buildScoreExplanation(article: GeneratedArticle): string {
  const parts: string[] = [];
  
  const techTotal = article.qcTechScore?.total;
  const contentTotal = article.qcContentScore?.total;
  
  if (techTotal === undefined && contentTotal === undefined) {
    return 'Chưa chạy QC';
  }
  
  // KT part
  if (techTotal !== undefined) {
    const techDeductions = buildDeductions(
      article.qcTechScore as Record<string, number> | undefined,
      TECH_LAYER_CONFIG,
      TECH_LABELS,
      3 // lower threshold for compact view
    );
    parts.push(`KT ${techTotal}${techDeductions}`);
  }
  
  // ND part  
  if (contentTotal !== undefined) {
    const contentDeductions = buildDeductions(
      article.qcContentScore as Record<string, number> | undefined,
      CONTENT_LAYER_CONFIG,
      CONTENT_LABELS,
      5
    );
    parts.push(`ND ${contentTotal}${contentDeductions}`);
  }
  
  let result = parts.join(' + ');
  
  // Safety decision
  if (article.qcDecision) {
    const icon = DECISION_ICONS[article.qcDecision] || article.qcDecision;
    result += ` | ${icon}`;
  }
  
  // Blocked reason
  if (article.qcSyncBlocked && article.qcBlockedReason) {
    result += ` | 🚫 ${article.qcBlockedReason}`;
  }
  
  return result;
}

// ─── Build Layer Detail Explanation (for tooltips/modals) ────

export function buildLayerExplanation(
  layer: 'tech' | 'content',
  scoreObj: Record<string, number> | undefined
): string {
  if (!scoreObj) return 'Chưa có dữ liệu';
  
  const config = layer === 'tech' ? TECH_LAYER_CONFIG : CONTENT_LAYER_CONFIG;
  const labels = layer === 'tech' ? TECH_LABELS : CONTENT_LABELS;
  
  const items: string[] = [];
  for (const cfg of config) {
    const actual = scoreObj[cfg.id] ?? cfg.max;
    const lost = cfg.max - actual;
    if (lost === 0) {
      items.push(`✓ ${labels[cfg.id]} ${actual}/${cfg.max}`);
    } else {
      items.push(`⚠ ${labels[cfg.id]} ${actual}/${cfg.max} (-${lost})`);
    }
  }
  
  return items.join(' | ');
}

// ─── Build Safety Explanation ───────────────────────────────

export function buildSafetyExplanation(article: GeneratedArticle): string {
  if (!article.qcDecision) return 'Chưa chạy Layer 3';
  
  const parts: string[] = [];
  
  if (article.qcRiskScore !== undefined) {
    const riskLabel = article.qcRiskLevel || (
      article.qcRiskScore >= 50 ? 'HIGH' :
      article.qcRiskScore >= 20 ? 'MEDIUM' : 'LOW'
    );
    parts.push(`Risk ${article.qcRiskScore} ${riskLabel}`);
  }
  
  if (article.qcSafetyScore !== undefined) {
    parts.push(`Safety ${article.qcSafetyScore}`);
  }
  
  if (article.qcFinalSafetyIndex !== undefined) {
    parts.push(`→ FSI ${article.qcFinalSafetyIndex.toFixed(1)}`);
  }
  
  const icon = DECISION_ICONS[article.qcDecision] || article.qcDecision;
  parts.push(`= ${icon}`);
  
  return parts.join(' | ');
}

// ─── Build Full Tooltip (multi-line, for hover) ─────────────

export function buildFullTooltip(article: GeneratedArticle): string {
  const lines: string[] = [];
  
  if (article.qcTechScore) {
    lines.push(`🔧 Kỹ thuật ${article.qcTechScore.total}/100: ${buildLayerExplanation('tech', article.qcTechScore as any)}`);
  }
  
  if (article.qcContentScore) {
    lines.push(`📋 Nội dung ${article.qcContentScore.total}/100: ${buildLayerExplanation('content', article.qcContentScore as any)}`);
  }
  
  if (article.qcDecision) {
    lines.push(`🛡️ An toàn: ${buildSafetyExplanation(article)}`);
  }
  
  if (article.qcSyncBlocked) {
    lines.push(`🚫 Blocked: ${article.qcBlockedReason || 'Vi phạm ngưỡng tối thiểu'}`);
  }
  
  return lines.join('\n');
}

// ─── Sub-dimension Deduction Reasons (for QcScoreCard) ──────

const TECH_DEDUCTION_REASONS: Record<string, (lost: number, score: number, max: number) => string> = {
  format: (lost) => lost >= 10 ? 'Nhiều lỗi chính tả/dấu câu' : 'Một số lỗi chính tả nhỏ',
  link:   (lost) => lost >= 15 ? 'Thiếu/sai link nội bộ nghiêm trọng' : lost >= 9 ? 'Thiếu link nội bộ hoặc có link ngoài' : 'Anchor text chưa tối ưu',
  image:  (lost) => lost >= 20 ? 'Thiếu hình ảnh hoặc thiếu alt/caption' : lost >= 10 ? 'Ít hình hoặc thiếu caption' : 'Alt text chưa tối ưu',
  seo:    (lost) => lost >= 15 ? 'Title/sapo/tag chưa đạt chuẩn SEO' : lost >= 5 ? 'Thiếu meta description hoặc tag' : 'SEO chưa tối ưu hoàn toàn',
};

const CONTENT_DEDUCTION_REASONS: Record<string, (lost: number, score: number, max: number) => string> = {
  accuracy: (lost) => lost >= 15 ? 'Claim tuyệt đối hoặc nhắc đối thủ' : lost >= 8 ? 'Ít nguồn tham khảo (< 3)' : 'Cần bổ sung nguồn uy tín',
  depth:    (lost) => lost >= 15 ? 'Bài quá ngắn (< 800 từ)' : lost >= 8 ? 'Thiếu section H2 (< 3)' : 'Thiếu H3 hoặc danh sách',
  citation: (lost) => lost >= 15 ? 'Không có references' : lost >= 8 ? 'Nguồn link homepage, không deep link' : 'Thiếu ngày truy cập nguồn',
  tone:     (lost) => lost >= 5 ? 'Tone không phù hợp y khoa' : 'Tone hơi thiếu chuyên nghiệp',
};

export function getDeductionReason(layer: 'tech' | 'content', subId: string, score: number, max: number): string | null {
  const lost = max - score;
  if (lost <= 0) return null;

  const reasons = layer === 'tech' ? TECH_DEDUCTION_REASONS : CONTENT_DEDUCTION_REASONS;
  const fn = reasons[subId];
  if (!fn) return `−${lost} điểm`;
  return fn(lost, score, max);
}


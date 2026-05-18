// ─── QC Two-Layer Scoring Configuration ─────────────────────
// Single source of truth for the new independent 100-point scoring system.
// Layer 1: Technical (Kỹ thuật) — 100 points
// Layer 2: Content  (Nội dung) — 100 points

// ─── TẦNG 1: KỸ THUẬT (100 điểm) ───────────────────────────

export const TECH_LAYER_CONFIG = [
  { id: 'format',  label: 'Định dạng & Chính tả',         shortLabel: 'Chính tả',   max: 20, description: 'Chính tả, dấu câu, đơn vị, bullet' },
  { id: 'link',    label: 'Liên kết nội bộ / Ngoại',      shortLabel: 'Liên kết',   max: 30, description: 'Internal link, no external, anchor, ref domain' },
  { id: 'image',   label: 'Hình ảnh & Trình bày',         shortLabel: 'Hình ảnh',   max: 30, description: 'Số lượng, caption, alt text, vị trí' },
  { id: 'seo',     label: 'SEO & Metadata',               shortLabel: 'SEO',        max: 20, description: 'Title, sapo, tags, danh mục' },
] as const;

export type TechSubId = typeof TECH_LAYER_CONFIG[number]['id'];

// ─── TẦNG 2: CHUYÊN MÔN (100 điểm) ────────────────────────

export const CONTENT_LAYER_CONFIG = [
  { id: 'accuracy',  label: 'Chính xác y tế',              shortLabel: 'Chính xác',  max: 40, description: 'Chính xác y tế, không sai claim' },
  { id: 'depth',     label: 'Độ sâu & Đủ nội dung',       shortLabel: 'Độ sâu',     max: 30, description: 'Đủ section, đủ sâu, đủ ý' },
  { id: 'citation',  label: 'Nguồn trích dẫn',            shortLabel: 'Trích dẫn',  max: 20, description: 'Nguồn KB + nguồn ngoài uy tín' },
  { id: 'tone',      label: 'Tone of Voice',               shortLabel: 'Tone',       max: 10, description: 'Không claim quá, tone y khoa' },
] as const;

export type ContentSubId = typeof CONTENT_LAYER_CONFIG[number]['id'];

// ─── TRỌNG SỐ CẤU HÌNH (config trọng số) ───────────────────

export const QC_WEIGHT_CONFIG = {
  tech: 0.40,
  content: 0.60,
} as const;

// ─── NGƯỠNG TỐI THIỂU TỪNG TẦNG (floor config) ────────────

export const QC_FLOOR_CONFIG = {
  techMin: 60,    // Kỹ thuật phải >= 60/100
  contentMin: 60, // Nội dung phải >= 60/100
} as const;

// ─── NGƯỠNG ĐIỂM TỔNG (grade thresholds) ───────────────────

export const QC_THRESHOLDS = [
  { min: 85, max: 100, grade: 'A' as const, status: 'approved',          priority: 'HIGH' as const,   blockSync: false },
  { min: 75, max: 84,  grade: 'B' as const, status: 'ready_for_review',  priority: 'NORMAL' as const, blockSync: false },
  { min: 65, max: 74,  grade: 'C' as const, status: 'needs_improvement', priority: 'NORMAL' as const, blockSync: true  },
  { min: 50, max: 64,  grade: 'D' as const, status: 'rework_required',   priority: 'NORMAL' as const, blockSync: true  },
  { min: 0,  max: 49,  grade: 'E' as const, status: 'rework_required',   priority: 'URGENT' as const, blockSync: true, notifyManager: true },
] as const;

export type QCGrade = typeof QC_THRESHOLDS[number]['grade'];

// ─── HELPER: Compute grade from total score ─────────────────

export function computeGrade(score: number): QCGrade {
  for (const t of QC_THRESHOLDS) {
    if (score >= t.min && score <= t.max) return t.grade;
  }
  return 'E';
}

export function getThresholdForGrade(grade: QCGrade) {
  return QC_THRESHOLDS.find(t => t.grade === grade) ?? QC_THRESHOLDS[QC_THRESHOLDS.length - 1];
}

// ─── LEGACY COMPAT ──────────────────────────────────────────
// Old S1-S6 config is removed. All components should use TECH_LAYER_CONFIG
// and CONTENT_LAYER_CONFIG instead.

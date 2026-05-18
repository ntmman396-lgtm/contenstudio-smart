// ─── Multi-Site Config ──────────────────────────────────────

export type SiteId = 'nha-thuoc' | 'tiem-chung';

export interface SiteConfig {
  id: SiteId;
  name: string;
  icon: string;
  description: string;
  strapiBaseUrl: string;
  strapiApiToken: string;
  defaultCategory?: string;
}

// ─── Template Types ─────────────────────────────────────────

export interface TemplateField {
  key: string;
  label: string;
  type: 'text' | 'richtext' | 'list' | 'faq';
  required: boolean;
}

export interface Template {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  fields: TemplateField[];
  outline?: unknown[];
}

export type SourceType = 'pdf' | 'url';

export interface UploadedSource {
  id: string;
  name: string;
  type: SourceType;
  size?: number;
  url?: string;
  file?: File;
}

export type JobStatus = 'queued' | 'generating' | 'review' | 'completed' | 'failed';

// ─── Unified Article Status (single source of truth) ────────
// pending_review  → vừa generate xong, chờ QC
// ready_for_review → QC qua (grade A/B), chờ human duyệt
// needs_improvement → QC grade C, cần sửa nhỏ
// rework_required → QC grade D/E, cần viết lại
// approved        → human duyệt, sẵn sàng publish
// rejected        → bị block bởi critical rule hoặc human từ chối
export type ArticleStatus =
  | 'pending_review'
  | 'ready_for_review'
  | 'needs_improvement'
  | 'rework_required'
  | 'approved'
  | 'rejected';

export interface Job {
  id: string;
  title: string;
  status: JobStatus;
  progress: number;
  templateName: string;
  createdAt: string;
  sourceCount: number;
  // QC fields (two-layer + safety)
  qcScore?: number;           // weighted total
  qcGrade?: string;           // overall grade
  qcAutoFixes?: number;
  qcStatus?: string;
  qcTechScore?: number;       // tech layer total (0-100)
  qcContentScore?: number;    // content layer total (0-100)
  qcFinalSafetyIndex?: number;
  qcRiskScore?: number;
  qcSafetyScore?: number;
  qcDecision?: string;
  qcRiskLevel?: string;
}

export interface BatchConfig {
  articleCount: number;
  tone: string;
  language: string;
  minWords: number;
  maxWords: number;
  customInstructions: string;
}

export interface BatchPlanItem {
  id: string;
  title: string;
  outline: string;
  status: 'draft' | 'generating' | 'completed' | 'failed';
  articleId?: string;
  keyword?: string;
  referenceLink?: string;
  category?: string;
  tags?: string[];
}

// ─── Generator Pipeline Types ───────────────────────────────

export interface GeneratorSettings {
  sourceText: string;
  templateId: string;
  siteId: SiteId;
  articleCount: number;
  tone: string;
  language: string;
  minWords: number;
  maxWords: number;
  customInstructions: string;
  category?: string;
  tags?: string[];
  internalLinks?: { anchor: string; url: string }[];
}

export interface SeoMeta {
  title: string;
  description: string;
}

/** @deprecated — Legacy scoring. Use qcScore (QC 2-layer) instead. */
export interface QualityScore {
  medicalAccuracy: number;
  seoScore: number;
  completeness: number;
  technicalScore: number;
  overall: number;
}

// ─── Citation Verification ──────────────────────────────────

export interface CitationVerification {
  original: string;        // reference string gốc
  url: string | null;      // URL trích xuất được
  status: 'verified' | 'dead' | 'no_url' | 'timeout';
  httpStatus?: number;
  pageTitle?: string;      // title từ trang web
  snippet?: string;        // 200 ký tự đầu nội dung chính
  fetchedAt: string;
}

export interface GeneratedArticle {
  id: string;
  assignedBy?: string | null;
  assignedByName?: string | null;
  approvedBy?: string | null;
  approvedByName?: string | null;
  title: string;
  slug: string;
  sapo: string;
  content: string;           // HTML with H2/H3 per template outline
  references: string[];
  seoMeta: SeoMeta;
  category: string;
  tags: string[];
  /** @deprecated Use qcScore instead */
  qualityScore?: QualityScore;
  templateId: string;
  templateName: string;
  siteId?: string;
  status: ArticleStatus;
  createdAt: string;
  updatedAt?: string;
  syncedAt?: string;
  rawFields: Record<string, string>; // per-field content keyed by field.key
  citationReport?: unknown;
  citationVerification?: CitationVerification[];
  // QC Engine fields (two-layer scoring)
  qcScore?: number;            // weighted total (tech*0.4 + content*0.6)
  qcGrade?: string;            // overall grade A-E
  qcBadge?: string;
  qcAutoFixes?: number;
  qcManualIssues?: number;
  qcSyncBlocked?: boolean;
  qcBlockedBy?: string[];
  qcBlockedReason?: string;
  qcLastRun?: string;
  // Per-layer scores
  qcTechScore?: { total: number; format: number; link: number; image: number; seo: number };
  qcTechGrade?: string;
  qcContentScore?: { total: number; accuracy: number; depth: number; citation: number; tone: number };
  qcContentGrade?: string;
  qcContentReviewerNote?: string;
  
  // Layer 3: Risk & Safety
  qcFinalSafetyIndex?: number;
  qcRiskScore?: number;
  qcSafetyScore?: number;
  qcDecision?: string;
  qcRiskLevel?: string;

  // Detailed deduction findings (from L1+L2+AI engine)
  qcFindings?: Array<{
    sub: string;       // e.g. 'link', 'accuracy', 'depth'
    layer: string;     // 'tech' | 'content'
    deduction: number;
    detail?: string;   // e.g. "Chỉ có 2 nguồn (cần ≥ 3)"
    severity: string;
    quote?: string;    // AI: exact text from article that has the issue
    suggestion?: string; // AI: what the correct info should be
  }>;
}

export interface ExtractionMetadata {
  title: string;
  source: string;
  pageCount?: number;
  wordCount: number;
}

export interface ExtractedSource {
  text: string;
  metadata: ExtractionMetadata;
}

// ─── Strapi CMS Fields (health-article) ─────────────────────

export interface StrapiArticleFields {
  tenBaiViet: string;            // Tên Bài Viết*
  slug: string;                  // Slug* ID
  anhChinh: string | null;       // Ảnh Chính* (media URL)
  anhSlider: string[];           // Ảnh Slider (multiple media URLs)
  danhMucBaiViet: string;        // Danh Mục Bài Viết* (relation)
  moTaNgan: string;              // Mô Tả Ngắn
  moTa: string;                  // Mô Tả (rich text)
  baiVietNoiBat: boolean;        // Bài Viết Nổi Bật (toggle)
  riengTu: boolean;              // Riêng Tư (toggle)
  tacGia: string;                // Tác Giả (relation)
  nguoiDuyetBaiViet: string;     // Người Duyệt Bài Viết (relation)
  duyetBai: boolean;             // Duyệt Bài (toggle)
  tags: string[];                // Tags (relation)
  linkChuyenHuong: string;       // Link Chuyên Hướng
  hienThiDanhSachSanPham: boolean; // Hiển Thị Danh Sách Sản Phẩm (toggle)
  danhSachSanPham: string[];     // Danh Sách Sản Phẩm (relation)
  batChiDeLongForm: boolean;     // Bật Chỉ Đề Long-Form* (toggle)
  nguonThamKhao: string;         // Nguồn Tham Khảo (rich text)
  seo: {                         // SEO component
    metaTitle: string;
    metaDescription: string;
    keywords: string;
  };
  sourceArticle: string;         // sourceArticle (max 255 chars)
  khuyenCaoDocKyHDSD?: boolean;  // Khuyến cáo đọc kỹ hướng dẫn sử dụng
  faq?: { question: string; answer: string }[]; // Khối FAQ

  // ─── Bệnh Lý Template Specific Fields ───
  trieuChung?: string;
  nguyenNhan?: string;
  nguyCo?: string;
  chanDoanDieuTri?: string;
  sinhHoatPhongNgua?: string;
}

import { QCResult, TechScore, ContentScore } from './engine';
import { computeGrade, QC_WEIGHT_CONFIG, QC_FLOOR_CONFIG, QC_THRESHOLDS } from './section-config';

// ─── MOCK DATA ──────────────────────────────────────────────

export const MOCK_QC_DASHBOARD_DATA = {
  metrics: {
    avgScore7d: 82.4,
    autoFixRate: 76.5,
    passRate: 68.2,
    blockedArticles: 14
  },
  
  scoreDistribution: [
    { range: '0-59', count: 5 },
    { range: '60-69', count: 12 },
    { range: '70-79', count: 25 },
    { range: '80-89', count: 68 },
    { range: '90-100', count: 110 }
  ],
  
  trendData: Array.from({ length: 30 }).map((_, i) => ({
    date: `Ngày ${i + 1}`,
    score: Math.floor(Math.random() * 15 + 75)
  })),
  
  templateComparison: [
    { name: 'Bệnh Lý', score: 86 },
    { name: 'Dược Chất', score: 92 },
    { name: 'GSK Blog', score: 78 },
    { name: 'Hỏi Đáp', score: 84 },
  ],
  
  ruleViolations: [
    { ruleCode: 'T-SEO-01', name: 'Sapo thiếu Keyword', count: 145, avgDeduction: 5, autoFixRate: 0 },
    { ruleCode: 'T-IMG-01', name: 'Thiếu Alt Text ảnh', count: 89, avgDeduction: 5, autoFixRate: 98 },
    { ruleCode: 'T-FMT-01', name: 'Lỗi chính tả cơ bản', count: 320, avgDeduction: 3, autoFixRate: 100 },
    { ruleCode: 'T-LNK-01', name: 'Liên kết ngoài bị Block', count: 42, avgDeduction: 10, autoFixRate: 15 },
    { ruleCode: 'C-ACC-01', name: 'Claim y tế thiếu dẫn chứng', count: 75, avgDeduction: 15, autoFixRate: 0 }
  ],

  recentRuns: [
    { id: '1', title: 'Dấu hiệu tiểu đường type 2', template: 'Bệnh Lý', score: 88, grade: 'B', fixes: 4, status: 'ready', time: '10p trước' },
    { id: '2', title: 'Thuốc hạ đường huyết Metformin', template: 'Dược Chất', score: 95, grade: 'A', fixes: 2, status: 'ready', time: '35p trước' },
    { id: '3', title: 'Cách tập yoga giảm cân', template: 'GSK Blog', score: 65, grade: 'D', fixes: 0, status: 'rework', time: '1h trước' },
    { id: '4', title: 'Vaccine dại tiêm mấy mũi?', template: 'Hỏi Đáp', score: 82, grade: 'B', fixes: 1, status: 'ready', time: '2h trước' }
  ]
};

// MOCK results used for injection in the QcPanel right sidebar.
export const MOCK_ARTICLE_QC_RESULT: QCResult = {
  id: 'qc-run-latest',
  articleId: 'test',
  status: 'completed',

  // Tầng 1: Kỹ thuật
  techScore: {
    total: 85,
    format: 17,  // /20
    link:   25,  // /30
    image:  25,  // /30
    seo:    18,  // /20
  },
  techGrade: 'B',

  // Tầng 2: Nội dung
  contentScore: {
    total: 92,
    accuracy: 38,  // /40
    depth:    28,  // /30
    citation: 18,  // /20
    tone:      8,  // /10
  },
  contentGrade: 'A',
  contentReviewerNote: '',

  // Tổng
  scoreTotal: 89, // ROUND(85*0.4 + 92*0.6) = ROUND(34 + 55.2) = 89
  overallGrade: 'B',

  syncBlocked: false,
  blockedReason: '',
  qcStatus: 'Đạt yêu cầu',
  contentBefore: '',
  contentAfter: '',
  durationMs: 4500,
  autoFixed: [
    { text: 'Đã sửa 3 lỗi chính tả' },
    { text: 'Đã đổi "Mg" → "mg" (2 chỗ)' },
    { text: 'Đã thêm câu khuyến nghị gặp bác sĩ' },
    { text: 'Đã thêm • cho 4 dòng liệt kê' }
  ],
  manualRequired: [
    { 
      rule_code: 'T-SEO-01', 
      layer: 'tech',
      sub: 'seo',
      severity: 'warning', 
      passed: false, 
      deduction: 2, 
      text: 'Sapo thiếu keyword chính "Tiểu đường type 2 là bệnh..."',
      suggestion: 'Thêm "tiểu đường type 2" vào câu đầu sapo'
    },
    { 
      rule_code: 'T-LNK-02', 
      layer: 'tech',
      sub: 'link',
      severity: 'warning', 
      passed: false, 
      deduction: 5, 
      text: 'Anchor text chưa rõ nghĩa: "tại đây"',
      suggestion: 'Thay thế bằng cụm từ chứa keyword đích'
    },
    { 
      rule_code: 'C-CIT-01', 
      layer: 'content',
      sub: 'citation',
      severity: 'warning', 
      passed: false, 
      deduction: 2, 
      text: 'Thiếu nguồn trích dẫn cho claim về tỷ lệ mắc bệnh',
      suggestion: 'Bổ sung nguồn WHO hoặc Bộ Y tế'
    },
    { 
      rule_code: 'T-IMG-02', 
      layer: 'tech',
      sub: 'image',
      severity: 'info', 
      passed: false, 
      deduction: 0, 
      text: 'Thiếu alt text cho ảnh thứ 3',
      suggestion: 'Thêm alt text dựa trên Context'
    }
  ],
  issuesFound: [],
  blockedBy: [],
  findings: [],
};

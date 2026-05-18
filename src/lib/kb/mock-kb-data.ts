export type KBSourceStatus = 'processing' | 'ready' | 'error' | 'deactivated';
export type SourceType = 'pdf' | 'url' | 'manual';

export type KBSourceScope = 'general' | 'specific';

export interface KBSource {
  id: string;
  title: string;
  source_type: SourceType;
  scope?: KBSourceScope;
  origin_url?: string;
  file_path?: string;
  extracted_text?: string;
  file_size_kb?: number;
  page_count?: number;
  language: string;
  publisher: string;
  publish_year: number;
  topic_tags: string[];
  template_tags: string[];
  status: KBSourceStatus;
  chunk_count: number;
  is_active: boolean;
  uploaded_by: string;
  created_at: string;
  last_indexed_at?: string;
  error_msg?: string;
}

export interface KBChunk {
  id: string;
  source_id: string;
  chunk_index: number;
  content: string;
  content_length: number;
  page_number?: number;
  section_heading?: string;
  metadata?: any;
  created_at: string;
}

export interface KBCitationLog {
  id: string;
  article_id: string;
  article_title: string;
  date: string;
  total_citations: number;
  kb_citations: number;
  external_citations: number;
  unverified: number;
  transparency_notes: string[];
  status: 'pending' | 'reviewed';
}

export const MOCK_KB_SOURCES: KBSource[] = [
  {
    id: 'src-1',
    title: 'Hướng dẫn chẩn đoán và điều trị đái tháo đường Týp 2',
    source_type: 'pdf',
    scope: 'specific',
    file_size_kb: 4500,
    page_count: 86,
    language: 'vi',
    publisher: 'Bộ Y Tế Việt Nam',
    publish_year: 2020,
    topic_tags: ['tiểu đường', 'nội tiết', 'đái tháo đường'],
    template_tags: ['BENH_LY', 'THUOC'],
    file_path: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
    status: 'ready',
    chunk_count: 124,
    is_active: true,
    uploaded_by: 'admin',
    created_at: '2023-10-12T08:00:00Z',
    last_indexed_at: '2023-10-12T08:05:00Z',
  },
  {
    id: 'src-2',
    title: 'Lancet: Efficacy and safety of semaglutide',
    source_type: 'url',
    scope: 'specific',
    origin_url: 'https://thelancet.com/journals/lancet/article/PIIS0140-6736',
    language: 'en',
    publisher: 'The Lancet',
    publish_year: 2022,
    topic_tags: ['semaglutide', 'tiểu đường', 'giảm cân'],
    template_tags: ['THUOC', 'GSK_BLOG'],
    extracted_text: '# Efficacy and safety of semaglutide\n\nSemaglutide is a GLP-1 receptor agonist that increases insulin secretion...\n\n## Introduction\nType 2 diabetes is a chronic metabolic disorder affecting millions worldwide. Managing blood glucose levels and weight brings significant clinical benefits. In recent trials, semaglutide has emerged as a game-changer.\n\n## Methodology\nWe conducted a randomized double-blind trial measuring HbA1c reductions and weight loss over 52 weeks...',
    status: 'ready',
    chunk_count: 45,
    is_active: true,
    uploaded_by: 'system',
    created_at: '2023-11-01T10:00:00Z',
    last_indexed_at: '2023-11-01T10:02:00Z',
  },
  {
    id: 'src-3',
    title: 'WHO Guidelines on physical activity',
    source_type: 'pdf',
    scope: 'general',
    file_size_kb: 2100,
    page_count: 104,
    language: 'en',
    publisher: 'WHO',
    publish_year: 2020,
    topic_tags: ['vận động', 'lối sống', 'phòng bệnh'],
    template_tags: ['BENH_LY', 'GSK_BLOG'],
    status: 'processing',
    chunk_count: 0,
    is_active: true,
    uploaded_by: 'editor1',
    created_at: new Date().toISOString(),
  },
  {
    id: 'src-4',
    title: 'Bài viết cũ lỗi không index được',
    source_type: 'url',
    scope: 'specific',
    origin_url: 'https://invalid-domain.com/broken',
    language: 'vi',
    publisher: 'Unknown',
    publish_year: 2021,
    topic_tags: ['test'],
    template_tags: ['BENH_LY'],
    status: 'error',
    chunk_count: 0,
    is_active: false,
    uploaded_by: 'admin',
    created_at: '2023-09-01T10:00:00Z',
    error_msg: 'Failed to fetch URL. Status 404',
  }
];

export const MOCK_CITATION_LOGS: KBCitationLog[] = [
  {
    id: 'cit-1',
    article_id: 'gen-123456',
    article_title: 'Dấu hiệu đái tháo đường ở người trẻ tuổi',
    date: new Date().toISOString(),
    total_citations: 5,
    kb_citations: 5,
    external_citations: 0,
    unverified: 0,
    transparency_notes: [],
    status: 'reviewed'
  },
  {
    id: 'cit-2',
    article_id: 'gen-789012',
    article_title: 'Tác dụng phụ của thuốc GLP-1',
    date: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    total_citations: 8,
    kb_citations: 4,
    external_citations: 4,
    unverified: 2,
    transparency_notes: [
      'Nguồn bổ sung ngoài KB: [https://blogs.webmd.com] - [WebMD] - [2023] (CẢNH BÁO: Chưa được duyệt)',
      'Nguồn bổ sung ngoài KB: [https://nejm.org/...] - [NEJM] - [2023]'
    ],
    status: 'pending'
  }
];

export const MOCK_CHUNKS: Record<string, KBChunk[]> = {
  'src-1': [
    {
      id: 'chunk-1-1',
      source_id: 'src-1',
      chunk_index: 0,
      content: 'Bệnh đái tháo đường týp 2 là một bệnh lý chuyển hóa đặc trưng bởi tăng đường huyết do khiếm khuyết trong tiết insulin, hoạt động của insulin hoặc cả hai...',
      content_length: 156,
      page_number: 5,
      section_heading: 'Định Nghĩa',
      created_at: '2023-10-12T08:01:00Z'
    },
    {
      id: 'chunk-1-2',
      source_id: 'src-1',
      chunk_index: 1,
      content: 'Chẩn đoán đái tháo đường dựa trên một trong các tiêu chí: Glucose huyết tương lúc đói (FPG) ≥ 126 mg/dL (7.0 mmol/L)...',
      content_length: 120,
      page_number: 12,
      section_heading: 'Tiêu chuẩn chẩn đoán',
      created_at: '2023-10-12T08:01:02Z'
    }
  ],
  'src-2': [
    {
      id: 'chunk-2-1',
      source_id: 'src-2',
      chunk_index: 0,
      content: 'Type 2 diabetes is a chronic metabolic disorder affecting millions worldwide. Managing blood glucose levels and weight brings significant clinical benefits.',
      content_length: 154,
      section_heading: 'Introduction',
      created_at: '2023-11-01T10:01:00Z',
      metadata: { embedded: true }
    },
    {
      id: 'chunk-2-2',
      source_id: 'src-2',
      chunk_index: 1,
      content: 'We conducted a randomized double-blind trial measuring HbA1c reductions and weight loss over 52 weeks...',
      content_length: 104,
      section_heading: 'Methodology',
      created_at: '2023-11-01T10:01:05Z',
      metadata: { embedded: true }
    }
  ]
};

// In-memory state for mocks
let memSources = [...MOCK_KB_SOURCES];
let memCitations = [...MOCK_CITATION_LOGS];

export function getSavedSources(): KBSource[] {
  return memSources;
}

export function saveSources(sources: KBSource[]) {
  memSources = sources;
}

export function getSavedCitationLogs(): KBCitationLog[] {
  return memCitations;
}

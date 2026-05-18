import { GeneratedArticle, StrapiArticleFields } from '@/types';

// ─── Strapi Configuration ───────────────────────────────────

interface StrapiConfig {
  baseUrl: string;
  token: string;
}

function getStrapiConfig(): StrapiConfig {
  const baseUrl = process.env.STRAPI_URL;
  const token = process.env.STRAPI_TOKEN;
  if (!baseUrl) throw new Error('STRAPI_URL environment variable is not set');
  if (!token) throw new Error('STRAPI_TOKEN environment variable is not set');
  return { baseUrl: baseUrl.replace(/\/$/, ''), token };
}

// ─── Map GeneratedArticle → Strapi Fields ───────────────────

/**
 * Maps our GeneratedArticle to the actual Strapi CMS health-article content type.
 * The field names match exactly what's shown in Strapi admin panel.
 */
export function mapToStrapiFields(
  article: GeneratedArticle,
  strapiFields?: Partial<StrapiArticleFields>
): Record<string, unknown> {
  return {
    data: {
      // Required fields
      'Tên Bài Viết': article.title,
      Slug: article.slug,
      'Danh Mục Bài Viết': strapiFields?.danhMucBaiViet || article.category,

      // Content
      'Mô Tả Ngắn': article.sapo,
      'Mô Tả': strapiFields?.moTa || article.content, // Dùng chung cho Tìm hiểu chung

      // Bệnh Lý fields
      'Triệu Chứng': strapiFields?.trieuChung || '',
      'Nguyên Nhân': strapiFields?.nguyenNhan || '',
      'Nguy Cơ': strapiFields?.nguyCo || '',
      'Chẩn Đoán Và Điều Trị': strapiFields?.chanDoanDieuTri || '',
      'Sinh Hoạt Và Phòng Ngừa': strapiFields?.sinhHoatPhongNgua || '',

      // Nguồn Tham Khảo (rich text)
      'Nguồn Tham Khảo': article.references
        .map((ref, i) => `<p>${i + 1}. ${ref}</p>`)
        .join('\n'),

      // Toggles
      'Bài Viết Nổi Bật': strapiFields?.baiVietNoiBat ?? false,
      'Riêng Tư': strapiFields?.riengTu ?? false,
      'Duyệt Bài': strapiFields?.duyetBai ?? false,
      'Hiển Thị Danh Sách Sản Phẩm': strapiFields?.hienThiDanhSachSanPham ?? false,
      'Bật Chỉ Đề Long-Form': strapiFields?.batChiDeLongForm ?? true,

      // Relations (IDs)
      Tags: article.tags,
      'Tác Giả': strapiFields?.tacGia || null,
      'Người Duyệt Bài Viết': strapiFields?.nguoiDuyetBaiViet || null,

      // Links & extras
      'Link Chuyên Hướng': strapiFields?.linkChuyenHuong || '',
      sourceArticle: strapiFields?.sourceArticle || '',

      // SEO component
      SEO: {
        metaTitle: article.seoMeta.title,
        metaDescription: article.seoMeta.description,
        keywords: article.tags.join(', '),
      },
    },
  };
}

/**
 * Convert a GeneratedArticle to full StrapiArticleFields for UI preview.
 */
export function toStrapiPreview(
  article: GeneratedArticle,
  overrides?: Partial<StrapiArticleFields>
): StrapiArticleFields {
  return {
    tenBaiViet: article.title,
    slug: article.slug,
    anhChinh: null,
    anhSlider: [],
    danhMucBaiViet: article.category,
    moTaNgan: article.sapo,
    // Provide fallback: if rawFields exists, map it. Otherwise use full content.
    moTa: (article.rawFields?.timHieuChung as string) || article.content,
    trieuChung: (article.rawFields?.trieuChung as string) || '',
    nguyenNhan: (article.rawFields?.nguyenNhan as string) || '',
    nguyCo: (article.rawFields?.nguyCo as string) || '',
    chanDoanDieuTri: (article.rawFields?.chanDoanDieuTri as string) || '',
    sinhHoatPhongNgua: (article.rawFields?.sinhHoatPhongNgua as string) || '',

    baiVietNoiBat: false,
    riengTu: false,
    tacGia: '',
    nguoiDuyetBaiViet: '',
    duyetBai: false,
    tags: article.tags,
    linkChuyenHuong: '',
    hienThiDanhSachSanPham: false,
    danhSachSanPham: [],
    batChiDeLongForm: true,
    nguonThamKhao: article.references
      .map((ref, i) => `<p>${i + 1}. ${ref}</p>`)
      .join('\n'),
    seo: {
      metaTitle: article.seoMeta.title,
      metaDescription: article.seoMeta.description,
      keywords: article.tags.join(', '),
    },
    faq: (() => {
      const raw = article.rawFields?.faq;
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      if (typeof raw === 'string') {
        try { return JSON.parse(raw); } catch { return []; }
      }
      return [];
    })(),
    sourceArticle: '',
    ...overrides,
  };
}

// ─── Sync Result Type ───────────────────────────────────────

export interface SyncResult {
  success: boolean;
  strapiId?: number;
  error?: string;
  timestamp: string;
}

// ─── Main Sync Function ─────────────────────────────────────

export async function syncArticle(
  article: GeneratedArticle,
  strapiFields?: Partial<StrapiArticleFields>
): Promise<SyncResult> {
  const timestamp = new Date().toISOString();
  try {
    const config = getStrapiConfig();
    const payload = mapToStrapiFields(article, strapiFields);

    const response = await fetch(`${config.baseUrl}/api/health-articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.token}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'No error body');
      return { success: false, error: `Strapi ${response.status}: ${errorBody}`, timestamp };
    }

    const result = await response.json();
    return { success: true, strapiId: result.data?.id, timestamp };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Strapi Sync]', msg);
    return { success: false, error: msg, timestamp };
  }
}

export async function updateStrapiArticle(
  strapiId: number,
  article: GeneratedArticle,
  strapiFields?: Partial<StrapiArticleFields>
): Promise<SyncResult> {
  const timestamp = new Date().toISOString();
  try {
    const config = getStrapiConfig();
    const payload = mapToStrapiFields(article, strapiFields);

    const response = await fetch(`${config.baseUrl}/api/health-articles/${strapiId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.token}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      return { success: false, error: `PUT ${response.status}: ${errorBody}`, timestamp };
    }
    return { success: true, strapiId, timestamp };
  } catch (error) {
    return { success: false, error: (error as Error).message, timestamp };
  }
}

export async function checkStrapiHealth(): Promise<{ ok: boolean; message: string }> {
  try {
    const config = getStrapiConfig();
    const res = await fetch(`${config.baseUrl}/api/health-articles?pagination[limit]=1`, {
      headers: { Authorization: `Bearer ${config.token}` },
      signal: AbortSignal.timeout(5000),
    });
    return { ok: res.ok, message: res.ok ? 'Connected' : `Status ${res.status}` };
  } catch (error) {
    return { ok: false, message: (error as Error).message };
  }
}

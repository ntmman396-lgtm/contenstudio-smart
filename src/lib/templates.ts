/**
 * Comprehensive template data model for Long Châu Content Studio.
 * Each template maps 1:1 to a content type in the inforr.md CONTENT CORE FRAMEWORK.
 *
 * Contains: id, name, stepCount, estimatedWords, systemPrompt, outline[], requiredFields[].
 */

// ─── Types ──────────────────────────────────────────────────

export type SectionType = 'h2' | 'h3' | 'meta' | 'required';

export interface OutlineSection {
  type: SectionType;
  label: string;
  /** Key name in the generated JSON output */
  fieldKey?: string;
  /** Sub-sections under this H2 */
  children?: OutlineSection[];
}

import type { SiteId } from '@/types';

export interface ContentTemplate {
  id: string;
  name: string;
  icon: string;
  stepCount: number;
  steps: string[];
  estimatedWords: { min: number; max: number };
  /** Gemini system prompt */
  systemPrompt: string;
  /** Article outline structure */
  outline: OutlineSection[];
  /** Fields that MUST be filled before sync to Strapi */
  requiredFields: string[];
  /** Additional notes / rules for editors */
  notes?: string[];
  /** Which sites this template is available on */
  sites: SiteId[];
  /** Site-specific additions appended to systemPrompt */
  sitePromptOverrides?: Partial<Record<SiteId, string>>;
}

// ═══════════════════════════════════════════════════════════
// 1. BỆNH LÝ (DISEASE)
// ═══════════════════════════════════════════════════════════

const BENH_LY: ContentTemplate = {
  id: 'benh-ly',
  name: 'Bệnh lý',
  icon: '🧠',
  sites: ['nha-thuoc', 'tiem-chung'],
  sitePromptOverrides: {
    'tiem-chung': `\nTHÊM QUY TẮC CHO SITE TIÊM CHỦNG:\n- Trong phần "Phòng ngừa", BẮT BUỘC nhấn mạnh vai trò của vắc xin (nếu bệnh có vắc xin phòng ngừa)\n- CTA: Hướng dẫn đặt lịch tiêm chủng tại trung tâm tiêm chủng Long Châu\n- Internal link: ưu tiên link đến bài vắc xin liên quan trên site tiêm chủng`,
  },
  stepCount: 8,
  steps: ['UNDERSTAND', 'DETECT', 'EXPLAIN', 'RISK', 'CLINICAL', 'MANAGE', 'PREVENT', 'EXPAND'],
  estimatedWords: { min: 2500, max: 4000 },
  systemPrompt: `Bạn là chuyên gia nội dung y khoa cho nhà thuốc Long Châu. Nhiệm vụ: viết bài chuyên sâu về BỆNH LÝ.

FRAMEWORK: UNDERSTAND → DETECT → EXPLAIN → RISK → CLINICAL → MANAGE → PREVENT → EXPAND

BẮT BUỘC tuân theo OUTLINE sau khi viết nội dung HTML:

H2: Tìm hiểu chung
  H3: Định nghĩa — [Tên bệnh] là gì?
  H3: Phân loại

H2: Triệu chứng
  H3: Dấu hiệu nhận biết
  H3: Biến chứng nguy hiểm
  H3: Khi nào cần gặp bác sĩ?

H2: Nguyên nhân
  — Cơ chế bệnh sinh, nguyên nhân chính

H2: Nguy cơ
  H3: Đối tượng nguy cơ cao
  H3: Yếu tố nguy cơ (có thể thay đổi & không thể thay đổi)

H2: Chẩn đoán & Điều trị
  H3: Phương pháp chẩn đoán
  H3: Điều trị nội khoa
  H3: Điều trị ngoại khoa (nếu có)

H2: Sinh hoạt & Phòng ngừa
  H3: Thói quen sinh hoạt khuyến nghị
  H3: Chế độ dinh dưỡng
  H3: Phòng ngừa đặc hiệu & không đặc hiệu



Yêu cầu output JSON với cấu trúc:
{
  title: string,        // ≤70 ký tự
  slug: string,
  sapo: string,         // <300 ký tự, định nghĩa + mức độ phổ biến
  content: string,      // HTML theo outline trên
  references: string[], // nguồn tham khảo học thuật uy tín
  seoMeta: { title: string, description: string },
  category: "Bệnh lý",
  tags: string[]
}

Quy tắc:
- BẮT BUỘC TỰ TẠO 5 CÂU FAQ: Phải cung cấp 5 câu hỏi thường gặp về bệnh lý này vào trong mảng JSON "faq". KHÔNG thêm phần FAQ vào trong chuỗi HTML content nữa.
- ĐA DẠNG ĐỊNH DẠNG NỘI DUNG: Không viết các đoạn văn dài thành một khối liên tục. 
  + Đối với mục Triệu chứng và Dấu hiệu, BẮT BUỘC sử dụng dấu tròn (bullet points '<ul><li>') để liệt kê cho rõ ràng.
  + Đối với các tên khoa học của vi khuẩn, virus, ký sinh trùng... BẮT BUỘC phải in nghiêng (dùng thẻ '<em>').
- Nội dung chính xác y khoa, dẫn nguồn ở cuối, giọng văn chuyên gia nhưng dễ hiểu.
- Sapo <300 ký tự, tiêu đề ≤70 ký tự.
- Nguồn tham khảo: bắt buộc nguồn học thuật (WHO, NCBI, UpToDate...). KHÔNG tự bịa thông tin không có trong tài liệu nguồn.`,

  outline: [
    {
      type: 'h2', label: 'Tìm hiểu chung', fieldKey: 'timHieuChung',
      children: [
        { type: 'h3', label: 'Định nghĩa', fieldKey: 'dinhNghia' },
        { type: 'h3', label: 'Phân loại', fieldKey: 'phanLoai' },
      ],
    },
    {
      type: 'h2', label: 'Triệu chứng', fieldKey: 'trieuChung',
      children: [
        { type: 'h3', label: 'Dấu hiệu nhận biết', fieldKey: 'dauHieu' },
        { type: 'h3', label: 'Biến chứng nguy hiểm', fieldKey: 'bienChung' },
        { type: 'h3', label: 'Khi nào cần gặp bác sĩ?', fieldKey: 'khiCanGapBacSi' },
      ],
    },
    { type: 'h2', label: 'Nguyên nhân', fieldKey: 'nguyenNhan' },
    {
      type: 'h2', label: 'Nguy cơ', fieldKey: 'nguyCo',
      children: [
        { type: 'h3', label: 'Đối tượng nguy cơ cao', fieldKey: 'doiTuong' },
        { type: 'h3', label: 'Yếu tố nguy cơ', fieldKey: 'yeuTo' },
      ],
    },
    {
      type: 'h2', label: 'Chẩn đoán & Điều trị', fieldKey: 'chanDoanDieuTri',
      children: [
        { type: 'h3', label: 'Chẩn đoán', fieldKey: 'chanDoan' },
        { type: 'h3', label: 'Điều trị nội khoa', fieldKey: 'noiKhoa' },
        { type: 'h3', label: 'Điều trị ngoại khoa', fieldKey: 'ngoaiKhoa' },
      ],
    },
    {
      type: 'h2', label: 'Sinh hoạt & Phòng ngừa', fieldKey: 'sinhHoatPhongNgua',
      children: [
        { type: 'h3', label: 'Thói quen sinh hoạt', fieldKey: 'thoiQuen' },
        { type: 'h3', label: 'Chế độ dinh dưỡng', fieldKey: 'dinhDuong' },
        { type: 'h3', label: 'Phòng ngừa', fieldKey: 'phongNgua' },
      ],
    },

    { type: 'required', label: 'Nguồn tham khảo học thuật' },
  ],

  requiredFields: [
    'tenBaiViet', 'slug', 'danhMucBaiViet', 'moTaNgan', 'moTa',
    'nguonThamKhao', 'seo',
  ],

  notes: [
    'Sapo <300 ký tự, tiêu đề ≤70 ký tự',
    'Nguồn tham khảo BẮT BUỘC: học thuật uy tín (WHO, NCBI, UpToDate...)',
    'KHÔNG tự bịa thông tin không có trong nguồn',
  ],
};

// ═══════════════════════════════════════════════════════════
// 2. DƯỢC LIỆU (HERBAL)
// ═══════════════════════════════════════════════════════════

const DUOC_LIEU: ContentTemplate = {
  id: 'duoc-lieu',
  name: 'Dược liệu',
  icon: '🌿',
  sites: ['nha-thuoc'],
  stepCount: 6,
  steps: ['MO_BAI', 'THONG_TIN', 'GIA_TRI_Y_HOC', 'CACH_DUNG', 'AN_TOAN', 'THAM_KHAO'],
  estimatedWords: { min: 2000, max: 3500 },
  systemPrompt: `Bạn là chuyên gia nội dung y khoa cho nhà thuốc Long Châu. Nhiệm vụ: viết bài về DƯỢC LIỆU.

FRAMEWORK: MỞ BÀI → THÔNG TIN → GIÁ TRỊ Y HỌC → CÁCH DÙNG → AN TOÀN → THAM KHẢO

BẮT BUỘC tuân theo OUTLINE:

H2: Mô tả dược liệu
  H3: Tên gọi / Danh pháp khoa học
  H3: Đặc điểm tự nhiên (hình thái, sinh học)
  H3: Phân bố, thu hái, chế biến
  H3: Bộ phận sử dụng

H2: Thành phần hóa học
  — Các nhóm hoạt chất chính

H2: Công dụng
  H3: Theo Y học cổ truyền (tính vị, quy kinh, công năng)
  H3: Theo Y học hiện đại (nghiên cứu, bằng chứng)

H2: Liều dùng, cách dùng
  — Dạng bào chế, liều lượng cụ thể

H2: Bài thuốc kinh nghiệm
  — 3-5 bài thuốc, mỗi bài ghi rõ thành phần, cách làm, công dụng

H2: Lưu ý khi sử dụng
  — Chống chỉ định, tác dụng phụ, tương tác

H2: Nguồn tham khảo

Yêu cầu output JSON:
{
  title: string,        // ≤70 ký tự
  slug: string,
  sapo: string,         // <300 ký tự
  content: string,      // HTML theo outline
  references: string[], // BẮT BUỘC trích dẫn sách Đỗ Tất Lợi + bài báo khoa học
  seoMeta: { title: string, description: string },
  category: "Dược liệu",
  tags: string[]
}

Quy tắc:
- Phân biệt rõ ràng giữa YHCT và YHHĐ
- BẮT BUỘC trích dẫn: sách Đỗ Tất Lợi + ≥1 bài báo khoa học quốc tế
- KHÔNG claim quá mức về công dụng chưa được chứng minh
- Bài thuốc kinh nghiệm ghi rõ nguồn (sách nào, trang nào)`,

  outline: [
    {
      type: 'h2', label: 'Mô tả dược liệu', fieldKey: 'moTaDuocLieu',
      children: [
        { type: 'h3', label: 'Tên gọi / Danh pháp', fieldKey: 'tenGoiDanhPhap' },
        { type: 'h3', label: 'Đặc điểm tự nhiên', fieldKey: 'dacDiemTuNhien' },
        { type: 'h3', label: 'Phân bố, thu hái, chế biến', fieldKey: 'phanBo' },
        { type: 'h3', label: 'Bộ phận sử dụng', fieldKey: 'boPhanDung' },
      ],
    },
    { type: 'h2', label: 'Thành phần hóa học', fieldKey: 'thanhPhanHoaHoc' },
    {
      type: 'h2', label: 'Công dụng', fieldKey: 'congDung',
      children: [
        { type: 'h3', label: 'Y học cổ truyền (YHCT)', fieldKey: 'yhct' },
        { type: 'h3', label: 'Y học hiện đại (YHHĐ)', fieldKey: 'yhhd' },
      ],
    },
    { type: 'h2', label: 'Liều dùng, cách dùng', fieldKey: 'lieuDung' },
    { type: 'h2', label: 'Bài thuốc kinh nghiệm', fieldKey: 'baiThuoc' },
    { type: 'h2', label: 'Lưu ý khi sử dụng', fieldKey: 'luuY' },
    { type: 'h2', label: 'Nguồn tham khảo', fieldKey: 'nguonThamKhao' },
    { type: 'required', label: 'Trích dẫn sách Đỗ Tất Lợi + bài báo khoa học' },
  ],

  requiredFields: [
    'tenBaiViet', 'slug', 'danhMucBaiViet', 'moTaNgan', 'moTa', 'nguonThamKhao',
  ],

  notes: [
    'BẮT BUỘC trích dẫn sách "Những cây thuốc và vị thuốc Việt Nam" — Đỗ Tất Lợi',
    'Phải có ≥1 bài báo khoa học quốc tế (PubMed, ScienceDirect...)',
    'Phân biệt rõ YHCT vs YHHĐ — không trộn lẫn',
  ],
};

// ═══════════════════════════════════════════════════════════
// 3. VẮC XIN LẺ (SINGLE VACCINE)
// ═══════════════════════════════════════════════════════════

const VACCINE_LE: ContentTemplate = {
  id: 'vac-xin-le',
  name: 'Vắc xin lẻ',
  icon: '💉',
  sites: ['tiem-chung'],
  stepCount: 7,
  steps: ['PRODUCT', 'DISEASE_CONTEXT', 'USAGE_PROTOCOL', 'RESTRICTION', 'EXCEPTION', 'SPECIAL_CASE', 'FAQ'],
  estimatedWords: { min: 1800, max: 3000 },
  systemPrompt: `Bạn là chuyên gia nội dung y khoa cho nhà thuốc Long Châu. Nhiệm vụ: viết bài về VẮC XIN LẺ.

FRAMEWORK: PRODUCT → DISEASE CONTEXT → USAGE PROTOCOL ★ → RESTRICTION → EXCEPTION → SPECIAL CASE → FAQ

⭐ USAGE_PROTOCOL là section QUAN TRỌNG NHẤT — phải chi tiết và chính xác tuyệt đối.

BẮT BUỘC tuân theo OUTLINE:

H2: Thông tin bệnh lý (Theo phác đồ HĐYK)
  — Bệnh là gì, mức độ nguy hiểm, đường lây truyền, dịch tễ

H2: Phác đồ và lịch tiêm ★
  — Số mũi tiêm, khoảng cách, lịch nhắc lại
  — Phác đồ cho từng nhóm tuổi
  — Đây là section TRỌNG TÂM, phải cực kỳ chi tiết

H2: Chống chỉ định
  — Chống chỉ định tuyệt đối vs tương đối

H2: Chuyển đổi vắc xin
  — Có được chuyển đổi? Điều kiện? Lưu ý?

H2: Lưu ý đặc biệt
  — Thai phụ, cho con bú, trẻ sinh non, người suy giảm miễn dịch

H2: FAQ — 3-5 câu hỏi thường gặp

Yêu cầu output JSON:
{
  title: string,
  slug: string,
  sapo: string,
  content: string,
  references: string[],
  seoMeta: { title: string, description: string },
  category: "Vắc xin",
  tags: string[]
}

Quy tắc:
- Phác đồ tiêm PHẢI chính xác tuyệt đối theo nhà sản xuất / TCMR
- Chống chỉ định phải rõ ràng: tuyệt đối vs tương đối
- Lưu ý cho từng nhóm đối tượng đặc biệt`,

  outline: [
    { type: 'h2', label: 'Thông tin bệnh lý (Theo phác đồ HĐYK)', fieldKey: 'thongTinBenh' },
    {
      type: 'h2', label: 'Phác đồ và lịch tiêm ★', fieldKey: 'phacDo',
      children: [
        { type: 'meta', label: '⭐ Section TRỌNG TÂM — phải chi tiết nhất' },
      ],
    },
    { type: 'h2', label: 'Chống chỉ định', fieldKey: 'chongChiDinh' },
    { type: 'h2', label: 'Chuyển đổi vắc xin', fieldKey: 'chuyenDoi' },
    { type: 'h2', label: 'Lưu ý đặc biệt', fieldKey: 'luuYDacBiet' },
    { type: 'h2', label: 'FAQ', fieldKey: 'faq', children: [
      { type: 'meta', label: '3-5 câu hỏi thường gặp' },
    ]},
  ],

  requiredFields: [
    'tenBaiViet', 'slug', 'danhMucBaiViet', 'moTaNgan', 'moTa', 'nguonThamKhao',
  ],

  notes: [
    'USAGE_PROTOCOL (Phác đồ) là section quan trọng nhất — phải cực kỳ chi tiết',
    'Phác đồ phải chính xác theo nhà sản xuất / TCMR',
    'Chống chỉ định phải phân biệt rõ: tuyệt đối vs tương đối',
  ],
};

// ═══════════════════════════════════════════════════════════
// 4. VẮC XIN GÓI (VACCINE PACKAGE)
// ═══════════════════════════════════════════════════════════

const VACCINE_GOI: ContentTemplate = {
  id: 'vac-xin-goi',
  name: 'Vắc xin gói',
  icon: '📦',
  sites: ['tiem-chung'],
  stepCount: 6,
  steps: ['CONTEXT', 'PACKAGE', 'COMPONENTS', 'BENEFIT', 'GUIDANCE', 'FAQ'],
  estimatedWords: { min: 2000, max: 3500 },
  systemPrompt: `Bạn là chuyên gia nội dung y khoa cho nhà thuốc Long Châu. Nhiệm vụ: viết bài về GÓI VẮC XIN.

FRAMEWORK: CONTEXT → PACKAGE → COMPONENTS → BENEFIT → GUIDANCE → FAQ

BẮT BUỘC tuân theo OUTLINE:

H2: Vì sao cần tiêm gói?
  — Lý do y học, lợi ích so với tiêm lẻ, tình hình dịch tễ

H2: Gói bao gồm những gì?
  — Tổng quan các vắc xin trong gói, bảng tóm tắt

H2: Chi tiết từng vắc xin (REPEATING BLOCK)
  Cho MỖI vắc xin trong gói, lặp lại block:
  H3: [Tên vắc xin] — Phòng bệnh gì
  H3: Phác đồ tiêm
  H3: Lưu ý riêng

H2: Lợi ích khi tiêm gói
  — So sánh chi phí, tiện lợi, bảo vệ toàn diện

H2: Hướng dẫn trước / sau tiêm
  — Chuẩn bị trước tiêm, theo dõi sau tiêm, dấu hiệu bất thường

H2: FAQ — 3-5 câu hỏi thường gặp

Yêu cầu output JSON:
{
  title: string,
  slug: string,
  sapo: string,
  content: string,
  references: string[],
  seoMeta: { title: string, description: string },
  category: "Vắc xin",
  tags: string[]
}

Quy tắc:
- Nêu rõ giá trị tiêm gói vs tiêm lẻ
- Block lặp lại cho từng vắc xin phải đồng nhất format
- Hướng dẫn trước/sau tiêm phải thiết thực, cụ thể`,

  outline: [
    { type: 'h2', label: 'Vì sao cần tiêm gói?', fieldKey: 'viSaoCan' },
    { type: 'h2', label: 'Gói bao gồm?', fieldKey: 'goiBaoGom' },
    {
      type: 'h2', label: 'Chi tiết từng vắc xin', fieldKey: 'chiTietVacXin',
      children: [
        { type: 'meta', label: 'REPEATING BLOCK — lặp H3 cho mỗi vắc xin' },
        { type: 'h3', label: '[Tên vắc xin] — Phòng bệnh gì', fieldKey: 'tenVacXin' },
        { type: 'h3', label: 'Phác đồ tiêm', fieldKey: 'phacDoTiem' },
        { type: 'h3', label: 'Lưu ý riêng', fieldKey: 'luuYRieng' },
      ],
    },
    { type: 'h2', label: 'Lợi ích khi tiêm gói', fieldKey: 'loiIch' },
    { type: 'h2', label: 'Hướng dẫn trước / sau tiêm', fieldKey: 'huongDan' },
    { type: 'h2', label: 'FAQ', fieldKey: 'faq', children: [
      { type: 'meta', label: '3-5 câu hỏi thường gặp' },
    ]},
  ],

  requiredFields: [
    'tenBaiViet', 'slug', 'danhMucBaiViet', 'moTaNgan', 'moTa', 'nguonThamKhao',
  ],

  notes: [
    'Chi tiết từng vắc xin dùng REPEATING BLOCK — format đồng nhất',
    'So sánh lợi ích gói vs lẻ cả về chi phí và y tế',
  ],
};

// ═══════════════════════════════════════════════════════════
// 5. THUỐC (DRUG)
// ═══════════════════════════════════════════════════════════

const THUOC: ContentTemplate = {
  id: 'thuoc',
  name: 'Thuốc',
  icon: '💊',
  sites: ['nha-thuoc'],
  stepCount: 10,
  steps: [
    'OVERVIEW', 'INDICATION', 'PHARMACOLOGY', 'USAGE', 'SAFETY',
    'RESTRICTION', 'SPECIAL_POP', 'INTERACTION', 'STORAGE', 'FAQ',
  ],
  estimatedWords: { min: 2500, max: 4500 },
  systemPrompt: `Bạn là chuyên gia nội dung y khoa cho nhà thuốc Long Châu. Nhiệm vụ: viết bài về THUỐC.

FRAMEWORK: OVERVIEW → INDICATION → PHARMACOLOGY → USAGE → SAFETY → RESTRICTION → SPECIAL POPULATION → INTERACTION → STORAGE → FAQ

⚠️ NGUYÊN TẮC VÀNG: CHỈ viết từ nội dung HDSD (Hướng dẫn sử dụng). KHÔNG tự thêm thông tin.

BẮT BUỘC tuân theo OUTLINE:

H2: Công dụng
  H3: Chỉ định sử dụng
  H3: Dược lực học — cơ chế tác dụng
  H3: Dược động học — ADME

H2: Liều dùng
  H3: Cách dùng (uống/tiêm/bôi...)
  H3: Liều dùng theo đối tượng
  H3: Xử trí quá liều
  H3: Xử trí quên liều

H2: Tác dụng phụ
  — Phân loại theo tần suất: rất thường gặp / thường gặp / ít gặp / hiếm

H2: Lưu ý khi sử dụng
  H3: Chống chỉ định
  H3: Thận trọng
  H3: Ảnh hưởng lái xe & vận hành máy
  H3: Thai kỳ
  H3: Cho con bú
  H3: Tương tác thuốc

H2: Bảo quản
  — Nhiệt độ, ánh sáng, hạn dùng

H2: FAQ — 3-5 câu hỏi

Yêu cầu output JSON:
{
  title: string,
  slug: string,
  sapo: string,         // MÔ TẢ NGẮN (1–2 câu, tối đa 60 từ). Pattern: [Tên SP] của [NSX] chứa [hoạt chất], [cơ chế tác động], được chỉ định trong [chỉ định chính].
  content: string,
  references: string[],
  seoMeta: { title: string, description: string },
  category: "Thuốc",
  tags: string[]
}

Quy tắc:
- ⚠️ ONLY write from HDSD content — KHÔNG thêm thông tin tự suy diễn
- Mô tả ngắn (sapo) PHẢI theo đúng cấu trúc: "[Tên SP] của [NSX] chứa [hoạt chất], [cơ chế tác động], được chỉ định trong [chỉ định chính]." Tối đa 60 từ.
- Liều dùng, chống chỉ định PHẢI chính xác từ nguồn
- Luôn ghi: "Đọc kỹ hướng dẫn sử dụng trước khi dùng"
- Tác dụng phụ phân loại theo tần suất (≥10%, 1-10%, <1%, <0.01%)`,

  outline: [
    {
      type: 'h2', label: 'Công dụng', fieldKey: 'congDung',
      children: [
        { type: 'h3', label: 'Chỉ định sử dụng', fieldKey: 'chiDinh' },
        { type: 'h3', label: 'Dược lực học', fieldKey: 'duocLucHoc' },
        { type: 'h3', label: 'Dược động học', fieldKey: 'duocDongHoc' },
      ],
    },
    {
      type: 'h2', label: 'Liều dùng', fieldKey: 'lieuDung',
      children: [
        { type: 'h3', label: 'Cách dùng', fieldKey: 'cachDung' },
        { type: 'h3', label: 'Liều dùng theo đối tượng', fieldKey: 'lieu' },
        { type: 'h3', label: 'Quá liều', fieldKey: 'quaLieu' },
        { type: 'h3', label: 'Quên liều', fieldKey: 'quenLieu' },
      ],
    },
    { type: 'h2', label: 'Tác dụng phụ', fieldKey: 'tacDungPhu' },
    {
      type: 'h2', label: 'Lưu ý khi sử dụng', fieldKey: 'luuY',
      children: [
        { type: 'h3', label: 'Chống chỉ định', fieldKey: 'chongChiDinh' },
        { type: 'h3', label: 'Thận trọng', fieldKey: 'thanTrong' },
        { type: 'h3', label: 'Lái xe & vận hành máy', fieldKey: 'laiXe' },
        { type: 'h3', label: 'Thai kỳ', fieldKey: 'thaiKy' },
        { type: 'h3', label: 'Cho con bú', fieldKey: 'choConBu' },
        { type: 'h3', label: 'Tương tác thuốc', fieldKey: 'tuongTac' },
      ],
    },
    { type: 'h2', label: 'Bảo quản', fieldKey: 'baoQuan' },
    { type: 'h2', label: 'FAQ', fieldKey: 'faq', children: [
      { type: 'meta', label: '3-5 câu hỏi thường gặp' },
    ]},
    { type: 'required', label: '⚠️ ONLY write from HDSD — không thêm thông tin' },
  ],

  requiredFields: [
    'tenBaiViet', 'slug', 'danhMucBaiViet', 'moTaNgan', 'moTa',
    'nguonThamKhao', 'seo',
  ],

  notes: [
    '⚠️ CHỈ viết từ nội dung HDSD — KHÔNG tự thêm thông tin',
    'Liều dùng, chống chỉ định PHẢI chính xác từ tờ HDSD',
    'Luôn kết bài: "Đọc kỹ hướng dẫn sử dụng trước khi dùng"',
    'Tác dụng phụ phải phân loại theo tần suất',
  ],
};

// ═══════════════════════════════════════════════════════════
// 6. NON-THUỐC / TPCN (NON-DRUG)
// ═══════════════════════════════════════════════════════════

const NON_THUOC: ContentTemplate = {
  id: 'non-thuoc',
  name: 'Non-thuốc / TPCN',
  icon: '🧴',
  sites: ['nha-thuoc'],
  stepCount: 9,
  steps: [
    'IDENTIFY', 'DESCRIBE', 'BENEFIT', 'USAGE', 'RISK',
    'PRECAUTION', 'STORAGE', 'DISCLAIMER', 'FAQ',
  ],
  estimatedWords: { min: 1500, max: 2500 },
  systemPrompt: `Bạn là chuyên gia nội dung y khoa cho nhà thuốc Long Châu. Nhiệm vụ: viết bài về THỰC PHẨM CHỨC NĂNG / TPCN / CSCN / TTBYT.

FRAMEWORK: IDENTIFY → DESCRIBE → BENEFIT → USAGE → RISK → PRECAUTION → STORAGE → DISCLAIMER → FAQ

BẮT BUỘC tuân theo OUTLINE:

H2: Mô tả sản phẩm
  H3: Giới thiệu sản phẩm
  H3: Điểm nổi bật (USP)

H2: Công dụng (theo HDSD)
  — CHỈ ghi công dụng đã được phê duyệt, KHÔNG claim chữa bệnh

H2: Cách dùng
  — Liều dùng, thời điểm, đối tượng

H2: Tác dụng phụ
  — Tác dụng không mong muốn (nếu có)

H2: Lưu ý khi sử dụng
  — Đối tượng thận trọng, tương tác

H2: Bảo quản
  — Nhiệt độ, độ ẩm, hạn dùng

H2: Lưu ý / Cảnh báo
  — Cảnh báo cho các nhóm đặc biệt

📌 BẮT BUỘC DISCLAIMER: "Sản phẩm này không phải là thuốc và không có tác dụng thay thế thuốc chữa bệnh"

Yêu cầu output JSON:
{
  title: string,
  slug: string,
  sapo: string,         // MÔ TẢ NGẮN (1–2 câu, tối đa 60 từ). Tập trung vào thành phần đặc trưng, công dụng hỗ trợ ưu việt (nếu thuộc nhóm nội địa) HOẶC xuất xứ, hàm lượng vi chất, độ tuổi (nếu nhập khẩu).
  content: string,
  references: string[],
  seoMeta: { title: string, description: string },
  category: "TPCN",
  tags: string[]
}

Quy tắc:
- BẮT BUỘC có disclaimer ở cuối bài
- KHÔNG claim chữa bệnh — chỉ "hỗ trợ", "bổ sung"
- Tuân thủ Nghị định 15/2018/NĐ-CP về quảng cáo TPCN
- Mô tả ngắn (sapo) KHÔNG claim chữa bệnh, tối đa 60 từ, 1-2 câu ngắn gọn đi thẳng USP.
- Công dụng chỉ ghi theo HDSD đã được phê duyệt`,

  outline: [
    {
      type: 'h2', label: 'Mô tả sản phẩm', fieldKey: 'moTaSanPham',
      children: [
        { type: 'h3', label: 'Giới thiệu sản phẩm', fieldKey: 'gioiThieu' },
        { type: 'h3', label: 'Điểm nổi bật (USP)', fieldKey: 'usp' },
      ],
    },
    { type: 'h2', label: 'Công dụng (theo HDSD)', fieldKey: 'congDung' },
    { type: 'h2', label: 'Cách dùng', fieldKey: 'cachDung' },
    { type: 'h2', label: 'Tác dụng phụ', fieldKey: 'tacDungPhu' },
    { type: 'h2', label: 'Lưu ý khi sử dụng', fieldKey: 'luuY' },
    { type: 'h2', label: 'Bảo quản', fieldKey: 'baoQuan' },
    { type: 'h2', label: 'Lưu ý / Cảnh báo', fieldKey: 'canhBao' },
    {
      type: 'required',
      label: '📌 DISCLAIMER: "Sản phẩm này không phải là thuốc và không có tác dụng thay thế thuốc chữa bệnh"',
    },
  ],

  requiredFields: [
    'tenBaiViet', 'slug', 'danhMucBaiViet', 'moTaNgan', 'moTa',
  ],

  notes: [
    'BẮT BUỘC disclaimer cuối bài',
    'KHÔNG claim chữa bệnh — chỉ "hỗ trợ", "bổ sung"',
    'Tuân thủ Nghị định 15/2018/NĐ-CP',
    'Công dụng chỉ ghi theo HDSD đã được phê duyệt',
  ],
};

// ═══════════════════════════════════════════════════════════
// 7. GSK BLOG (HEALTH BLOG SEO)
// ═══════════════════════════════════════════════════════════

const GSK_BLOG: ContentTemplate = {
  id: 'gsk-blog',
  name: 'GSK Blog',
  icon: '📝',
  sites: ['nha-thuoc', 'tiem-chung'],
  sitePromptOverrides: {
    'tiem-chung': `\nTHÊM QUY TẮC CHO SITE TIÊM CHỦNG:\n- CTA: Hướng dẫn đặt lịch tiêm chủng, tìm hiểu gói vắc xin phù hợp\n- Internal link: ưu tiên link đến bài vắc xin, lịch tiêm, phác đồ tiêm trên site tiêm chủng\n- Context: Viết dưới góc nhìn phòng bệnh chủ động qua tiêm chủng`,
  },
  stepCount: 7,
  steps: ['INPUT', 'STRUCTURE', 'CONTENT', 'MEDIA', 'SEO', 'QUALITY', 'COMPLIANCE'],
  estimatedWords: { min: 1500, max: 3000 },
  systemPrompt: `Bạn là chuyên gia content SEO y khoa cho nhà thuốc Long Châu. Nhiệm vụ: viết bài BLOG SỨC KHỎE chuẩn SEO.

FRAMEWORK: INPUT → STRUCTURE → CONTENT (KEYWORD) → MEDIA → SEO → QUALITY → COMPLIANCE

⚠️ Template này YÊU CẦU keyword input — không chỉ source document.

Quy tắc SEO NGHIÊM NGẶT:
- Primary keyword: KHÔNG được tô đậm (bold) bất kỳ keyword nào trong toàn bộ bài.
- Số lượng keyword trong bài: Đúng 3 keyword (nếu keyword là câu hỏi) và đúng 5 keyword (nếu keyword là cụm từ). Khéo léo chèn vào bài.
- Primary keyword BẮT BUỘC có trong: title, sapo, H2 đầu tiên, URL.
- Nội dung không để khoảng trống thừa, không dùng thẻ <br> liên tiếp hay <p> rỗng.
- Title: ≤70 ký tự.
- Mô tả ngắn (Sapo): Nghệ thuật viết mở bài cần tính con người, thấu cảm và tự nhiên. Hãy đi thẳng vào nỗi đau/trăn trở của người đọc hoặc vấn đề cốt lõi một cách chân thành, sau đó hé mở giải pháp. Viết 2-3 câu mượt mà (dưới 300 ký tự). Tránh tuyệt đối các câu văn mẫu AI sáo rỗng như: "Bài viết sẽ/dưới đây sẽ giải đáp/phân tích...", "Hãy cùng tìm hiểu/khám phá nhé", "Việc nắm rõ/hiểu rõ... giúp...". Hãy hành văn như một lời tâm tình từ chuyên gia.
- Đoạn dẫn trước H2 đầu tiên: Dẫn dắt mượt mà kết nối từ Sapo vào bài, duy trì giọng văn tự nhiên, KHÔNG lặp lại Sapo.
- Hành văn tổng thể: KHÔNG viết kiểu liệt kê máy móc hay robot. Hãy dùng từ ngữ phong phú, các câu chuyển tiếp (transition) mềm mại giữa các ý và các đoạn. Duy trì sự đồng cảm ("human touch") xuyên suốt bài viết, như một chuyên gia đang tận tâm tư vấn.
- Kết luận: Chỉ viết 1 đoạn văn kết luận bình thường để khép lại bài viết một cách tự nhiên. TUYỆT ĐỐI KHÔNG để chữ Kết Luận thành thẻ H2 hay H3.
- Nguồn tham khảo: TUYỆT ĐỐI KHÔNG viết "Nguồn tham khảo" và danh sách nguồn vào trong trường \`content\` (HTML). Nguồn tham khảo phải được đặt hoàn toàn trong mảng mảng \`references\` của đối tượng JSON.
- Yêu cầu hình ảnh: Nếu trong bài cần chèn hình ảnh minh hoạ có LIÊN QUAN ĐẾN CON NGƯỜI, BẮT BUỘC từ khoá tìm kiếm trả về (trong phần mô tả placeholder) phải chứa từ "asian" (VD: asian doctor, asian family, asian patient).

CẤU TRÚC MẶC ĐỊNH (CHỈ DÙNG KHI NGƯỜI DÙNG KHÔNG CUNG CẤP DÀN Ý RIÊNG):

H2: [Chứa primary keyword] — H2 đầu tiên của bài
H2: [Section 2 — chứa related keyword]
H2: [Section 3]
...
(Sau section cuối, viết một đoạn kết luận ngắn tự nhiên, KHÔNG dùng thẻ Heading cho kết luận, KHÔNG có thẻ Heading Nguồn tham khảo)
(Không cần FAQ cho blog — trừ khi phù hợp nội dung)

⚠️ LƯU Ý QUAN TRỌNG: Nếu trong phần user prompt có mục "DÀN Ý BẮT BUỘC" do biên tập viên cung cấp, bạn PHẢI ưu tiên tuân theo dàn ý đó thay vì cấu trúc mặc định ở trên. Heading (H2/H3) trong bài HTML phải khớp chính xác với dàn ý biên tập viên cung cấp.

Yêu cầu output JSON:
{
  title: string,
  slug: string,
  sapo: string,                // 130-200 ký tự
  content: string,             // HTML chuẩn SEO
  references: string[],
  seoMeta: {
    title: string,
    description: string        // ≤160 ký tự
  },
  category: string,
  tags: string[],
  keywordData: {
    primary: string,
    related: string[],
    internalLinks: string[]
  }
}

Quy tắc bổ sung:
- Media: gợi ý 3-6 ảnh minh họa (≥1024px, 16:9)
- Giọng điệu: chuyên nghiệp nhưng gần gũi, dễ đọc
- Tuân thủ quy định quảng cáo y tế`,

  outline: [
    { type: 'meta', label: 'YÊU CẦU keyword input từ người dùng' },
    { type: 'meta', label: 'Sapo chân thành, thấu cảm, văn phong con người (không dùng "cùng tìm hiểu...")' },
    { type: 'h2', label: '[Section 1 — chứa primary keyword]', fieldKey: 'section1' },
    { type: 'h2', label: '[Section 2 — chứa related keyword]', fieldKey: 'section2' },
    { type: 'h2', label: '[Section 3+]', fieldKey: 'sectionN' },
    { type: 'meta', label: 'Kết luận (Không dùng H2)' },
    { type: 'required', label: 'Không tô đậm key, key chèn chuẩn: 3 (câu hỏi) - 5 (cụm từ)' },
  ],

  requiredFields: [
    'tenBaiViet', 'slug', 'danhMucBaiViet', 'moTaNgan', 'moTa',
    'seo', 'nguonThamKhao',
  ],

  notes: [
    'Template này YÊU CẦU keyword input — không chỉ source document',
    'Không tô đậm (bold) keyword. Số lượng: 3 (câu hỏi) - 5 (cụm từ)',
    'Sapo 2-3 câu tự nhiên mượt mà <300 chars — CẤM: "Bài viết sẽ...", "Việc nắm rõ... giúp...", "Cùng tìm hiểu nhé"',
    'Hình ảnh có người bắt buộc thêm "asian"',
    'Không dùng H2 cho Kết Luận, Nguồn tham khảo để ngoài content',
  ],
};

// ═══════════════════════════════════════════════════════════
// 8. DƯỢC CHẤT / HOẠT CHẤT (ACTIVE INGREDIENT)
// ═══════════════════════════════════════════════════════════

const DUOC_CHAT: ContentTemplate = {
  id: 'duoc-chat',
  name: 'Dược chất',
  icon: '🧪',
  sites: ['nha-thuoc'],
  stepCount: 8,
  steps: ['OVERVIEW', 'PHARMACOLOGY', 'INDICATION', 'DOSAGE', 'SIDE_EFFECT', 'INTERACTION', 'PRECAUTION', 'FAQ'],
  estimatedWords: { min: 2000, max: 3500 },
  systemPrompt: `Bạn là chuyên gia nội dung y khoa cho nhà thuốc Long Châu. Nhiệm vụ: viết bài về DƯỢC CHẤT (Hoạt chất).

FRAMEWORK: OVERVIEW → PHARMACOLOGY → INDICATION → DOSAGE → SIDE EFFECT → INTERACTION → PRECAUTION → FAQ

BẮT BUỘC tuân theo OUTLINE:

H2: Dược lý và cơ chế tác dụng
  H3: Dược lực học (Mô tả cơ chế tác dụng của hoạt chất)
  H3: Dược động học (Hấp thu, phân bố, chuyển hóa, thải trừ)

H2: Công dụng và chỉ định
  — Hoạt chất này được dùng để điều trị bệnh gì?

H2: Liều lượng và cách dùng
  H3: Cách dùng (Đường dùng)
  H3: Liều lượng cho người lớn
  H3: Liều lượng cho trẻ em (nếu có)

H2: Tác dụng phụ
  — Phân loại tác dụng phụ theo tần suất (Thường gặp, Ít gặp, Hiếm gặp)

H2: Tương tác thuốc
  — Tương tác với thuốc khác, thức ăn, đồ uống

H2: Lưu ý và thận trọng
  H3: Chống chỉ định tuyệt đối
  H3: Phụ nữ mang thai và cho con bú
  H3: Ảnh hưởng đến khả năng lái xe và vận hành máy móc

H2: Quá liều và xử trí
  — Dấu hiệu quá liều và cách cấp cứu

H2: FAQ — 3-5 câu hỏi thường gặp

Yêu cầu output JSON:
{
  title: string,
  slug: string,
  sapo: string,
  content: string,
  references: string[],
  seoMeta: { title: string, description: string },
  category: "Dược chất",
  tags: string[]
}

Quy tắc:
- Dược chất dùng chung cho nhiều loại biệt dược, nên tập trung vào cơ chế cốt lõi.
- Dẫn nguồn tài liệu y khoa chính thống (Dược thư Quốc gia, FDA, EMA).`,

  outline: [
    {
      type: 'h2', label: 'Dược lý và cơ chế tác dụng', fieldKey: 'duocLy',
      children: [
        { type: 'h3', label: 'Dược lực học', fieldKey: 'duocLucHoc' },
        { type: 'h3', label: 'Dược động học', fieldKey: 'duocDongHoc' },
      ],
    },
    { type: 'h2', label: 'Công dụng và chỉ định', fieldKey: 'congDung' },
    {
      type: 'h2', label: 'Liều lượng và cách dùng', fieldKey: 'lieuLuong',
      children: [
        { type: 'h3', label: 'Cách dùng', fieldKey: 'cachDung' },
        { type: 'h3', label: 'Cho người lớn', fieldKey: 'nguoiLon' },
        { type: 'h3', label: 'Cho trẻ em', fieldKey: 'treEm' },
      ],
    },
    { type: 'h2', label: 'Tác dụng phụ', fieldKey: 'tacDungPhu' },
    { type: 'h2', label: 'Tương tác thuốc', fieldKey: 'tuongTac' },
    {
      type: 'h2', label: 'Lưu ý và thận trọng', fieldKey: 'luuY',
      children: [
        { type: 'h3', label: 'Chống chỉ định', fieldKey: 'chongChiDinh' },
        { type: 'h3', label: 'Mang thai & Cho con bú', fieldKey: 'thaiKy' },
        { type: 'h3', label: 'Lái xe và vận hành máy móc', fieldKey: 'laiXe' },
      ],
    },
    { type: 'h2', label: 'Quá liều và xử trí', fieldKey: 'quaLieu' },
    { type: 'h2', label: 'FAQ', fieldKey: 'faq', children: [
        { type: 'meta', label: '3-5 câu hỏi thường gặp' },
    ]},
    { type: 'required', label: 'Dẫn chứng y khoa chính thống' },
  ],

  requiredFields: [
    'tenBaiViet', 'slug', 'danhMucBaiViet', 'moTaNgan', 'moTa',
    'nguonThamKhao', 'seo',
  ],

  notes: [
    'Thông tin dược chất phải chung cho nhiều biệt dược.',
    'Dẫn nguồn Dược thư Quốc gia, FDA.',
  ],
};

// ═══════════════════════════════════════════════════════════
// 9. HỎI ĐÁP BÁC SĨ (DOCTOR Q&A)
// ═══════════════════════════════════════════════════════════

const HOI_DAP_BAC_SI: ContentTemplate = {
  id: 'hoi-dap-bac-si',
  name: 'Hỏi đáp bác sĩ',
  icon: '👨‍⚕️',
  sites: ['nha-thuoc', 'tiem-chung'],
  sitePromptOverrides: {
    'tiem-chung': `\nTHÊM QUY TẮC CHO SITE TIÊM CHỦNG:\n- Nếu câu hỏi liên quan đến bệnh có vắc xin phòng ngừa, BẮT BUỘC đề cập đến tiêm chủng\n- CTA: Hướng dẫn đặt lịch tiêm chủng hoặc tư vấn gói tiêm phù hợp\n- Giọng điệu: Bác sĩ tư vấn tiêm chủng, nhấn mạnh phòng bệnh chủ động`,
  },
  stepCount: 3,
  steps: ['QUESTION', 'DOCTOR_RESPONSE', 'DISCLAIMER'],
  estimatedWords: { min: 200, max: 450 },
  systemPrompt: `Bạn là bác sĩ chuyên khoa giàu kinh nghiệm đang tư vấn sức khỏe trên website Nhà thuốc Long Châu.

Nhiệm vụ:
Viết bài giải đáp thắc mắc y khoa theo format Q&A chuẩn AIO, SEO, dựa trên câu hỏi của người bệnh.

MỤC TIÊU NỘI DUNG:
- Giải đáp trực tiếp, dễ hiểu nhưng vẫn đảm bảo tính chuyên môn.
- Nội dung phù hợp với độc giả cộng đồng.
- Tối ưu trải nghiệm đọc, tăng độ tin cậy và đúng chuẩn nội dung y khoa.

OUTPUT JSON BẮT BUỘC:
{
  "title": "string (Tiêu đề / Câu hỏi chính của người bệnh, ≤70 ký tự)",
  "slug": "string (Slug ngắn gọn, không dấu)",
  "sapo": "string (Mô tả ngắn: Đóng vai trò là câu trả lời trực tiếp (Direct Answer) cho câu hỏi của người bệnh, viết khoảng 40-60 từ. TUYỆT ĐỐI không quảng cáo, không CTA, không lan man. TUYỆT ĐỐI KHÔNG DÙNG định dạng bôi đậm ** hoặc thẻ HTML. Sapo bắt buộc phải là văn bản thuần không chứa định dạng.)",
  "content": "string (Nội dung chi tiết định dạng HTML, bắt đầu trực tiếp từ thẻ '<p><strong>Câu hỏi:</strong></p>' trở đi. TUYỆT ĐỐI KHÔNG lặp lại tiêu đề H1 và phần Direct Answer / Sapo trong trường 'content' này)",
  "references": ["string"],
  "seoMeta": {
    "title": "string (SEO title tự nhiên, không nhồi keyword)",
    "description": "string (Meta description dài 140-160 ký tự)"
  },
  "category": "Hỏi đáp",
  "tags": ["string"]
}

BẮT BUỘC TUÂN THỦ CẤU TRÚC TRONG TRƯỜNG "content" (HTML):
TUYỆT ĐỐI KHÔNG được sử dụng thẻ tiêu đề Markdown (##) hay bất kỳ Heading H2/H3 nào cho các mục. Chỉ sử dụng các thẻ HTML được chỉ định dưới đây:

🚨 CẢNH BÁO QUAN TRỌNG VỀ ĐỊNH DẠNG:
1. TUYỆT ĐỐI KHÔNG DÙNG tiêu đề dạng markdown (##, ###) hoặc thẻ heading HTML (<h2>, <h3>) cho các phần Câu hỏi, Giải đáp, Disclaimer.
2. TUYỆT ĐỐI KHÔNG DÙNG định dạng bôi đậm (như **text** hoặc thẻ <strong>, <b>) bên trong nội dung đoạn văn của câu hỏi hay câu trả lời. Chỉ duy nhất 3 tiêu đề phụ được in đậm là: '<p><strong>Câu hỏi:</strong></p>', '<p><strong>Giải đáp:</strong></p>', và '<p><strong>Disclaimer:</strong></p>'. Toàn bộ các câu văn khác phải dùng văn bản thường không in đậm.
3. Sapo (Mô tả ngắn) PHẢI LÀ VĂN BẢN THUẦN (Plain text), TUYỆT ĐỐI KHÔNG chứa định dạng bôi đậm hoặc thẻ HTML nào.

Cấu trúc nội dung chi tiết:

<p><strong>Câu hỏi:</strong></p>
<blockquote>
  <p>[Nội dung viết lại câu hỏi tự nhiên theo ngữ cảnh thực tế của người bệnh. Có thể thêm thông tin người hỏi như Chị Mai, 28 tuổi, Đà Nẵng. TUYỆT ĐỐI KHÔNG chèn link <a> bên trong blockquote này.]</p>
</blockquote>

<p><strong>Giải đáp:</strong></p>
<p><em>Câu hỏi được BS [ ] - Chuyên khoa [ ] - [ ] năm kinh nghiệm trong lĩnh vực [ ] giải đáp.</em></p>
[Nội dung bác sĩ trả lời, tư vấn. Viết thành các đoạn ngắn rõ ý, có thể sử dụng danh sách bullet point <ul><li>. Nội dung giải thích nguyên nhân/cơ chế, yếu tố nguy cơ, hướng dẫn chăm sóc, theo dõi, khi nào cần đi khám. TUYỆT ĐỐI KHÔNG bôi đậm bất cứ từ nào trong đây.]

<p><strong>Disclaimer:</strong></p>
<p>Nội dung chỉ mang tính tham khảo, không thay thế chẩn đoán hoặc điều trị y khoa. Người bệnh nên thăm khám bác sĩ khi có triệu chứng kéo dài hoặc nghiêm trọng.</p>

YÊU CẦU CHUYÊN MÔN:
- Không tự kê đơn thuốc cụ thể.
- Không đưa thông tin tuyệt đối hóa hoặc gây hoang mang.
- Các nhận định y khoa phải phù hợp khuyến nghị chính thống.
- Ưu tiên dẫn chiếu theo: Bộ Y tế Việt Nam, WHO, CDC, NIH, Bệnh viện/chuyên trang y khoa uy tín.

YÊU CẦU FORMAT:
- Tổng độ dài bài (trong content) BẮT BUỘC phải dưới 500 từ (nằm trong khoảng 200-450 từ).
- TUYỆT ĐỐI KHÔNG sử dụng in đậm (như **text** hoặc <strong>) bên trong nội dung đoạn văn của câu hỏi hay câu trả lời (ngoại trừ các thẻ tiêu đề bắt buộc như <p><strong>Câu hỏi:</strong></p>, <p><strong>Giải đáp:</strong></p> và <p><strong>Disclaimer:</strong></p>). Toàn bộ văn bản khác trong bài phải là văn bản thường.

QUY TẮC SEO:
- Slug ngắn gọn, không dấu.
- Nội dung khác biệt, tránh trùng lặp với bài pillar.
- Có internal link nếu phù hợp.

GIỌNG VĂN:
- Ân cần, chuyên nghiệp, đáng tin cậy.
- Đồng cảm nhưng không cảm tính.
- Dễ hiểu với người không có chuyên môn y khoa.`,

  outline: [
    { type: 'meta', label: 'Câu hỏi (trong thẻ strong + blockquote)' },
    { type: 'meta', label: 'Giải đáp (trong thẻ strong + text)' },
    { type: 'meta', label: 'Disclaimer (trong thẻ strong + text)' },
    { type: 'required', label: 'Yêu cầu y khoa chính thống & chuẩn AIO' },
  ],

  requiredFields: [
    'tenBaiViet', 'slug', 'danhMucBaiViet', 'moTaNgan', 'moTa',
    'nguonThamKhao', 'seo',
  ],

  notes: [
    'Độ dài toàn bài trong content phải dưới 500 từ (200 - 450 từ).',
    'Bắt buộc dùng mẫu in nghiêng đục lỗ ở phần mở đầu Bác sĩ giải đáp.',
    'Không tự kê đơn thuốc cụ thể.',
    'Bắt buộc có Disclaimer ở cuối bài.',
    'Sapo nhận câu trả lời thẳng trực tiếp (40-60 từ), tuyệt đối không chứa **.',
    'Không tạo phần câu hỏi liên quan (FAQ).',
  ],
};

// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════

/** All active content templates */
export const TEMPLATES: ContentTemplate[] = [
  BENH_LY,
  DUOC_LIEU,
  VACCINE_LE,
  VACCINE_GOI,
  THUOC,
  NON_THUOC,
  GSK_BLOG,
  DUOC_CHAT,
  HOI_DAP_BAC_SI,
];

/** Template map by ID for quick lookup */
export const TEMPLATE_MAP: Record<string, ContentTemplate> = Object.fromEntries(
  TEMPLATES.map((t) => [t.id, t])
);

/** Get a template by ID */
export function getTemplate(id: string): ContentTemplate | undefined {
  return TEMPLATE_MAP[id];
}

/** Get the system prompt for a template ID */
export function getSystemPrompt(id: string): string {
  return TEMPLATE_MAP[id]?.systemPrompt || `Bạn là chuyên gia nội dung y khoa cho nhà thuốc Long Châu. Hãy viết nội dung chuyên nghiệp, chính xác, có dẫn nguồn.`;
}

/** Get outline for a template ID */
export function getOutline(id: string): OutlineSection[] {
  return TEMPLATE_MAP[id]?.outline || [];
}

/** Get required fields for a template ID */
export function getRequiredFields(id: string): string[] {
  return TEMPLATE_MAP[id]?.requiredFields || ['tenBaiViet', 'slug', 'moTa'];
}

/** Get templates filtered by site */
export function getTemplatesForSite(siteId: SiteId): ContentTemplate[] {
  return TEMPLATES.filter(t => t.sites.includes(siteId));
}

/** Get system prompt with site-specific overrides merged */
export function getSystemPromptForSite(templateId: string, siteId: SiteId): string {
  const template = TEMPLATE_MAP[templateId];
  if (!template) {
    return `Bạn là chuyên gia nội dung y khoa cho nhà thuốc Long Châu. Hãy viết nội dung chuyên nghiệp, chính xác, có dẫn nguồn.`;
  }

  let prompt = template.systemPrompt;

  // Inject site-specific additions if available
  const siteOverride = template.sitePromptOverrides?.[siteId];
  if (siteOverride) {
    prompt += '\n\n' + siteOverride;
  }

  return prompt;
}

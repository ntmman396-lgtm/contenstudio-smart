import { Template, Job, UploadedSource } from '@/types';

// ═══════════════════════════════════════════════════════════
// Templates derived from inforr.md — CONTENT CORE FRAMEWORK
// ═══════════════════════════════════════════════════════════

export const templates: Template[] = [
  // ── I. DISEASE (BỆNH LÝ) ─────────────────────────────────
  {
    id: 'benh-ly',
    name: 'Bệnh lý',
    slug: 'disease',
    description: 'UNDERSTAND → DETECT → EXPLAIN → RISK → CLINICAL → MANAGE → PREVENT → FAQ',
    color: '#EF4444',
    fields: [
      { key: 'moTaNgan', label: 'Mô tả ngắn (<300 ký tự)', type: 'text', required: true },
      { key: 'timHieuChung', label: 'Tìm hiểu chung', type: 'richtext', required: true },
      { key: 'trieuChung_dauHieu', label: 'Triệu chứng › Dấu hiệu', type: 'richtext', required: true },
      { key: 'trieuChung_tacDong', label: 'Triệu chứng › Tác động', type: 'richtext', required: true },
      { key: 'trieuChung_bienChung', label: 'Triệu chứng › Biến chứng', type: 'richtext', required: true },
      { key: 'trieuChung_khiCanGapBacSi', label: 'Triệu chứng › Khi cần gặp bác sĩ', type: 'richtext', required: true },
      { key: 'nguyenNhan', label: 'Nguyên nhân', type: 'richtext', required: true },
      { key: 'nguyCoDoiTuong', label: 'Nguy cơ › Đối tượng nguy cơ', type: 'richtext', required: true },
      { key: 'nguyCo_yeuTo', label: 'Nguy cơ › Yếu tố nguy cơ', type: 'richtext', required: true },
      { key: 'chanDoan', label: 'Chẩn đoán & Điều trị › Chẩn đoán', type: 'richtext', required: true },
      { key: 'dieuTri_noiKhoa', label: 'Chẩn đoán & Điều trị › Nội khoa', type: 'richtext', required: true },
      { key: 'dieuTri_ngoaiKhoa', label: 'Chẩn đoán & Điều trị › Ngoại khoa', type: 'richtext', required: false },
      { key: 'sinhHoat_thoiQuen', label: 'Sinh hoạt & Phòng ngừa › Thói quen', type: 'richtext', required: true },
      { key: 'sinhHoat_dinhDuong', label: 'Sinh hoạt & Phòng ngừa › Dinh dưỡng', type: 'richtext', required: true },
      { key: 'phongNgua_dacHieu', label: 'Phòng ngừa đặc hiệu', type: 'richtext', required: false },
      { key: 'phongNgua_khongDacHieu', label: 'Phòng ngừa không đặc hiệu', type: 'richtext', required: true },
      { key: 'faq', label: 'FAQ (5 câu)', type: 'faq', required: true },
      { key: 'nguonThamKhao', label: 'Nguồn tham khảo', type: 'list', required: true },
    ],
  },

  // ── II. HERBAL (DƯỢC LIỆU) ───────────────────────────────
  {
    id: 'duoc-lieu',
    name: 'Dược liệu',
    slug: 'herbal',
    description: 'MỞ BÀI → THÔNG TIN → GIÁ TRỊ Y HỌC → CÁCH DÙNG → AN TOÀN → THAM KHẢO',
    color: '#22C55E',
    fields: [
      { key: 'moTaNgan', label: 'Mô tả ngắn', type: 'text', required: true },
      { key: 'tenKhac', label: 'Tên khác', type: 'text', required: false },
      { key: 'moTa_tenGoiDanhPhap', label: 'Mô tả dược liệu › Tên gọi, danh pháp', type: 'richtext', required: true },
      { key: 'moTa_dacDiemTuNhien', label: 'Mô tả dược liệu › Đặc điểm tự nhiên', type: 'richtext', required: true },
      { key: 'moTa_phanBoThuHaiCheBien', label: 'Mô tả dược liệu › Phân bố, thu hái, chế biến', type: 'richtext', required: true },
      { key: 'moTa_boPhanSuDung', label: 'Mô tả dược liệu › Bộ phận sử dụng', type: 'text', required: true },
      { key: 'thanhPhanHoaHoc', label: 'Thành phần hóa học', type: 'richtext', required: true },
      { key: 'congDung_yHocCoTruyen', label: 'Công dụng › Theo y học cổ truyền', type: 'richtext', required: true },
      { key: 'congDung_yHocHienDai', label: 'Công dụng › Theo y học hiện đại', type: 'richtext', required: true },
      { key: 'lieuDungCachDung', label: 'Liều dùng & cách dùng', type: 'richtext', required: true },
      { key: 'baiThuocKinhNghiem', label: 'Bài thuốc kinh nghiệm', type: 'richtext', required: false },
      { key: 'luuYKhiSuDung', label: 'Lưu ý khi sử dụng', type: 'richtext', required: true },
      { key: 'nguonThamKhao', label: 'Nguồn tham khảo', type: 'list', required: true },
    ],
  },

  // ── III-A. VACCINE - LẺ (VẮC XIN LẺ) ────────────────────
  {
    id: 'vac-xin-le',
    name: 'Vắc xin lẻ',
    slug: 'vaccine-single',
    description: 'PRODUCT → DISEASE CONTEXT → USAGE PROTOCOL ⭐ → RESTRICTION → EXCEPTION → SPECIAL CASE → FAQ',
    color: '#3B82F6',
    fields: [
      { key: 'moTaNgan', label: 'Mô tả ngắn (vắc xin là gì, phòng bệnh gì, điểm nổi bật)', type: 'text', required: true },
      { key: 'thongTinBenh_benhLaGi', label: 'Thông tin bệnh liên quan › Bệnh là gì', type: 'richtext', required: true },
      { key: 'thongTinBenh_mucDoNguyHiem', label: 'Thông tin bệnh liên quan › Mức độ nguy hiểm', type: 'richtext', required: true },
      { key: 'thongTinBenh_duongLay', label: 'Thông tin bệnh liên quan › Đường lây', type: 'richtext', required: true },
      { key: 'phacDo_soMui', label: 'Phác đồ & Lịch tiêm › Số mũi', type: 'richtext', required: true },
      { key: 'phacDo_thoiGian', label: 'Phác đồ & Lịch tiêm › Thời gian', type: 'richtext', required: true },
      { key: 'phacDo_nhacLai', label: 'Phác đồ & Lịch tiêm › Nhắc lại', type: 'richtext', required: false },
      { key: 'chongChiDinh_tuyetDoi', label: 'Chống chỉ định › Tuyệt đối', type: 'richtext', required: true },
      { key: 'chongChiDinh_tuongDoi', label: 'Chống chỉ định › Tương đối', type: 'richtext', required: true },
      { key: 'chuyenDoiVacXin', label: 'Chuyển đổi vắc xin › Điều kiện thay thế', type: 'richtext', required: false },
      { key: 'luuY_phuNuMangThai', label: 'Lưu ý đặc biệt › Phụ nữ mang thai', type: 'richtext', required: true },
      { key: 'luuY_hoanTiem', label: 'Lưu ý đặc biệt › Hoãn tiêm', type: 'richtext', required: true },
      { key: 'luuY_tacDungPhu', label: 'Lưu ý đặc biệt › Tác dụng phụ', type: 'richtext', required: true },
      { key: 'faq', label: 'FAQ (3–5 câu)', type: 'faq', required: true },
    ],
  },

  // ── III-B. VACCINE - GÓI (VẮC XIN GÓI) ──────────────────
  {
    id: 'vac-xin-goi',
    name: 'Vắc xin gói',
    slug: 'vaccine-package',
    description: 'Gói vắc xin theo độ tuổi/đối tượng: danh sách vắc xin, lịch tiêm tổng hợp, so sánh gói.',
    color: '#8B5CF6',
    fields: [
      { key: 'moTaNgan', label: 'Mô tả ngắn', type: 'text', required: true },
      { key: 'danhSachVacXin', label: 'Danh sách vắc xin trong gói', type: 'list', required: true },
      { key: 'lichTiemTongHop', label: 'Lịch tiêm tổng hợp', type: 'richtext', required: true },
      { key: 'soSanhGoi', label: 'So sánh gói', type: 'richtext', required: false },
      { key: 'luuYChung', label: 'Lưu ý chung', type: 'richtext', required: true },
      { key: 'faq', label: 'FAQ', type: 'faq', required: true },
    ],
  },

  // ── IV. DRUG (THUỐC) ─────────────────────────────────────
  {
    id: 'thuoc',
    name: 'Thuốc',
    slug: 'drug',
    description: 'OVERVIEW → INDICATION → PHARMACOLOGY → USAGE → SAFETY → RESTRICTION → SPECIAL POP → INTERACTION → STORAGE → FAQ',
    color: '#F59E0B',
    fields: [
      { key: 'moTaNgan', label: 'Mô tả ngắn', type: 'text', required: true },
      { key: 'congDung_chiDinh', label: 'Công dụng › Chỉ định', type: 'richtext', required: true },
      { key: 'congDung_duocLucHoc', label: 'Công dụng › Dược lực học', type: 'richtext', required: true },
      { key: 'congDung_duocDongHoc', label: 'Công dụng › Dược động học', type: 'richtext', required: true },
      { key: 'lieuDung_cachDung', label: 'Liều dùng › Cách dùng', type: 'richtext', required: true },
      { key: 'lieuDung_lieu', label: 'Liều dùng › Liều dùng', type: 'richtext', required: true },
      { key: 'lieuDung_quaLieu', label: 'Liều dùng › Quá liều', type: 'richtext', required: true },
      { key: 'lieuDung_quenLieu', label: 'Liều dùng › Quên liều', type: 'richtext', required: true },
      { key: 'tacDungPhu', label: 'Tác dụng phụ', type: 'richtext', required: true },
      { key: 'luuY_chongChiDinh', label: 'Lưu ý › Chống chỉ định', type: 'richtext', required: true },
      { key: 'luuY_thanTrong', label: 'Lưu ý › Thận trọng', type: 'richtext', required: true },
      { key: 'luuY_laiXe', label: 'Lưu ý › Lái xe & máy móc', type: 'richtext', required: false },
      { key: 'luuY_thaiKy', label: 'Lưu ý › Thai kỳ', type: 'richtext', required: true },
      { key: 'luuY_choConBu', label: 'Lưu ý › Cho con bú', type: 'richtext', required: true },
      { key: 'luuY_tuongTac', label: 'Lưu ý › Tương tác', type: 'richtext', required: true },
      { key: 'baoQuan', label: 'Bảo quản', type: 'text', required: true },
      { key: 'faq', label: 'FAQ', type: 'faq', required: true },
    ],
  },

  // ── V. NON-DRUG (TPCN / CSCN / TTBYT) ────────────────────
  {
    id: 'non-thuoc',
    name: 'Non-thuốc / TPCN',
    slug: 'non-drug',
    description: 'IDENTIFY → DESCRIBE → BENEFIT → USAGE → RISK → PRECAUTION → STORAGE → DISCLAIMER → FAQ',
    color: '#EC4899',
    fields: [
      { key: 'moTaNgan', label: 'Mô tả ngắn', type: 'text', required: true },
      { key: 'moTaSanPham_gioiThieu', label: 'Mô tả sản phẩm › Giới thiệu', type: 'richtext', required: true },
      { key: 'moTaSanPham_usp', label: 'Mô tả sản phẩm › USP (điểm nổi bật)', type: 'richtext', required: true },
      { key: 'congDung', label: 'Công dụng (không claim quá mức)', type: 'richtext', required: true },
      { key: 'cachDung_lieuDung', label: 'Cách dùng › Liều dùng', type: 'richtext', required: true },
      { key: 'cachDung_cachSuDung', label: 'Cách dùng › Cách sử dụng', type: 'richtext', required: true },
      { key: 'tacDungPhu', label: 'Tác dụng phụ', type: 'richtext', required: false },
      { key: 'luuY_canhBao', label: 'Lưu ý › Cảnh báo', type: 'richtext', required: true },
      { key: 'luuY_doiTuongThanTrong', label: 'Lưu ý › Đối tượng thận trọng', type: 'richtext', required: true },
      { key: 'baoQuan', label: 'Bảo quản', type: 'text', required: true },
      { key: 'disclaimer', label: 'Disclaimer (không phải thuốc, không thay thế thuốc, không vượt liều)', type: 'text', required: true },
      { key: 'faq', label: 'FAQ', type: 'faq', required: true },
    ],
  },

  // ── VI. ACTIVE INGREDIENT (DƯỢC CHẤT) ─────────────────────
  {
    id: 'duoc-chat',
    name: 'Dược chất',
    slug: 'active-ingredient',
    description: 'TỔNG QUAN → DƯỢC LÝ → TƯƠNG TÁC & CCĐ → LIỀU DÙNG → TÁC DỤNG PHỤ → LƯU Ý → THAM KHẢO',
    color: '#14B8A6',
    fields: [
      { key: 'tongQuan', label: 'Tổng quan', type: 'richtext', required: true },
      { key: 'chiDinh', label: 'Chỉ định', type: 'richtext', required: true },
      { key: 'duocLy_duocLucHoc', label: 'Đặc tính dược lý › Dược lực học', type: 'richtext', required: true },
      { key: 'duocLy_duocDongHoc', label: 'Đặc tính dược lý › Dược động học', type: 'richtext', required: true },
      { key: 'duocLy_docTinh', label: 'Đặc tính dược lý › Độc tính', type: 'richtext', required: true },
      { key: 'tuongTacChongChiDinh', label: 'Tương tác & chống chỉ định', type: 'richtext', required: true },
      { key: 'lieuDungCachDung', label: 'Liều dùng & cách dùng', type: 'richtext', required: true },
      { key: 'tacDungPhu', label: 'Tác dụng phụ', type: 'richtext', required: true },
      { key: 'luuY_thanTrong', label: 'Lưu ý › Thận trọng', type: 'richtext', required: true },
      { key: 'luuY_doiTuongDacBiet', label: 'Lưu ý › Đối tượng đặc biệt', type: 'richtext', required: true },
      { key: 'quaLieuQuenLieu', label: 'Quá liều / Quên liều', type: 'richtext', required: true },
      { key: 'nguonThamKhao', label: 'Nguồn tham khảo', type: 'list', required: true },
    ],
  },

  // ── VII. HEALTH BLOG (GSK) ────────────────────────────────
  {
    id: 'gsk-blog',
    name: 'GSK Blog',
    slug: 'health-blog',
    description: 'INPUT → STRUCTURE → CONTENT (KEYWORD) → MEDIA → SEO → QUALITY → COMPLIANCE',
    color: '#06B6D4',
    fields: [
      { key: 'title', label: 'Tiêu đề (≤70 ký tự)', type: 'text', required: true },
      { key: 'sapo', label: 'Sapo (130–200 ký tự)', type: 'text', required: true },
      { key: 'noiDung', label: 'Nội dung bài viết', type: 'richtext', required: true },
      { key: 'keywordChinh', label: 'Keyword chính (7–8 lần)', type: 'text', required: true },
      { key: 'keywordLienQuan', label: 'Keyword liên quan (6–8 lần)', type: 'list', required: true },
      { key: 'mediaYeuCau', label: 'Ảnh (3–6 ảnh, ≥1024px, 16:9)', type: 'list', required: true },
      { key: 'internalLinks', label: 'Internal links (3–5)', type: 'list', required: true },
      { key: 'metaDescription', label: 'Meta description', type: 'text', required: true },
    ],
  },

  // ── VIII. Q&A DOCTOR CONTENT ──────────────────────────────
  {
    id: 'hoi-dap-bac-si',
    name: 'Q&A Bác sĩ',
    slug: 'qna-doctor',
    description: 'INTENT → TRUST → ANSWER → RETENTION → CONVERSION',
    color: '#A855F7',
    fields: [
      { key: 'thongTinChuyenGia', label: 'Thông tin chuyên gia', type: 'richtext', required: true },
      { key: 'cauHoi', label: 'Câu hỏi (giữ nguyên)', type: 'text', required: true },
      { key: 'tomTat', label: 'Tóm tắt (1–2 câu)', type: 'text', required: true },
      { key: 'giaiThichChiTiet', label: 'Giải thích chi tiết', type: 'richtext', required: true },
      { key: 'khiNaoCanDiKham', label: 'Khi nào cần đi khám', type: 'richtext', required: true },
      { key: 'chuanBiKhiDiKham', label: 'Chuẩn bị khi đi khám (optional)', type: 'richtext', required: false },
      { key: 'cauHoiLienQuan', label: 'Câu hỏi liên quan', type: 'list', required: true },
      { key: 'ctaNhe', label: 'CTA nhẹ', type: 'text', required: true },
    ],
  },
];

// ═══════════════════════════════════════════════════════════
// Mock Jobs
// ═══════════════════════════════════════════════════════════

export const mockJobs: Job[] = [];

// ═══════════════════════════════════════════════════════════
// Mock Sources
// ═══════════════════════════════════════════════════════════

export const mockSources: UploadedSource[] = [];

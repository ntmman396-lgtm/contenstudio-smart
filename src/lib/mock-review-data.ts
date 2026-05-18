import { GeneratedArticle } from '@/types';

/**
 * Mock review articles for the Review Queue.
 * These simulate AI-generated articles awaiting editor review.
 */
export const mockReviewArticles: GeneratedArticle[] = [
  {
    id: 'rev-001',
    title: 'Bệnh tiểu đường type 2: Nguyên nhân, triệu chứng và điều trị',
    slug: 'benh-tieu-duong-type-2-nguyen-nhan-trieu-chung-dieu-tri',
    sapo: 'Tiểu đường type 2 là bệnh rối loạn chuyển hóa mạn tính phổ biến nhất, ảnh hưởng đến hàng triệu người Việt Nam. Tìm hiểu nguyên nhân, dấu hiệu nhận biết và phương pháp điều trị hiệu quả.',
    content: `<h2>Tìm hiểu chung</h2>
<p>Tiểu đường type 2 (hay đái tháo đường type 2) là tình trạng cơ thể không sử dụng insulin hiệu quả, dẫn đến lượng đường trong máu tăng cao. Đây là dạng tiểu đường phổ biến nhất, chiếm khoảng 90-95% tổng số ca tiểu đường.</p>

<h2>Triệu chứng</h2>
<h3>Dấu hiệu nhận biết</h3>
<ul>
<li><strong>Khát nước nhiều</strong> - cảm giác khát liên tục dù đã uống đủ nước</li>
<li><strong>Đi tiểu thường xuyên</strong> - đặc biệt vào ban đêm</li>
<li><strong>Mệt mỏi</strong> - cảm giác kiệt sức kéo dài</li>
<li><strong>Nhìn mờ</strong> - thị lực giảm sút</li>
<li><strong>Vết thương lâu lành</strong></li>
</ul>

<h3>Biến chứng nguy hiểm</h3>
<p>Nếu không được kiểm soát tốt, tiểu đường type 2 có thể gây ra các biến chứng nghiêm trọng:</p>
<ul>
<li>Bệnh tim mạch và đột quỵ</li>
<li>Bệnh thận mạn (nephropathy)</li>
<li>Tổn thương thần kinh (neuropathy)</li>
<li>Bệnh võng mạc tiểu đường</li>
</ul>

<h2>Nguyên nhân</h2>
<p>Tiểu đường type 2 xảy ra khi tế bào cơ thể trở nên kháng insulin. Các yếu tố chính bao gồm:</p>
<ul>
<li>Thừa cân, béo phì (BMI ≥ 25)</li>
<li>Lối sống ít vận động</li>
<li>Yếu tố di truyền</li>
<li>Tuổi trên 45</li>
</ul>

<h2>Chẩn đoán & Điều trị</h2>
<h3>Chẩn đoán</h3>
<p>Chẩn đoán dựa trên các xét nghiệm máu:</p>
<ul>
<li>HbA1c ≥ 6.5%</li>
<li>Glucose huyết tương lúc đói ≥ 126 mg/dL</li>
<li>Nghiệm pháp dung nạp glucose ≥ 200 mg/dL</li>
</ul>

<h3>Điều trị nội khoa</h3>
<p>Phương pháp điều trị bao gồm thay đổi lối sống kết hợp dùng thuốc. Metformin là thuốc đầu tay được khuyến cáo.</p>

<h2>Sinh hoạt & Phòng ngừa</h2>
<p>Duy trì lối sống lành mạnh là chìa khóa quan trọng trong việc kiểm soát và phòng ngừa tiểu đường type 2.</p>

<h2>FAQ</h2>
<p><strong>Tiểu đường type 2 có chữa khỏi được không?</strong></p>
<p>Tiểu đường type 2 là bệnh mạn tính, chưa có phương pháp chữa khỏi hoàn toàn. Tuy nhiên, bệnh có thể được kiểm soát tốt thông qua thay đổi lối sống và dùng thuốc.</p>`,
    references: [
      'American Diabetes Association. Standards of Medical Care in Diabetes—2024.',
      'WHO Global Report on Diabetes, 2016.',
      'Bộ Y tế Việt Nam. Hướng dẫn chẩn đoán và điều trị đái tháo đường type 2, 2020.',
    ],
    seoMeta: {
      title: 'Bệnh tiểu đường type 2: Nguyên nhân, triệu chứng, điều trị',
      description: 'Tìm hiểu chi tiết về bệnh tiểu đường type 2: nguyên nhân, dấu hiệu nhận biết sớm, phương pháp chẩn đoán và điều trị hiệu quả nhất.',
    },
    category: 'Bệnh lý',
    tags: ['tiểu đường', 'đái tháo đường', 'type 2', 'insulin', 'đường huyết'],
    qcScore: 89, qcGrade: 'B',
    qcTechScore: { total: 85, format: 17, link: 25, image: 25, seo: 18 }, qcTechGrade: 'B',
    qcContentScore: { total: 92, accuracy: 38, depth: 28, citation: 18, tone: 8 }, qcContentGrade: 'A',
    templateId: 'benh-ly',
    templateName: 'Bệnh lý',
    status: 'pending_review',
    createdAt: '2026-03-31T00:45:00',
    rawFields: {},
  },
  {
    id: 'rev-002',
    title: 'Paracetamol 500mg: Công dụng, liều dùng và lưu ý',
    slug: 'paracetamol-500mg-cong-dung-lieu-dung-luu-y',
    sapo: 'Paracetamol (Acetaminophen) 500mg là thuốc giảm đau, hạ sốt phổ biến nhất. Tìm hiểu cách dùng đúng, liều dùng an toàn và các lưu ý quan trọng.',
    content: `<h2>Công dụng</h2>
<h3>Chỉ định</h3>
<p>Paracetamol 500mg được chỉ định trong các trường hợp:</p>
<ul>
<li>Giảm đau nhẹ đến vừa: đau đầu, đau răng, đau cơ, đau khớp</li>
<li>Hạ sốt do nhiều nguyên nhân</li>
<li>Giảm đau trong cảm cúm, cảm lạnh</li>
</ul>

<h2>Liều dùng</h2>
<h3>Người lớn và trẻ em trên 12 tuổi</h3>
<p>500mg – 1000mg mỗi 4-6 giờ. Không quá 4g/ngày (8 viên 500mg).</p>

<h3>Quá liều</h3>
<p>Quá liều paracetamol có thể gây tổn thương gan nghiêm trọng. Liều độc: >150mg/kg ở người lớn. Cần cấp cứu ngay nếu nghi ngờ quá liều.</p>

<h2>Tác dụng phụ</h2>
<p>Paracetamol thường được dung nạp tốt ở liều điều trị. Tác dụng phụ hiếm gặp bao gồm phản ứng dị ứng da, giảm tiểu cầu.</p>

<h2>Lưu ý</h2>
<h3>Chống chỉ định</h3>
<ul><li>Quá mẫn với paracetamol</li><li>Suy gan nặng</li></ul>

<h3>Tương tác thuốc</h3>
<p>Warfarin: tăng tác dụng chống đông. Rượu: tăng nguy cơ độc gan.</p>

<h2>Bảo quản</h2>
<p>Bảo quản nơi khô ráo, thoáng mát, dưới 30°C. Tránh ánh sáng trực tiếp.</p>`,
    references: [
      'MIMS Vietnam - Paracetamol monograph',
      'Dược thư Quốc gia Việt Nam',
    ],
    seoMeta: {
      title: 'Paracetamol 500mg: Công dụng, liều dùng, lưu ý quan trọng',
      description: 'Hướng dẫn sử dụng Paracetamol 500mg: chỉ định, liều dùng cho người lớn và trẻ em, tác dụng phụ và các lưu ý an toàn.',
    },
    category: 'Thuốc',
    tags: ['paracetamol', 'giảm đau', 'hạ sốt', 'acetaminophen'],
    qcScore: 91, qcGrade: 'A',
    qcTechScore: { total: 88, format: 18, link: 28, image: 26, seo: 16 }, qcTechGrade: 'B',
    qcContentScore: { total: 93, accuracy: 39, depth: 28, citation: 18, tone: 8 }, qcContentGrade: 'A',
    templateId: 'thuoc',
    templateName: 'Thuốc',
    status: 'pending_review',
    createdAt: '2026-03-31T00:50:00',
    rawFields: {},
  },
  {
    id: 'rev-003',
    title: 'Vắc xin Hexaxim: Phòng 6 bệnh cho trẻ em',
    slug: 'vac-xin-hexaxim-phong-6-benh-cho-tre-em',
    sapo: 'Hexaxim là vắc xin 6 trong 1 phòng bạch hầu, ho gà, uốn ván, bại liệt, Hib và viêm gan B, được tiêm cho trẻ từ 6 tuần tuổi.',
    content: `<h2>Thông tin bệnh liên quan</h2>
<p>Hexaxim phòng ngừa 6 bệnh nguy hiểm ở trẻ nhỏ: bạch hầu, ho gà, uốn ván, bại liệt, viêm phổi/viêm màng não do Hib, và viêm gan B.</p>

<h2>Phác đồ & Lịch tiêm</h2>
<p>Tiêm cơ bản 3 mũi: mũi 1 lúc 2 tháng, mũi 2 lúc 3 tháng, mũi 3 lúc 4 tháng. Nhắc lại 1 mũi lúc 16-18 tháng.</p>

<h2>Chống chỉ định</h2>
<p>Không tiêm khi: sốt cao, tiền sử phản ứng nặng với liều trước, bệnh não tiến triển.</p>

<h2>Lưu ý đặc biệt</h2>
<p>Sau tiêm trẻ có thể sốt nhẹ, quấy khóc. Theo dõi tại điểm tiêm 30 phút.</p>`,
    references: ['Sanofi Pasteur - Hexaxim Product Information'],
    seoMeta: {
      title: 'Vắc xin Hexaxim: Lịch tiêm, tác dụng phụ cho trẻ em',
      description: 'Thông tin vắc xin Hexaxim 6 trong 1: lịch tiêm chủng, chống chỉ định, phản ứng sau tiêm cho trẻ.',
    },
    category: 'Vắc xin',
    tags: ['hexaxim', 'vắc xin', '6 trong 1', 'trẻ em', 'tiêm chủng'],
    qcScore: 72, qcGrade: 'C',
    qcTechScore: { total: 70, format: 14, link: 22, image: 20, seo: 14 }, qcTechGrade: 'C',
    qcContentScore: { total: 73, accuracy: 30, depth: 22, citation: 14, tone: 7 }, qcContentGrade: 'C',
    templateId: 'vac-xin-le',
    templateName: 'Vắc xin lẻ',
    status: 'pending_review',
    createdAt: '2026-03-31T00:52:00',
    rawFields: {},
  },
  {
    id: 'rev-004',
    title: 'Glucosamine 1500mg: Hỗ trợ xương khớp hiệu quả',
    slug: 'glucosamine-1500mg-ho-tro-xuong-khop',
    sapo: 'Glucosamine 1500mg là thực phẩm chức năng hỗ trợ sức khỏe xương khớp, giúp tái tạo sụn khớp và giảm đau khớp. Sản phẩm không phải là thuốc.',
    content: `<h2>Mô tả sản phẩm</h2>
<p>Glucosamine 1500mg chứa glucosamine sulfate — thành phần quan trọng trong cấu tạo sụn khớp, giúp duy trì và tái tạo mô sụn.</p>

<h2>Công dụng</h2>
<ul>
<li>Hỗ trợ tái tạo sụn khớp</li>
<li>Hỗ trợ giảm đau, giảm cứng khớp</li>
<li>Hỗ trợ bôi trơn khớp, tăng linh hoạt</li>
</ul>

<h2>Cách dùng</h2>
<p>Uống 1 viên/ngày sau bữa ăn. Sử dụng liên tục tối thiểu 3 tháng để có hiệu quả.</p>

<h2>Lưu ý</h2>
<p>Thận trọng với người dị ứng hải sản (nguồn gốc glucosamine từ vỏ tôm cua). Không dùng cho phụ nữ mang thai, cho con bú.</p>

<h2>Disclaimer</h2>
<p><em>Sản phẩm này không phải là thuốc, không có tác dụng thay thế thuốc chữa bệnh. Không vượt liều khuyến cáo.</em></p>`,
    references: [],
    seoMeta: {
      title: 'Glucosamine 1500mg - Hỗ trợ xương khớp',
      description: 'Glucosamine 1500mg hỗ trợ tái tạo sụn khớp, giảm đau khớp hiệu quả. Hướng dẫn cách dùng và lưu ý.',
    },
    category: 'TPCN',
    tags: ['glucosamine', 'xương khớp', 'sụn khớp', 'thực phẩm chức năng'],
    qcScore: 74, qcGrade: 'C',
    qcTechScore: { total: 78, format: 16, link: 24, image: 22, seo: 16 }, qcTechGrade: 'C',
    qcContentScore: { total: 71, accuracy: 28, depth: 22, citation: 14, tone: 7 }, qcContentGrade: 'C',
    templateId: 'non-thuoc',
    templateName: 'Non-thuốc / TPCN',
    status: 'pending_review',
    createdAt: '2026-03-31T00:30:00',
    rawFields: {},
  },
];

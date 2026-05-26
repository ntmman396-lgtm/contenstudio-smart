import { GoogleGenAI } from '@google/genai';
import { GeneratorSettings, GeneratedArticle } from '@/types';
import { getTemplate, getSystemPromptForSite } from '@/lib/templates';
import { retrieveForArticle } from '@/lib/kb/retrieval';
import { extractCitations } from '@/lib/kb/citations';
import { runQC } from '@/lib/qc/engine';
// ─── Gemini Client ──────────────────────────────────────────

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  return new GoogleGenAI({ apiKey });
}

// ─── Slug Generator ─────────────────────────────────────────

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

// ─── Legacy Quality Scoring (REMOVED) ───────────────────────
// Replaced by QC 2-layer engine in @/lib/qc/engine.ts


// ─── Build User Prompt ──────────────────────────────────────

function buildSingleUserPrompt(
  item: Pick<import('@/types').BatchPlanItem, 'title' | 'outline' | 'keyword' | 'referenceLink' | 'category' | 'tags'>, 
  settings: GeneratorSettings, 
  templateName: string,
  retrievalResult?: any
): string {
  const toneMap: Record<string, string> = {
    professional: 'chuyên nghiệp y khoa, dễ hiểu cho người đọc phổ thông',
    friendly: 'thân thiện, gần gũi, dễ hiểu',
    academic: 'học thuật, chuyên sâu, có dẫn chứng',
    conversational: 'hội thoại tự nhiên, như bác sĩ tư vấn trực tiếp',
  };

  const langMap: Record<string, string> = {
    vi: 'Tiếng Việt',
    en: 'English',
    'vi-en': 'Song ngữ Việt-Anh',
  };

  const isQA = settings.templateId === 'hoi-dap-bac-si' || settings.templateId === 'hoi-dap';
  const keywordText = item.keyword ? `Từ khóa/Chủ đề trọng tâm: "${item.keyword}"\n` : '';
  const outlineText = item.outline 
    ? `⚠️ DÀN Ý BẮT BUỘC (DO BIÊN TẬP VIÊN CUNG CẤP — PHẢI TUÂN THỦ 100%):\n${item.outline}\n\n🚨🚨🚨 QUY TẮC TUYỆT ĐỐI VỀ HEADING:\n1. Mỗi dòng "H2: ..." trong dàn ý trên tương ứng với MỘT thẻ <h2> trong bài HTML. Mỗi dòng "H3: ..." tương ứng MỘT thẻ <h3>.\n2. NỘI DUNG TEXT của heading PHẢI COPY NGUYÊN VĂN, TỪNG CHỮ MỘT từ dàn ý. TUYỆT ĐỐI KHÔNG được viết lại (paraphrase), KHÔNG thêm từ, KHÔNG bớt từ, KHÔNG đổi thứ tự từ.\n   Ví dụ: Dàn ý ghi "H2: ABC" → bài viết PHẢI là <h2>ABC</h2>. SAI: <h2>ABD nào đó</h2>.\n3. Số lượng H2/H3 trong bài PHẢI BẰNG ĐÚNG số lượng trong dàn ý. KHÔNG thêm heading mới, KHÔNG bỏ heading nào.\n4. Nếu có xung đột giữa dàn ý này và outline mặc định trong system prompt, LUÔN ƯU TIÊN DÀN Ý NÀY.`
    : (isQA 
        ? `Dàn ý: (Chưa có — người dùng không cung cấp) Đối với bài viết Hỏi đáp, TUYỆT ĐỐI KHÔNG sử dụng cấu trúc heading H2/H3. Bắt buộc viết câu hỏi và câu trả lời theo đúng cấu trúc HTML Hỏi đáp chi tiết ở dưới.`
        : `Dàn ý: (Chưa có — người dùng không cung cấp) BẠN HÃY TỰ ĐỘNG PHÂN TÍCH TỪ KHÓA/CHỦ ĐỀ VÀ NỀN TẢNG NGUỒN ĐỂ TỰ LÊN DÀN Ý CHUẨN SEO (GỒM H2, H3 LOGIC) RỒI MỚI VIẾT BÀI CHI TIẾT.`
      );

  // Category from user selection or settings
  const categoryValue = item.category || settings.category || templateName;
  const categoryInstruction = `Danh mục bài viết (category): "${categoryValue}" — BẮT BUỘC dùng giá trị này cho trường "category" trong JSON output.\n`;

  // Tags from user input
  const userTags = item.tags || settings.tags;
  const tagsInstruction = userTags && userTags.length > 0
    ? `Tags BẮT BUỘC: ${JSON.stringify(userTags)} — SỬ DỤNG CHÍNH XÁC danh sách tags này cho trường "tags" trong JSON output. KHÔNG tự thêm hoặc thay đổi.\n`
    : '';

  // Internal links
  const internalLinks = settings.internalLinks;
  const internalLinksInstruction = internalLinks && internalLinks.length > 0
    ? `\nINTERNAL LINKS BẮT BUỘC:\nKhi viết bài, hãy TỰ NHIÊN chèn các internal link sau vào nội dung HTML. Mỗi anchor text xuất hiện lần đầu tiên trong bài phải được bọc trong thẻ <a>. Chỉ link 1 lần cho mỗi anchor.\n- TUYỆT ĐỐI KHÔNG chèn link vào các block Heading (H2, H3). Chỉ được phép chèn vào các thẻ p, li.\n${internalLinks.map(l => `- Anchor: "${l.anchor}" → URL: ${l.url}`).join('\n')}\n`
    : '';

  return `Viết MỘT bài viết hoàn chỉnh theo template "${templateName}" với chủ đề: ${item.title}.

===== TÀI LIỆU NGUỒN =====
${settings.sourceText}
===== HẾT TÀI LIỆU =====

${retrievalResult ? `--- NGUỒN THAM KHẢO TỪ KNOWLEDGE BASE ---
${retrievalResult.context}

--- HƯỚNG DẪN SỬ DỤNG NGUỒN ---
${retrievalResult.source_instruction}
` : ''}

Tiêu đề bài viết: "${item.title}"
${keywordText}${categoryInstruction}${tagsInstruction}${outlineText}

Giọng văn: ${toneMap[settings.tone] || settings.tone}
Ngôn ngữ: ${langMap[settings.language] || settings.language}
Độ dài: ${settings.minWords}–${settings.maxWords} từ
${settings.customInstructions ? `Hướng dẫn bổ sung: ${settings.customInstructions}` : ''}
${internalLinksInstruction}
QUY TẮC OUTPUT:
1. Output PHẢI là 1 JSON object duy nhất — KHÔNG kèm giải thích, KHÔNG có commentary.
2. Trường "content" PHẢI chứa toàn bộ nội dung HTML bài viết hoàn chỉnh (dùng <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>). NỘI DUNG PHẢI ĐẦY ĐỦ, CHI TIẾT, KHÔNG TÓM TẮT.
3. ${isQA ? 'Đối với bài viết Hỏi đáp, TUYỆT ĐỐI KHÔNG sử dụng thẻ tiêu đề <h2> hoặc <h3>. Chỉ dùng các thẻ đoạn văn HTML <p> và bọc <strong> theo quy định cấu trúc Hỏi đáp ở dưới.' : 'Nội dung PHẢI bám sát y hệt dàn ý (outline) gốc mà người dùng nhập. Sử dụng thẻ <h2> và <h3> khớp y hệt outline. KHÔNG ĐƯỢC tự ý gom nhóm hoặc tự ý đổi ý nghĩa các heading mà người dùng truyền vào. Quan trọng: Đừng để bài viết bị máy móc. Giữa các phần phải phân tích sâu, có sự kết nối và năng lượng tích cực.'}
4. KHÔNG đặt nội dung suy luận ngoại cảnh, giải thích quy trình hệ thống hay ghi chú bên ngoài JSON. KHÔNG nói chuyện với tư cách là một AI.
5. KHÔNG bịa thông tin không có trong tài liệu nguồn.
6. KHÔNG bọc JSON trong code block.
7. ĐỘ DÀI ĐOẠN VĂN: Để tối ưu trải nghiệm đọc, MỖI ĐOẠN VĂN (<p>) TUYỆT ĐỐI CHỈ ĐƯỢC CHỨA TỐI ĐA 2-3 CÂU (tương đương 3-4 dòng). Bắt buộc phải ngắt đoạn thường xuyên, không viết đoạn văn dài lê thê.
8. ĐỘ DÀI ĐOẠN MỞ ĐẦU (TRƯỚC H2 ĐẦU TIÊN): Phần mở đầu dẫn dắt vào bài viết (nằm ở đầu tiên trong trường "content", trước thẻ <h2> đầu tiên) BẮT BUỘC chỉ được chứa tối đa 1 đoạn văn (chỉ duy nhất 1 thẻ <p>), độ dài cực kỳ ngắn gọn từ 2-3 câu (tổng số ≤100 từ). Tuyệt đối KHÔNG viết lan man hay tạo nhiều đoạn văn trước khi vào heading H2 đầu tiên.
9. QUY CHUẨN TRÌNH BÀY NGUỒN THAM KHẢO (BẮT BUỘC TUÂN THỦ TRONG MẢNG REFERENCES):
   - Tuyệt đối KHÔNG sử dụng những link bị 404 hay link ảo không thể truy cập được.
   - Đối với Nguồn dạng sách/giáo trình: "Tác giả (năm). Tên tài liệu. Nơi xuất bản: Nhà xuất bản." (VD: Bộ Y tế (2020). Hướng dẫn chẩn đoán và điều trị... Hà Nội: NXB Y học)
   - Đối với Nguồn dạng website: "Tên nguồn - Tiêu đề: URL (truy cập ngày [NGÀY_HIỆN_TẠI])" (VD: WHO. Tăng huyết áp. https://... (truy cập ngày ${new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}))
     + LƯU Ý QUAN TRỌNG 1: URL bắt buộc phải là link trực tiếp trỏ đến trang chi tiết của bài viết/nguồn đó (deep link), TUYỆT ĐỐI KHÔNG chỉ dẫn link về trang chủ (homepage) chung chung.
     + LƯU Ý QUAN TRỌNG 2: Cho phần Ngoặc đơn chứa ngày truy cập, BẮT BUỘC toàn bộ các nguồn website phải ghi chính xác là: "(truy cập ngày ${String(new Date().getDate()).padStart(2, '0')}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()})" - TUYỆT ĐỐI KHÔNG tự bịa ngày tháng trong quá khứ!
10. CẤM HOÀN TOÀN IN ĐẬM TRONG NỘI DUNG:
   - TUYỆT ĐỐI KHÔNG sử dụng thẻ <strong>, <b>, hoặc bất kỳ cách in đậm nào bên trong nội dung đoạn văn <p>.
   - KHÔNG có ngoại lệ nào: không bold tên bệnh, không bold tên hoạt chất, không bold tên khoa học, không bold lời khuyên, không bold bất kỳ thứ gì bên trong đoạn văn.
   - Nếu cần nhấn mạnh thông tin quan trọng, hãy dùng danh sách gạch đầu dòng (<ul><li>) hoặc viết thành heading (<h3>) — KHÔNG BAO GIỜ dùng bold.
   - Toàn bộ text bên trong thẻ <p> phải là văn bản thuần (plain text), chỉ được phép dùng <em> (in nghiêng) và <a> (hyperlink) bên trong <p>.
11. QUY TẮC LIÊN KẾT NỘI BỘ (INTERNAL LINK) GIỮA CÁC SITE:
    - Bài viết này đang được tạo cho site: ${settings.siteId === 'nha-thuoc' ? 'NHÀ THUỐC' : 'TIÊM CHỦNG'}.
    - TUYỆT ĐỐI KHÔNG chèn link chéo giữa hai hệ thống. Nghĩa là: Bài viết của Nhà Thuốc CẤM dẫn link sang Tiêm Chủng, và bài viết của Tiêm Chủng CẤM dẫn link sang Nhà Thuốc.
${settings.templateId === 'hoi-dap-bac-si' || settings.templateId === 'hoi-dap' ? `
12. ĐỊNH DẠNG HỎI ĐÁP SỨC KHỎE (BẮT BUỘC):
   - KHÔNG sử dụng thẻ heading <h2> cho phần Câu hỏi và Giải đáp. THAY VÀO ĐÓ, bắt buộc dùng cấu trúc sau:
   <p><strong>Câu hỏi:</strong></p>
   <blockquote>
     <p>[Nội dung chi tiết câu hỏi thực tế của bệnh nhân...]</p>
   </blockquote>
   <p><strong>Giải đáp:</strong></p>
   <p>[Nội dung bác sĩ trả lời, tư vấn...]</p>
   - Lưu ý: Đây là ngoại lệ DUY NHẤT được dùng <strong> trong toàn bộ bài viết.
   - TUYỆT ĐỐI KHÔNG chèn internal link (<a>) bên trong thẻ <blockquote> (phần câu hỏi).
   - KHÔNG tạo mục FAQ cho bài Hỏi đáp. Trường "faq" trong JSON output phải là mảng rỗng [].` : ''}

JSON schema bắt buộc:
{
  "title": "string ≤70 ký tự",
  "slug": "string",
  "sapo": "string <300 ký tự, mô tả ngắn gọn về chủ đề",
  "content": "string — TOÀN BỘ HTML nội dung bài viết, đầy đủ chi tiết >=${settings.minWords} từ",
  "references": ["danh sách nguồn tham khảo ứng dụng ĐÚNG quy chuẩn số 9"],
  "seoMeta": { "title": "≤60 ký tự", "description": "≤160 ký tự" },
  "category": "${categoryValue}",
  "tags": ${userTags && userTags.length > 0 ? JSON.stringify(userTags) : '["tag1", "tag2"]'},
  "faq": ${settings.templateId === 'hoi-dap-bac-si' || settings.templateId === 'hoi-dap' ? '[]' : '[{"question": "Câu hỏi ngắn gọn", "answer": "Câu trả lời trực tiếp (Luôn tạo 5 câu FAQ nếu bài thuộc chuyên mục Bệnh Lý. Đây là bắt buộc, không phụ thuộc vào dàn ý.)"}]'}
}

HƯỚNG DẪN CHÈN CHÚ THÍCH ẢNH (CAPTION) BẮT BUỘC:
Hệ thống KHÔNG chèn ảnh thực, chỉ chèn khung chú thích ảnh (caption placeholder) để biên tập viên tự thêm ảnh sau.
- CHÚ THÍCH ẢNH (Caption): Phải ngắn gọn, focus vào nội dung đoạn và truyền tải thông điệp ý nghĩa. KHÔNG miêu tả hành động trong ảnh một cách trần trụi và dài dòng. TUYỆT ĐỐI KHÔNG ghi kiểu "Bác sĩ khám bệnh cho bệnh nhân ở bệnh viện", mà phải ghi thông điệp ý nghĩa như "Cần đi khám sớm khi phát hiện các dấu hiệu bất thường".
NẾU CẦN CHÚ THÍCH ẢNH, hãy dùng cú pháp placeholder chính xác 100% như sau: 
[Ảnh minh hoạ | <Từ khoá ngắn gọn (1-3 từ)> | <Chú thích ảnh ngắn gọn mang thông điệp thay vì tả thực>]
Ví dụ: [Ảnh minh hoạ | tư vấn bác sĩ | Cần đi khám sớm khi phát hiện các dấu hiệu bất thường]`;
}

// ─── Parse Gemini Response ──────────────────────────────────

function parseGeminiResponseSingle(responseText: string, fallbackTitle: string): Record<string, unknown> {
  // Strategy 1: Extract from ```json ... ``` code block
  const codeBlockMatch = responseText.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  const jsonStr = codeBlockMatch ? codeBlockMatch[1].trim() : responseText.trim();

  // Strategy 2: Try to parse the extracted string directly
  try {
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed[0] : parsed;
  } catch {}

  // Strategy 3: Find first JSON object with regex
  const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    try {
      const parsed = JSON.parse(objectMatch[0]);
      return Array.isArray(parsed) ? parsed[0] : parsed;
    } catch {}
  }

  // Strategy 4: Try parsing the full raw response (sometimes no code block)
  try {
    const fullMatch = responseText.match(/\{[\s\S]*\}/);
    if (fullMatch) {
      const parsed = JSON.parse(fullMatch[0]);
      return Array.isArray(parsed) ? parsed[0] : parsed;
    }
  } catch {}

  // Strategy 5: Graceful fallback — treat entire response as HTML content
  // This ensures generation never fails silently; the content is the raw text
  console.warn('[generator] Could not parse Gemini JSON, falling back to raw text extraction');
  const htmlContent = responseText
    .replace(/```json[\s\S]*?```/g, '') // strip code blocks
    .replace(/```[\s\S]*?```/g, '')
    .trim();

  return {
    title: fallbackTitle,
    content: htmlContent || '<p>Nội dung đang được xử lý...</p>',
    sapo: '',
    references: [],
    seoMeta: { title: fallbackTitle.slice(0, 60), description: '' },
    category: '',
    tags: [],
  };
}

// ─── Main Generate Function ─────────────────────────────────

export interface GenerateProgress {
  current: number;
  total: number;
  status: string;
  article?: GeneratedArticle;
}

export type ProgressCallback = (progress: GenerateProgress) => void;

export async function generateSingleArticle(
  batchItem: import('@/types').BatchPlanItem,
  settings: GeneratorSettings,
  onProgress?: ProgressCallback
): Promise<GeneratedArticle> {
  const client = getClient();
  const siteId = settings.siteId || 'nha-thuoc';
  
  let templateName = 'Custom';
  let systemPrompt = '';

  const staticTemplate = getTemplate(settings.templateId);
  if (staticTemplate) {
    templateName = staticTemplate.name;
    systemPrompt = getSystemPromptForSite(settings.templateId, siteId as any);
  } else {
    const { prisma } = await import('@/lib/prisma');
    const dbTemplate = await prisma.template.findUnique({ where: { id: settings.templateId } });
    if (!dbTemplate) {
      throw new Error(`Template not found: ${settings.templateId}`);
    }
    templateName = dbTemplate.name;
    systemPrompt = dbTemplate.systemPrompt || '';
  }

  // Trigger RAG KB Retrieval
  onProgress?.({
    current: 0,
    total: 1,
    status: `Đang tra cứu từ Knowledge Base...`,
  });
  
  let retrievalResult;
  try {
     const articleTopic = batchItem.title || settings.sourceText.substring(0, 50);
     // Note: using 'null' for articleId since article is not generated yet
     retrievalResult = await retrieveForArticle(null, articleTopic, settings.templateId, 8);
  } catch (e) {
     console.error("KB Retrieval Failed, continuing without KB:", e);
  }

  const userPrompt = buildSingleUserPrompt(batchItem, settings, templateName, retrievalResult);

  onProgress?.({
    current: 0,
    total: 1,
    status: `Đang tạo bài viết: ${batchItem.title}`,
  });

  const response = await client.models.generateContent({
    model: process.env.GEMINI_GENERATOR_MODEL || 'gemini-2.5-pro',
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.7,
      maxOutputTokens: 65536,
      responseMimeType: 'application/json',
    }
  });

  const responseText = response.text || '';

  onProgress?.({
    current: 0,
    total: 1,
    status: 'Đang phân tích kết quả...',
  });

  const raw = parseGeminiResponseSingle(responseText, batchItem.title);

  const title = (raw.title as string) || batchItem.title;
  let content = (raw.content as string) || '';
  let sapo = (raw.sapo as string) || '';

  if (settings.templateId === 'hoi-dap-bac-si' || settings.templateId === 'hoi-dap') {
    // 1. Clean up sapo: remove any HTML tags and markdown bold formatting to keep it strictly plain text
    sapo = sapo.replace(/<\/?[^>]+(>|$)/g, '').replace(/\*\*/g, '').trim();

    // 2. Convert raw **...** inside <p> paragraphs to <strong>...</strong>
    content = content.replace(/<p>\s*\*\*(.*?)\*\*\s*<\/p>/gi, '<p><strong>$1</strong></p>');
    content = content.replace(/(?<!<p>)\s*\*\*(Câu hỏi|Câu hỏi của người bệnh|Giải đáp|Bác sĩ giải đáp|Bác sĩ trả lời|Disclaimer|Tuyên bố miễn trừ|Tuyên bố miễn trừ trách nhiệm)(?::)?\*\*\s*(?!<\/p>)/gi, '<p><strong>$1:</strong></p>');

    // 3. Convert markdown headings (like ## Câu hỏi, ### Bác sĩ giải đáp, etc.) and HTML headings (like <h2>...</h2>) to the correct structure
    content = content.replace(/^\s*#{2,4}\s*(Câu hỏi|Câu hỏi của người bệnh)(?::)?\s*$/gim, '<p><strong>Câu hỏi:</strong></p>');
    content = content.replace(/^\s*#{2,4}\s*(Giải đáp|Bác sĩ giải đáp|Bác sĩ trả lời)(?::)?\s*$/gim, '<p><strong>Giải đáp:</strong></p>');
    content = content.replace(/^\s*#{2,4}\s*(Disclaimer|Tuyên bố miễn trừ|Tuyên bố miễn trừ trách nhiệm)(?::)?\s*$/gim, '<p><strong>Disclaimer:</strong></p>');
    content = content.replace(/^\s*#{2,4}\s*([^#\n\r]+)$/gm, '<p><strong>$1</strong></p>');

    content = content.replace(/<h[2-4][^>]*>\s*(Câu hỏi|Câu hỏi của người bệnh)(?::)?\s*<\/h[2-4]>/gi, '<p><strong>Câu hỏi:</strong></p>');
    content = content.replace(/<h[2-4][^>]*>\s*(Giải đáp|Bác sĩ giải đáp|Bác sĩ trả lời)(?::)?\s*<\/h[2-4]>/gi, '<p><strong>Giải đáp:</strong></p>');
    content = content.replace(/<h[2-4][^>]*>\s*(Disclaimer|Tuyên bố miễn trừ|Tuyên bố miễn trừ trách nhiệm)(?::)?\s*<\/h[2-4]>/gi, '<p><strong>Disclaimer:</strong></p>');
    content = content.replace(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/gi, '<p><strong>$1</strong></p>');

    // Normalize formatting of the key headers
    content = content.replace(/<p><strong>(Câu hỏi của người bệnh|Hỏi|Câu hỏi)<\/strong><\/p>/gi, '<p><strong>Câu hỏi:</strong></p>');
    content = content.replace(/<p><strong>(Bác sĩ giải đáp|Bác sĩ trả lời|Giải đáp)<\/strong><\/p>/gi, '<p><strong>Giải đáp:</strong></p>');
    content = content.replace(/<p><strong>(Tuyên bố miễn trừ trách nhiệm|Tuyên bố miễn trừ|Disclaimer)<\/strong><\/p>/gi, '<p><strong>Disclaimer:</strong></p>');

    // 4. Force empty brackets [ ] for doctor name and years of experience to prevent any AI hallucinations
    content = content.replace(
      /(Câu hỏi được BS|Câu hỏi được Bác sĩ)[\s.]*([^–—\n-]*?)\s*[-–—]\s*Chuyên khoa\s*([^–—\n-]+?)\s*[-–—]\s*([^–—\n-]*?)\s*năm kinh nghiệm trong lĩnh vực\s*([^–—\n-]+?)\s*giải đáp\.?/gi,
      (m, g1, g2, g3, g4, g5) => `Câu hỏi được BS. [ ] - Chuyên khoa ${g3.trim()} - [ ] năm kinh nghiệm trong lĩnh vực ${g5.trim()} giải đáp.`
    );

    // 5. Ensure there is asker info in blockquote (if missing, append (Khách hàng ẩn danh))
    content = content.replace(/<blockquote>([\s\S]*?)<\/blockquote>/gi, (match, innerHtml) => {
      const trimmed = innerHtml.trim();
      // If it doesn't contain a parenthesis at the end (like (Khách hàng ẩn danh) or (Chị...)), append it
      if (!/\)\s*<\/p>\s*$/i.test(trimmed)) {
        return `<blockquote>\n  ${trimmed}\n  <p>(Khách hàng ẩn danh)</p>\n</blockquote>`;
      }
      return match;
    });
  }

  // Auto replace [Ảnh minh họa...] with caption placeholders
  content = await autoFillImages(content);

  const article: GeneratedArticle = {
    id: `gen-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title,
    slug: generateSlug(title),
    sapo,
    content,
    references: (raw.references as string[]) || [],
    seoMeta: {
      title: (raw.seoMeta as Record<string, string>)?.title || title.slice(0, 60),
      description: (raw.seoMeta as Record<string, string>)?.description || '',
    },
    // Use user-provided category/tags if available, otherwise fall back to AI output
    category: settings.category || batchItem.category || (raw.category as string) || templateName,
    tags: (batchItem.tags && batchItem.tags.length > 0) 
      ? batchItem.tags 
      : (settings.tags && settings.tags.length > 0) 
        ? settings.tags 
        : (raw.tags as string[]) || [],

    templateId: settings.templateId,
    templateName: templateName,
    siteId: siteId,
    status: 'pending_review',
    createdAt: new Date().toISOString(),
    rawFields: {
      ...(raw.faq ? { faq: typeof raw.faq === 'string' ? raw.faq : JSON.stringify(raw.faq) } : {}),
      ...(batchItem.keyword ? { keywordChinh: batchItem.keyword } : {}),
    },
  };

  // Auto-inject internal links into content
  if (settings.internalLinks && settings.internalLinks.length > 0) {
    article.content = autoInjectInternalLinks(article.content, settings.internalLinks);
  }



  // Audit Citations
  if (retrievalResult) {
     onProgress?.({
        current: 0,
        total: 1,
        status: `Đang kiểm duyệt trích dẫn (Citations)...`,
     });
     try {
         const citationReport = await extractCitations(article.id, article.content, retrievalResult.chunks_used || []);
         article.citationReport = citationReport;
         // Override status if unverified sources exist
         if (citationReport.unverified > 0) {
            article.status = 'pending_review';
         }
     } catch (e) {
         console.error("Citation Extraction Failed:", e);
     }
  }

  // ─── STAGE 4.5 — Citation URL Verification ──────────────
  if (article.references && article.references.length > 0) {
    onProgress?.({
      current: 0,
      total: 1,
      status: `Đang xác minh ${article.references.length} nguồn tham khảo...`,
    });
    try {
      const { verifyCitations } = await import('@/lib/citation-verifier');
      const verificationResults = await verifyCitations(article.references);
      article.citationVerification = verificationResults;

      // Remove dead links from references
      const deadUrls = verificationResults
        .filter(v => v.status === 'dead')
        .map(v => v.original);
      if (deadUrls.length > 0) {
        article.references = article.references.filter(ref => !deadUrls.includes(ref));
        console.log(`[generator] Removed ${deadUrls.length} dead citation(s) from references`);
      }
    } catch (e) {
      console.error('Citation verification failed:', e);
    }
  }

  // ─── STAGE 5 — QC Engine (Auto-fix + Score) ──────────────
  onProgress?.({
    current: 0,
    total: 1,
    status: `Đang chạy QC Engine (auto-fix & chấm điểm)...`,
  });

  try {
    const qcResult = await runQC(article.id, { triggeredBy: 'auto', articleOverride: article });

    // Apply QC results to article
    article.content = qcResult.contentAfter || article.content;
    article.qcScore = qcResult.scoreTotal;
    article.qcGrade = qcResult.overallGrade;
    article.qcBadge = qcResult.overallGrade === 'A' ? 'high_quality' :
                      qcResult.overallGrade === 'B' ? 'good' :
                      qcResult.overallGrade === 'C' ? 'needs_work' :
                      qcResult.overallGrade === 'D' ? 'poor' : 'failed';
    article.qcAutoFixes = qcResult.autoFixed.length;
    article.qcManualIssues = qcResult.manualRequired.length;
    article.qcLastRun = new Date().toISOString();

    // Two-layer scores
    article.qcTechScore = qcResult.techScore;
    article.qcTechGrade = qcResult.techGrade;
    article.qcContentScore = qcResult.contentScore;
    article.qcContentGrade = qcResult.contentGrade;
    article.qcContentReviewerNote = qcResult.contentReviewerNote;
    article.qcFindings = qcResult.findings;

    // Status override from QC grade — map trực tiếp từ QC threshold
    if (qcResult.overallGrade === 'A') {
      article.status = 'approved';  // Auto-approved cho bài ≥90 điểm
    } else if (qcResult.overallGrade === 'B') {
      article.status = 'ready_for_review';
    } else if (qcResult.overallGrade === 'C') {
      article.status = 'needs_improvement';
    } else {
      article.status = 'rework_required';
    }

    // Sync blocking (critical violations + floor checks)
    // Chỉ block sync nhưng KHÔNG override status cho bài Grade A/B
    if (qcResult.syncBlocked) {
      article.qcSyncBlocked = true;
      article.qcBlockedBy = qcResult.blockedBy;
      article.qcBlockedReason = qcResult.blockedReason;
      // Chỉ override status nếu bài KHÔNG phải Grade A hoặc B
      if (qcResult.overallGrade !== 'A' && qcResult.overallGrade !== 'B') {
        article.status = 'rework_required';
      }
    }

    // ─── STAGE 6 — Layer 3: Risk & Safety (auto) ──────────
    onProgress?.({ current: 0, total: 1, status: 'Đang phân tích rủi ro & an toàn (Layer 3)...' });
    try {
      const { SafetyQCEngine } = await import('@/lib/qc/safety-engine');
      const safetyEngine = new SafetyQCEngine();
      const safetyReport = await safetyEngine.runFullPipeline(article.id, { articleOverride: article });
      
      // Persist Layer 3 results to article
      article.qcRiskScore = safetyReport.risk_score;
      article.qcSafetyScore = safetyReport.safety_score;
      article.qcFinalSafetyIndex = safetyReport.final_safety_index;
      article.qcDecision = safetyReport.decision;
      article.qcRiskLevel = safetyReport.risk_level;

      // Override status if hard blocked by safety
      if (safetyReport.isHardBlocked) {
        article.status = 'rework_required';
        article.qcSyncBlocked = true;
        article.qcBlockedReason = safetyReport.blockReason || 'Safety hard block';
      }
    } catch (safetyErr) {
      console.warn('Layer 3 Safety engine failed, continuing with L1/L2:', safetyErr);
    }
  } catch (e) {
    console.error('QC Engine failed, using basic quality score:', e);
  }

  onProgress?.({
    current: 1,
    total: 1,
    status: 'Tạo thành công',
    article,
  });

  return article;
}

// ─── Auto Fill Image Captions (Caption-only, no external images) ─────

async function autoFillImages(htmlContent: string): Promise<string> {
  let newContent = htmlContent;

  // 1. Process New Format: [Ảnh minh hoạ | keyword | Caption text]
  const newFormatRegex = /\[Ảnh minh ho[ạa]\s*\|\s*([^|]+)\s*\|\s*([^\]]+)\]/gi;
  newContent = newContent.replace(newFormatRegex, (_match, _keyword: string, caption: string) => {
    const trimCaption = caption.trim();
    return `<figure class="image-caption" style="text-align: center; margin: 1.5rem auto; padding: 1.2rem; border: 2px dashed #e2e8f0; border-radius: 8px; background: #f8fafc;">
  <figcaption style="font-size: 0.9em; color: #555; text-align: center; display: block;"><em>${trimCaption}</em></figcaption>
</figure>`;
  });

  // 2. Process Old Format: [Ảnh minh họa: Mô tả...]
  const oldRegex = /\[Ảnh minh ho[ạa].*?:\s*(.*?)(?:\s*\(.*?\))?\]/gi;
  newContent = newContent.replace(oldRegex, (_match, rawQuery: string) => {
    const trimCaption = rawQuery.trim();
    return `<figure class="image-caption" style="text-align: center; margin: 1.5rem auto; padding: 1.2rem; border: 2px dashed #e2e8f0; border-radius: 8px; background: #f8fafc;">
  <figcaption style="font-size: 0.9em; color: #555; text-align: center; display: block;"><em>${trimCaption}</em></figcaption>
</figure>`;
  });

  return newContent;
}

// ─── Auto Inject Internal Links ─────────────────────────────

function autoInjectInternalLinks(htmlContent: string, links: { anchor: string; url: string }[]): string {
  let content = htmlContent;

  // Mask out H2 and H3 tags so we don't accidentally insert internal links into them
  const headings: string[] = [];
  content = content.replace(/<(h2|h3)\b[^>]*>[\s\S]*?<\/\1>/gi, (match) => {
    headings.push(match);
    return `__HEADING_PLACEHOLDER_${headings.length - 1}__`;
  });

  // Mask out blockquote tags — no internal links in question blocks (Q&A articles)
  const blockquotes: string[] = [];
  content = content.replace(/<blockquote\b[\s\S]*?<\/blockquote>/gi, (match) => {
    blockquotes.push(match);
    return `__BLOCKQUOTE_PLACEHOLDER_${blockquotes.length - 1}__`;
  });

  for (const link of links) {
    // Skip if this anchor text is already linked (AI may have done it)
    const anchorLower = link.anchor.toLowerCase();
    const alreadyLinked = content.toLowerCase().includes(`>${anchorLower}</a>`);
    if (alreadyLinked) continue;

    // Find first occurrence of the anchor text (case-insensitive) that's NOT inside an HTML tag
    // Use a regex that matches the anchor text NOT inside < > brackets
    const escapedAnchor = link.anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<![<\\p{L}\\p{M}\\d_])(?<!\/)(?<!")(${escapedAnchor})(?![\\p{L}\\p{M}\\d_])(?![^<]*>)`, 'iu');
    const match = content.match(regex);
    
    if (match && match.index !== undefined) {
      const originalText = match[1];
      const replacement = `<a href="${link.url}" target="_blank" rel="noopener noreferrer">${originalText}</a>`;
      content = content.substring(0, match.index) + replacement + content.substring(match.index + originalText.length);
    }
  }

  // Restore blockquotes
  blockquotes.forEach((bq, i) => {
    content = content.replace(`__BLOCKQUOTE_PLACEHOLDER_${i}__`, bq);
  });

  // Restore headings
  headings.forEach((heading, i) => {
    content = content.replace(`__HEADING_PLACEHOLDER_${i}__`, heading);
  });

  return content;
}

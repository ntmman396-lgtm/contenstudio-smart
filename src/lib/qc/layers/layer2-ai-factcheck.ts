// ─── Layer 2B: AI Medical Fact-Check ────────────────────────
// Calls Gemini as a senior medical editor to fact-check the article content.
// Returns structured findings that merge into qcFindings.
// This is an ADDITIVE step — it does NOT replace the deterministic L2 checks.

import { GoogleGenAI } from '@google/genai';

export interface AIFactCheckFinding {
  rule_code: string;
  passed: boolean;
  deduction: number;
  severity: 'critical' | 'warning' | 'info';
  layer: 'content';
  sub: 'accuracy';
  detail: string;
  quote?: string; // the exact text from the article that has the issue
  suggestion?: string; // what the correct information should be
}

export interface AIFactCheckResult {
  findings: AIFactCheckFinding[];
  totalDeduction: number;
  summary: string;
}

const SYSTEM_PROMPT = `Bạn là bác sĩ đa khoa kiêm biên tập viên nội dung sức khỏe. Bạn đang kiểm tra bài viết y khoa PHỔ THÔNG dành cho NGƯỜI ĐỌC BÌNH THƯỜNG (không phải tạp chí y khoa).

MỤC TIÊU: Chỉ phát hiện những lỗi THỰC SỰ ảnh hưởng đến sức khỏe người đọc. KHÔNG bắt lỗi học thuật thuần túy.

CHỈ FLAG khi:
1. SAI SỰ THẬT Y KHOA: Thông tin sai hoàn toàn, có thể khiến người đọc hiểu lầm nghiêm trọng về bệnh/thuốc
2. NGUY HIỂM CHO NGƯỜI ĐỌC: Liều lượng thuốc cụ thể, hướng dẫn điều trị mà người đọc có thể tự áp dụng gây hại
3. THIẾU CẢNH BÁO QUAN TRỌNG: Không nhắc "cần tham khảo bác sĩ" khi đề cập điều trị, hoặc thiếu cảnh báo tác dụng phụ nguy hiểm
4. NHẦM LẪN KHÁI NIỆM LỚN: Nhầm tên bệnh, nhầm cơ quan, nhầm loại thuốc (ví dụ: nhầm virus với vi khuẩn)

KHÔNG FLAG (bỏ qua):
- Phân loại y khoa hơi đơn giản hóa cho người đọc phổ thông → CHẤP NHẬN
- Số liệu thống kê phổ biến không dẫn nguồn (ví dụ: "khoảng 30% dân số") → CHẤP NHẬN vì đây là bài phổ thông
- Thiếu chi tiết chuyên sâu mà chỉ bác sĩ mới quan tâm → CHẤP NHẬN
- Dùng thuật ngữ đơn giản thay vì thuật ngữ y khoa chính xác → CHẤP NHẬN
- Cơ chế bệnh được mô tả đơn giản hóa → CHẤP NHẬN nếu không sai bản chất

MỨC ĐỘ:
- critical: SAI y khoa rõ ràng hoặc có thể gây hại trực tiếp cho người đọc
- warning: Đáng ngờ, nên có bác sĩ xác nhận trước khi đăng
- info: Nên bổ sung cảnh báo "tham khảo bác sĩ" hoặc làm rõ thêm

YÊU CẦU OUTPUT:
Trả về MỘT mảng JSON hợp lệ:
[
  {
    "severity": "critical" | "warning" | "info",
    "type": "SAI SỰ THẬT" | "NGUY HIỂM" | "THIẾU CẢNH BÁO" | "NHẦM LẪN",
    "quote": "trích dẫn đoạn có vấn đề",
    "issue": "mô tả ngắn gọn (1 câu)",
    "suggestion": "gợi ý sửa (1 câu)"
  }
]

Nếu bài viết ổn cho người đọc phổ thông, trả về: []
Chỉ flag 3-5 vấn đề NGHIÊM TRỌNG NHẤT (nếu có). KHÔNG liệt kê dài.
CHỈ TRẢ VỀ JSON.`;

// Deduction points per severity (relaxed for general audience content)
const DEDUCTION_MAP: Record<string, number> = {
  critical: 5,
  warning: 2,
  info: 0, // Info = suggestion only, no point deduction
};

// Max total deduction from AI fact-check
const MAX_AI_DEDUCTION = 15;

export async function runAIFactCheck(htmlContent: string): Promise<AIFactCheckResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[AI FactCheck] GEMINI_API_KEY not configured, skipping');
    return { findings: [], totalDeduction: 0, summary: 'Skipped — no API key' };
  }

  // Strip HTML tags for cleaner analysis
  const plainText = htmlContent
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

  // Skip if content is too short
  if (plainText.length < 200) {
    return { findings: [], totalDeduction: 0, summary: 'Bài quá ngắn để fact-check' };
  }

  try {
    const client = new GoogleGenAI({ apiKey });

    const response = await client.models.generateContent({
      model: 'gemini-1.5-pro',
      contents: `Hãy fact-check bài viết y khoa sau:\n\n---\n${plainText}\n---`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.2, // Low temperature for precision
        maxOutputTokens: 4096,
      },
    });

    const responseText = response.text || '';

    // Parse JSON from response
    let rawFindings: any[] = [];
    const codeBlockMatch = responseText.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
    const jsonStr = codeBlockMatch ? codeBlockMatch[1].trim() : responseText.trim();

    try {
      rawFindings = JSON.parse(jsonStr);
      if (!Array.isArray(rawFindings)) rawFindings = [rawFindings];
    } catch {
      // Try extracting array directly
      const arrayMatch = responseText.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        try { rawFindings = JSON.parse(arrayMatch[0]); } catch { /* empty */ }
      }
    }

    // Convert to AIFactCheckFinding format
    let runningDeduction = 0;
    const findings: AIFactCheckFinding[] = rawFindings
      .filter(f => f && f.issue && f.severity)
      .map((f, i) => {
        const severity = (['critical', 'warning', 'info'].includes(f.severity) ? f.severity : 'info') as 'critical' | 'warning' | 'info';
        const deduction = Math.min(DEDUCTION_MAP[severity] || 2, MAX_AI_DEDUCTION - runningDeduction);
        runningDeduction += deduction;

        const typeLabel = f.type ? `[${f.type}] ` : '';

        return {
          rule_code: `AI-FC-${String(i + 1).padStart(2, '0')}`,
          passed: false,
          deduction: deduction > 0 ? deduction : 0,
          severity,
          layer: 'content' as const,
          sub: 'accuracy' as const,
          detail: `${typeLabel}${f.issue}`,
          quote: f.quote || undefined,
          suggestion: f.suggestion || undefined,
        };
      })
      .filter(f => f.deduction > 0); // Only keep findings with actual deductions

    const totalDeduction = Math.min(findings.reduce((sum, f) => sum + f.deduction, 0), MAX_AI_DEDUCTION);

    const summaryParts: string[] = [];
    const critCount = findings.filter(f => f.severity === 'critical').length;
    const warnCount = findings.filter(f => f.severity === 'warning').length;
    const infoCount = findings.filter(f => f.severity === 'info').length;
    if (critCount) summaryParts.push(`${critCount} critical`);
    if (warnCount) summaryParts.push(`${warnCount} warning`);
    if (infoCount) summaryParts.push(`${infoCount} info`);

    return {
      findings,
      totalDeduction,
      summary: summaryParts.length > 0
        ? `AI Fact-Check: ${summaryParts.join(', ')} (−${totalDeduction}đ)`
        : 'AI Fact-Check: Không phát hiện lỗi y khoa',
    };
  } catch (error) {
    console.error('[AI FactCheck] Gemini API error:', error);
    return { findings: [], totalDeduction: 0, summary: 'AI Fact-Check lỗi kết nối' };
  }
}

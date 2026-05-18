import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenAI } from '@google/genai';

export const maxDuration = 60;

function fromJson(value: string | null): any {
  if (!value) return null;
  try { return JSON.parse(value); } catch { return value; }
}
function toJson(value: any): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

const FIX_SYSTEM_PROMPT = `Bạn là biên tập viên y khoa. Bạn nhận được bài viết HTML và danh sách lỗi cần sửa.

NHIỆM VỤ: Sửa từng lỗi trong bài viết HTML. Giữ nguyên toàn bộ cấu trúc HTML, heading, format, hình ảnh, link.

QUY TẮC:
1. CHỈ sửa những đoạn được chỉ ra trong danh sách lỗi — KHÔNG thay đổi phần khác
2. Giữ nguyên tone phổ thông, dễ hiểu cho người đọc bình thường
3. Nếu lỗi là "thiếu cảnh báo" → thêm một câu nhẹ nhàng "Người bệnh nên tham khảo ý kiến bác sĩ trước khi..."
4. Nếu lỗi là "sai sự thật" → sửa cho đúng, rõ ràng
5. Nếu lỗi là "nguy hiểm" (liều thuốc cụ thể) → thay bằng "theo chỉ định của bác sĩ" hoặc bỏ liều cụ thể
6. KHÔNG thêm nội dung mới, KHÔNG xóa section, KHÔNG đổi heading
7. Trả về TOÀN BỘ bài viết HTML đã sửa (không chỉ đoạn sửa)
8. KHÔNG bọc trong code block, trả về HTML thuần`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleId } = body;

    if (!articleId) {
      return NextResponse.json({ error: 'articleId is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    // Load article
    const rawArticle = await prisma.article.findUnique({ where: { id: articleId } });
    if (!rawArticle) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const content = rawArticle.content || '';
    const findings = fromJson(rawArticle.qcFindings) || [];

    // Only fix critical and warning findings
    const fixableFindings = findings.filter(
      (f: any) => (f.severity === 'critical' || f.severity === 'warning') && f.detail
    );

    if (fixableFindings.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Không có lỗi cần sửa',
        fixedCount: 0,
        content: content,
      });
    }

    // Build fix instructions
    const fixList = fixableFindings.map((f: any, i: number) => {
      let instruction = `${i + 1}. [${f.severity.toUpperCase()}] ${f.detail}`;
      if (f.quote) instruction += `\n   Đoạn lỗi: "${f.quote}"`;
      if (f.suggestion) instruction += `\n   Gợi ý sửa: ${f.suggestion}`;
      return instruction;
    }).join('\n\n');

    const userPrompt = `Đây là bài viết HTML cần sửa:

---BÀI VIẾT---
${content}
---HẾT BÀI VIẾT---

DANH SÁCH LỖI CẦN SỬA (${fixableFindings.length} lỗi):
${fixList}

Hãy sửa TẤT CẢ các lỗi trên và trả về toàn bộ bài viết HTML đã sửa.`;

    const client = new GoogleGenAI({ apiKey });
    const response = await client.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: userPrompt,
      config: {
        systemInstruction: FIX_SYSTEM_PROMPT,
        temperature: 0.1,
        maxOutputTokens: 16384,
      },
    });

    let fixedContent = response.text || '';

    // Clean up: remove code block wrappers if present
    fixedContent = fixedContent
      .replace(/^```html?\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .trim();

    // Validate: must still contain HTML
    if (!fixedContent.includes('<') || fixedContent.length < content.length * 0.5) {
      return NextResponse.json({ error: 'AI trả về nội dung không hợp lệ' }, { status: 500 });
    }

    // Save fixed content to DB
    await prisma.article.update({
      where: { id: articleId },
      data: { content: fixedContent },
    });

    return NextResponse.json({
      success: true,
      fixedCount: fixableFindings.length,
      message: `Đã sửa ${fixableFindings.length} lỗi y khoa`,
      content: fixedContent,
    });
  } catch (error) {
    console.error('QC fix error:', error);
    const msg = error instanceof Error ? error.message : 'AI fix failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

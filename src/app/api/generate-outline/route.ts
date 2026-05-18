import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getTemplate } from '@/lib/templates';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, templateId, title } = body;

    if (!keyword && !title) {
      return NextResponse.json(
        { error: 'keyword or title is required' },
        { status: 400 }
      );
    }

    if (!templateId) {
      return NextResponse.json(
        { error: 'templateId is required' },
        { status: 400 }
      );
    }

    let template: any = getTemplate(templateId);
    if (!template) {
      const { prisma } = await import('@/lib/prisma');
      const dbTemplate = await prisma.template.findUnique({ where: { id: templateId } });
      if (!dbTemplate) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      template = {
        name: dbTemplate.name,
        outline: dbTemplate.outline ? JSON.parse(dbTemplate.outline) : []
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 401 });
    }

    const client = new GoogleGenAI({ apiKey });

    // Build template outline for reference
    const templateOutlineRules = template.outline.map((o) => {
      let rule = `${o.type.toUpperCase()}: ${o.label}`;
      if (o.children && o.children.length > 0) {
        rule += `\n  Sub-sections: ${o.children.map((s) => `${s.type.toUpperCase()}: ${s.label}`).join(', ')}`;
      }
      return rule;
    }).join('\n');

    const topic = title || keyword;

    const systemPrompt = `Bạn là biên tập viên nội dung y khoa tại Nhà thuốc Long Châu.
Nhiệm vụ: Lên dàn ý ngắn gọn (CHỈ liệt kê H2, H3) cho một bài viết y khoa theo khung template.

KHUNG TEMPLATE:
${templateOutlineRules}

QUY TẮC:
- CHỈ liệt kê H2 và H3. KHÔNG viết gạch đầu dòng, KHÔNG giải thích thêm.
- Tuân thủ đúng cấu trúc template (số lượng H2, H3 tương ứng).
- Không được chế thêm các phần "Nguyên nhân", "Triệu chứng" nếu KHUNG TEMPLATE không yêu cầu (ví dụ: GSK Blog hoặc Thuốc thì phải tùy biến dàn ý phù hợp với chủ đề, KHÔNG viết theo form bệnh lý).
- Mỗi heading trên 1 dòng, bắt đầu bằng "H2:" hoặc "H3:".
- Ngôn ngữ: Tiếng Việt.

${templateId === 'benh-ly' ? `VÍ DỤ OUTPUT:
H2: Tìm hiểu chung về [Chủ đề]
H2: Nguyên nhân gây [Chủ đề]
H3: Nguyên nhân bệnh lý
H3: Nguyên nhân không bệnh lý
H2: Triệu chứng thường gặp
H2: Phương pháp điều trị
` : templateId === 'gsk-blog' ? `VÍ DỤ OUTPUT:
H2: [Section 1 tự do, sáng tạo, chứa keyword]
H2: [Section 2 chi tiết liên quan đến chủ đề]
H3: [Sub-section của 2]
H2: [Section 3]
` : `VÍ DỤ OUTPUT:
H2: [Tên Heading 1 Phù Hợp Template]
H2: [Tên Heading 2 Phù Hợp Template]
H3: [Tên Sub-heading]
`}`;

    const userPrompt = `Hãy lên dàn ý chi tiết cho bài viết với chủ đề/từ khóa: "${topic}"`;

    const response = await client.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    });

    const outline = (response.text || '').trim();

    return NextResponse.json({ success: true, outline });
  } catch (error) {
    console.error('Generate outline error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Outline generation failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

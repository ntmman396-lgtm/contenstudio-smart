import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getTemplate } from '@/lib/templates';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceText, templateId, articleCount = 1 } = body;

    if (!sourceText || !templateId) {
      return NextResponse.json(
        { error: 'sourceText and templateId are required' },
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

    // Stringify template outline rules to guide the planner
    const templateOutlineRules = template.outline.map((o) => {
      let rule = `${o.type.toUpperCase()}: ${o.label}`;
      if (o.children && o.children.length > 0) {
        rule += `\n  - H3: ${o.children.map((s) => s.label).join(', ')}`;
      }
      return rule;
    }).join('\n');

    const systemPrompt = `Bạn là Trưởng ban biên tập nội dung y khoa. Bạn đang có một tài liệu nguồn và cần phân rã nó thành ${articleCount} bài viết riêng biệt dựa trên một Template quy chuẩn.

KHUNG TEMPLATE YÊU CẦU:
${templateOutlineRules}

NHIỆM VỤ:
Trích xuất thông tin từ tài liệu nguồn và lập kế hoạch cho ${articleCount} bài viết.
Với mỗi bài, hãy đặt [Tiêu đề bài viết] và lên [Dàn ý chi tiết].
Dàn ý bài viết phải tuân thủ tuyệt đối KHUNG TEMPLATE YÊU CẦU ở trên (dùng đúng các thẻ H2, H3 của template), nhưng diễn giải rõ các gạch đầu dòng nội dung chuẩn bị viết.

YÊU CẦU OUTPUT LÀ MỘT MẢNG JSON HỢP LỆ VỚI CẤU TRÚC:
[
  {
    "title": "Tiêu đề bài viết (≤70 ký tự, chứa từ khóa chính)",
    "outline": "Dàn ý bài viết (dạng text, trình bày rõ H2, H3 theo template và gạch đầu dòng ý chính rút từ tài liệu)"
  }
]
CHỈ TRẢ VỀ JSON, KHÔNG CẦN CHÚ THÍCH THÊM.`;

    const userPrompt = `===== TÀI LIỆU NGUỒN =====\n${sourceText}\n===== HẾT TÀI LIỆU =====\n\nHãy lập mảng JSON chứa kế hoạch cho ${articleCount} bài.`;

    const response = await client.models.generateContent({
      model: 'gemini-1.5-pro',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.5,
        maxOutputTokens: 8192,
      }
    });

    const responseText = response.text || '';
    
    // Parse JSON from Gemini response
    const codeBlockMatch = responseText.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
    const jsonStr = codeBlockMatch ? codeBlockMatch[1].trim() : responseText.trim();
    
    let parsedPlan: any[] = [];
    // Strategy 1: code block extraction
    try {
      parsedPlan = JSON.parse(jsonStr);
      if (!Array.isArray(parsedPlan)) parsedPlan = [parsedPlan];
    } catch {
      // Strategy 2: array regex
      const arrayMatch = responseText.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        try {
          parsedPlan = JSON.parse(arrayMatch[0]);
        } catch {}
      }
      // Strategy 3: object regex → wrap in array
      if (parsedPlan.length === 0) {
        const objMatch = responseText.match(/\{[\s\S]*?\}/);
        if (objMatch) {
          try {
            parsedPlan = [JSON.parse(objMatch[0])];
          } catch {}
        }
      }
      // Strategy 4: graceful default
      if (parsedPlan.length === 0) {
        console.warn('[batch-plan] Could not parse plan from Gemini, using empty plan');
        parsedPlan = [];
      }
    }

    // Map to BatchPlanItem format
    const planItems = parsedPlan.map((item: any, index: number) => ({
      id: `batch-item-${Date.now()}-${index}`,
      title: item.title || `Bài viết ${index + 1}`,
      outline: item.outline || '',
      status: 'draft',
    }));

    return NextResponse.json({ success: true, items: planItems });
  } catch (error) {
    console.error('Batch plan error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Plan generation failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

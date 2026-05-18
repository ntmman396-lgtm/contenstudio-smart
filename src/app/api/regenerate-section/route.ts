import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sectionHeading,
      sectionContent,
      articleTitle,
      templateId,
      sourceSnippet,
    } = body;

    if (!sectionHeading || !articleTitle) {
      return NextResponse.json(
        { error: 'sectionHeading and articleTitle are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured' },
        { status: 401 }
      );
    }

    const client = new GoogleGenAI({ apiKey });

    const systemPrompt = `Bạn là chuyên gia nội dung y khoa cho nhà thuốc Long Châu. Nhiệm vụ: viết lại MỘT section cụ thể trong bài viết y khoa.

Quy tắc:
- Output là HTML (dùng <h2>, <h3>, <p>, <ul>, <li>, <strong>)
- Giữ nguyên heading H2 ban đầu
- Nội dung chính xác y khoa, có dẫn nguồn nếu cần
- Cải thiện chất lượng so với bản gốc: rõ ràng hơn, đầy đủ hơn, SEO-friendly hơn
- KHÔNG trả JSON, chỉ trả HTML content thuần`;

    const userPrompt = `Bài viết: "${articleTitle}" (template: ${templateId})

Section cần viết lại: "${sectionHeading}"

Nội dung hiện tại:
${sectionContent}

${sourceSnippet ? `Nguồn tham khảo:\n${sourceSnippet}` : ''}

Hãy viết lại section này tốt hơn, đầy đủ hơn, chuẩn y khoa hơn. Trả về HTML content.`;

    const response = await client.models.generateContent({
      model: 'gemini-1.5-pro',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        maxOutputTokens: 2000,
      }
    });

    const newContent = response.text || '';

    return NextResponse.json({
      success: true,
      newContent,
      sectionHeading,
    });
  } catch (error) {
    console.error('Section regeneration error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Regeneration failed' },
      { status: 500 }
    );
  }
}

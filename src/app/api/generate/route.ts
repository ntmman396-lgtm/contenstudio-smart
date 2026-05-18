import { NextRequest, NextResponse } from 'next/server';
import { generateSingleArticle } from '@/lib/generator';
import { GeneratorSettings, BatchPlanItem } from '@/types';

export const maxDuration = 60; // Allow up to 60s for AI generation of a single heavy article

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      item,
      settings,
    } = body as { item: BatchPlanItem; settings: GeneratorSettings };

    // Validate required fields
    if (!item || !item.title) {
      return NextResponse.json(
        { error: 'BatchPlanItem with title is required' },
        { status: 400 }
      );
    }

    if (!settings || !settings.templateId) {
      return NextResponse.json(
        { error: 'GeneratorSettings with templateId is required' },
        { status: 400 }
      );
    }

    // Generate article using Gemini
    const article = await generateSingleArticle(item, settings);

    return NextResponse.json({
      success: true,
      article,
    });
  } catch (error) {
    console.error('Generation error:', error);

    // Handle specific Gemini API errors
    const errorMessage = error instanceof Error ? error.message : 'Generation failed';
    const statusCode = errorMessage.includes('GEMINI_API_KEY') ? 401 : 500;

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: statusCode }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Helper: parse JSON string back to object
function fromJson(value: string | null): any {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function deserializeArticle(row: any): any {
  return {
    ...row,
    references: fromJson(row.references) ?? [],
    seoMeta: fromJson(row.seoMeta),
    tags: fromJson(row.tags) ?? [],
    rawFields: fromJson(row.rawFields),
  };
}

/**
 * POST /api/articles/export-batch
 * Body: { articleIds: string[] }
 * Returns: array of articles with full content for DOCX export
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleIds } = body;

    if (!articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
      return NextResponse.json({ error: 'articleIds array is required' }, { status: 400 });
    }

    const articles = await prisma.article.findMany({
      where: {
        id: { in: articleIds },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        sapo: true,
        content: true,
        references: true,
        seoMeta: true,
        category: true,
        tags: true,
        templateName: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const result = articles.map(deserializeArticle);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Failed to fetch batch articles for export:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

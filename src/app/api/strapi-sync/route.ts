import { NextRequest, NextResponse } from 'next/server';
import { GeneratedArticle } from '@/types';
import { syncArticle } from '@/lib/strapi';

/**
 * POST /api/strapi-sync
 * Syncs an approved article to Strapi CMS using the strapi client.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { article } = body as { article: GeneratedArticle };

    if (!article) {
      return NextResponse.json({ error: 'Article data is required' }, { status: 400 });
    }

    // If Strapi env vars are not set, return preview mode
    if (!process.env.STRAPI_URL || !process.env.STRAPI_TOKEN) {
      return NextResponse.json({
        success: true,
        mode: 'preview',
        message: 'Strapi not configured. Set STRAPI_URL and STRAPI_TOKEN in .env.local',
        fieldMapping: {
          'title → Tên Bài Viết': article.title,
          'slug → Slug': article.slug,
          'sapo → Mô Tả Ngắn': article.sapo,
          'content → Mô Tả': `${article.content.slice(0, 100)}...`,
          'references → Nguồn Tham Khảo': article.references.join(', '),
          'seoMeta.title → SEO_title': article.seoMeta.title,
          'category → Danh Mục Bài Viết': article.category,
          'tags → Tags': article.tags,
        },
      });
    }

    // Use the Strapi client
    const result = await syncArticle(article);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, status: 'sync_error' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      mode: 'synced',
      strapiId: result.strapiId,
      message: `Đã đồng bộ thành công — Strapi ID: ${result.strapiId}`,
    });
  } catch (error) {
    console.error('Strapi sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed', status: 'sync_error' },
      { status: 500 }
    );
  }
}

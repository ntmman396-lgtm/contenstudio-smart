import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runAIFactCheck } from '@/lib/qc/layers/layer2-ai-factcheck';

export const maxDuration = 30;

function fromJson(value: string | null): any {
  if (!value) return null;
  try { return JSON.parse(value); } catch { return value; }
}
function toJson(value: any): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

function deserializeArticle(row: any): any {
  return {
    ...row,
    references: fromJson(row.references) ?? [],
    seoMeta: fromJson(row.seoMeta),
    tags: fromJson(row.tags) ?? [],
    rawFields: fromJson(row.rawFields),
    citationReport: fromJson(row.citationReport),
    citationVerification: fromJson(row.citationVerification),
    qcBlockedBy: fromJson(row.qcBlockedBy),
    qcTechScore: fromJson(row.qcTechScore),
    qcContentScore: fromJson(row.qcContentScore),
    qcFindings: fromJson(row.qcFindings),
    revisionChecklist: fromJson(row.revisionChecklist),
    inlineComments: fromJson(row.inlineComments),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleId, contentOverride } = body;

    if (!articleId && !contentOverride) {
      return NextResponse.json({ error: 'articleId or contentOverride is required' }, { status: 400 });
    }

    let articleContent = contentOverride;
    let article = null;

    if (articleId) {
      const rawArticle = await prisma.article.findUnique({ where: { id: articleId } });
      if (!rawArticle && !contentOverride) {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 });
      }
      if (rawArticle) {
        article = deserializeArticle(rawArticle);
        if (!articleContent) {
          articleContent = article.content;
        }
      }
    }

    if (!articleContent) {
      return NextResponse.json({ error: 'No content to check' }, { status: 400 });
    }

    // Run Layer 2B: AI Fact Check
    const aiFactCheckResult = await runAIFactCheck(articleContent);

    // If we have an article in the DB, append these findings so they are persisted (optional but useful)
    // We only keep the AI findings in the qcFindings array if we save it.
    // However, since this is a manual check, simply returning the result is fine.
    // The user will see it in the UI. We will append them to `qcFindings` just in case.
    if (article) {
      const existingFindings = article.qcFindings || [];
      // Remove any previous AI findings to prevent duplicates
      const coreFindings = existingFindings.filter((f: any) => !f.rule_code || !f.rule_code.startsWith('AI-FC'));
      const combinedFindings = [...coreFindings, ...aiFactCheckResult.findings];

      try {
        await prisma.article.update({
          where: { id: articleId },
          data: {
            qcFindings: toJson(combinedFindings),
          },
        });
      } catch (dbErr) {
        console.warn('Failed to persist AI fact-check findings to qcFindings:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      result: aiFactCheckResult,
    });
  } catch (error) {
    console.error('QC fact-check error:', error);
    const errorMessage = error instanceof Error ? error.message : 'AI Fact Check failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

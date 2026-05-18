import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GeneratedArticle } from '@/types';

// Helper: safely stringify a value for SQLite JSON columns
function toJson(value: any): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

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

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const article = await prisma.article.findUnique({
      where: { id: params.id },
    });
    if (!article) return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    return NextResponse.json(deserializeArticle(article));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body: GeneratedArticle = await request.json();

    const updated = await prisma.article.update({
      where: { id: params.id },
      data: {
        title: body.title,
        slug: body.slug,
        sapo: body.sapo,
        content: body.content,
        references: toJson(body.references),
        seoMeta: toJson(body.seoMeta),
        category: body.category,
        tags: toJson(body.tags),
        templateId: body.templateId,
        templateName: body.templateName,
        status: body.status,
        syncedAt: body.syncedAt,
        rawFields: toJson(body.rawFields),
        citationReport: toJson(body.citationReport),

        qcScore: body.qcScore,
        qcGrade: body.qcGrade,
        qcBadge: body.qcBadge,
        qcAutoFixes: body.qcAutoFixes,
        qcManualIssues: body.qcManualIssues,
        qcSyncBlocked: body.qcSyncBlocked,
        qcBlockedBy: toJson(body.qcBlockedBy),
        qcBlockedReason: body.qcBlockedReason,
        qcLastRun: body.qcLastRun,
        qcTechScore: toJson(body.qcTechScore),
        qcTechGrade: body.qcTechGrade,
        qcContentScore: toJson(body.qcContentScore),
        qcContentGrade: body.qcContentGrade,
        qcContentReviewerNote: body.qcContentReviewerNote,

        // Layer 3: Risk & Safety
        qcRiskScore: body.qcRiskScore,
        qcSafetyScore: body.qcSafetyScore,
        qcFinalSafetyIndex: body.qcFinalSafetyIndex,
        qcDecision: body.qcDecision,
        qcRiskLevel: body.qcRiskLevel,
        qcFindings: toJson(body.qcFindings),
      },
    });

    return NextResponse.json(deserializeArticle(updated));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.article.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

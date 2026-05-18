import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runQC } from '@/lib/qc/engine';
import { SafetyQCEngine } from '@/lib/qc/safety-engine';

export const maxDuration = 30;

// Helper: parse JSON string back to object
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
    const { articleId } = body;

    if (!articleId) {
      return NextResponse.json({ error: 'articleId is required' }, { status: 400 });
    }

    // Load article directly from DB via Prisma
    const rawArticle = await prisma.article.findUnique({ where: { id: articleId } });
    if (!rawArticle) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }
    const article = deserializeArticle(rawArticle);

    // Run 2-layer QC (L1 Tech + L2 Content)
    const qcResult = await runQC(articleId, { triggeredBy: 'manual', articleOverride: article });

    // Run Layer 3 Safety
    let safetyReport: any = null;
    try {
      const safetyEngine = new SafetyQCEngine();
      safetyReport = await safetyEngine.runFullPipeline(articleId, { articleOverride: article });
    } catch (safetyErr) {
      console.warn('Layer 3 Safety engine failed, continuing with L1/L2 results', safetyErr);
    }

    // Build updated article fields
    const updatedFields: Record<string, any> = {
      qcScore: qcResult.scoreTotal,
      qcGrade: qcResult.overallGrade,
      qcBadge: qcResult.overallGrade === 'A' ? 'high_quality' :
               qcResult.overallGrade === 'B' ? 'good' :
               qcResult.overallGrade === 'C' ? 'needs_work' :
               qcResult.overallGrade === 'D' ? 'poor' : 'failed',
      qcTechScore: qcResult.techScore,
      qcTechGrade: qcResult.techGrade,
      qcContentScore: qcResult.contentScore,
      qcContentGrade: qcResult.contentGrade,
      qcContentReviewerNote: qcResult.contentReviewerNote,
      qcAutoFixes: qcResult.autoFixed.length,
      qcManualIssues: qcResult.manualRequired.length,
      qcSyncBlocked: qcResult.syncBlocked,
      qcBlockedReason: qcResult.blockedReason,
      qcBlockedBy: qcResult.blockedBy,
      qcLastRun: new Date().toISOString(),
      qcFindings: qcResult.findings,
      content: qcResult.contentAfter || article.content,
    };

    // Status from grade
    if (qcResult.overallGrade === 'A') {
      updatedFields.status = 'approved';
    } else if (qcResult.overallGrade === 'B') {
      updatedFields.status = 'ready_for_review';
    } else if (qcResult.overallGrade === 'C') {
      updatedFields.status = 'needs_improvement';
    } else {
      updatedFields.status = 'rework_required';
    }

    // Layer 3 Safety results
    if (safetyReport) {
      updatedFields.qcRiskScore = safetyReport.risk_score;
      updatedFields.qcSafetyScore = safetyReport.safety_score;
      updatedFields.qcFinalSafetyIndex = safetyReport.final_safety_index;
      updatedFields.qcDecision = safetyReport.decision;
      updatedFields.qcRiskLevel = safetyReport.risk_level;
    }

    // Persist to DB directly via Prisma
    const updatedArticle = { ...article, ...updatedFields };
    try {
      await prisma.article.update({
        where: { id: articleId },
        data: {
          content: updatedFields.content,
          status: updatedFields.status,
          qcScore: updatedFields.qcScore,
          qcGrade: updatedFields.qcGrade,
          qcBadge: updatedFields.qcBadge,
          qcTechScore: toJson(updatedFields.qcTechScore),
          qcTechGrade: updatedFields.qcTechGrade,
          qcContentScore: toJson(updatedFields.qcContentScore),
          qcContentGrade: updatedFields.qcContentGrade,
          qcContentReviewerNote: updatedFields.qcContentReviewerNote,
          qcAutoFixes: updatedFields.qcAutoFixes,
          qcManualIssues: updatedFields.qcManualIssues,
          qcSyncBlocked: updatedFields.qcSyncBlocked,
          qcBlockedReason: updatedFields.qcBlockedReason,
          qcBlockedBy: toJson(updatedFields.qcBlockedBy),
          qcLastRun: updatedFields.qcLastRun,
          qcFindings: toJson(updatedFields.qcFindings),
          qcRiskScore: updatedFields.qcRiskScore,
          qcSafetyScore: updatedFields.qcSafetyScore,
          qcFinalSafetyIndex: updatedFields.qcFinalSafetyIndex,
          qcDecision: updatedFields.qcDecision,
          qcRiskLevel: updatedFields.qcRiskLevel,
        },
      });
    } catch (e) {
      console.warn('Failed to persist QC results:', e);
    }

    return NextResponse.json({
      success: true,
      qcResult: {
        ...qcResult,
        contentBefore: undefined,
        contentAfter: undefined,
      },
      safetyReport,
      updatedArticle,
    });
  } catch (error) {
    console.error('QC run error:', error);
    const errorMessage = error instanceof Error ? error.message : 'QC execution failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

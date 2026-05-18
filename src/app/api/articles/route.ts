import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GeneratedArticle } from '@/types';
import { getSessionUser, SESSION_COOKIE } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// Define the directory path for storing generated articles
const ARTICLES_DIR = path.join(process.cwd(), 'generated_articles');

// Ensure the directory exists
if (!fs.existsSync(ARTICLES_DIR)) {
  fs.mkdirSync(ARTICLES_DIR, { recursive: true });
}

// Helper: safely stringify a value for SQLite JSON columns
function toJson(value: any): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') return value; // already stringified
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

// Convert a raw DB row back to the GeneratedArticle shape the frontend expects
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
    // RBAC workflow fields (pass-through, already correct types)
    revisionChecklist: fromJson(row.revisionChecklist),
    inlineComments: fromJson(row.inlineComments),
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const templateId = searchParams.get('templateId');
    const siteId = searchParams.get('siteId');

    const where: any = {};
    if (status) where.status = status;
    if (templateId) where.templateId = templateId;
    if (siteId) where.siteId = siteId;

    const articles = await prisma.article.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Build user map to resolve assignedCtvId and assignedBsId to names
    const users = await prisma.user.findMany({ select: { id: true, name: true } });
    const userMap = new Map(users.map(u => [u.id, u.name]));

    const result = articles.map(row => {
      const art = deserializeArticle(row);
      if (art.createdBy) art.createdByName = userMap.get(art.createdBy);
      if (art.assignedCtvId) art.assignedCtvName = userMap.get(art.assignedCtvId);
      if (art.assignedBsId) art.assignedBsName = userMap.get(art.assignedBsId);
      if (art.assignedBy) art.assignedByName = userMap.get(art.assignedBy);
      if (art.approvedBy) art.approvedByName = userMap.get(art.approvedBy);
      return art;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Failed to fetch articles:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: GeneratedArticle = await request.json();

    // Get logged-in user for createdBy
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const sessionUser = token ? await getSessionUser(token) : null;

    let finalSlug = body.slug;
    const existingSlug = await prisma.article.findUnique({ where: { slug: finalSlug } });
    if (existingSlug && existingSlug.id !== body.id) {
      finalSlug = `${finalSlug}-${Math.random().toString(36).substring(2, 7)}`;
    }

    const newArticle = await prisma.article.create({
      data: {
        id: body.id,
        title: body.title,
        slug: finalSlug,
        sapo: body.sapo,
        content: body.content,
        references: toJson(body.references),
        seoMeta: toJson(body.seoMeta),
        category: body.category,
        tags: toJson(body.tags),
        templateId: body.templateId,
        templateName: body.templateName,
        siteId: (body as any).siteId || 'nha-thuoc',
        status: body.status || 'pending_review',
        workflowStatus: (body.qcScore != null && body.qcScore >= 85) ? 'pending_bs_review' : 'draft',
        createdBy: sessionUser?.id || null,
        rawFields: toJson(body.rawFields),
        citationReport: toJson(body.citationReport),
        citationVerification: toJson(body.citationVerification),

        qcScore: body.qcScore,
        qcGrade: body.qcGrade,
        qcBadge: body.qcBadge,
        qcAutoFixes: body.qcAutoFixes,
        qcManualIssues: body.qcManualIssues,
        qcSyncBlocked: body.qcSyncBlocked,
        qcBlockedBy: toJson(body.qcBlockedBy),
        qcBlockedReason: body.qcBlockedReason,
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

    const finalRecord = deserializeArticle(newArticle);
    
    // Save backup to hard drive folder
    try {
      const fileName = `${finalRecord.slug || finalRecord.id}.json`;
      const filePath = path.join(ARTICLES_DIR, fileName);
      fs.writeFileSync(filePath, JSON.stringify(finalRecord, null, 2), 'utf-8');
    } catch (fsError) {
      console.error('Failed to save article backup to folder:', fsError);
    }

    return NextResponse.json(finalRecord);
  } catch (error: any) {
    console.error('Failed to create article:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

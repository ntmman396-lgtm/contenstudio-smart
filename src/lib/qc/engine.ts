import { getGeneratedArticles } from '@/lib/storage';
import {
  QC_WEIGHT_CONFIG,
  QC_FLOOR_CONFIG,
  QC_THRESHOLDS,
  computeGrade,
  type QCGrade,
} from './section-config';
import { getActiveRulesMap, type UnifiedRule } from '@/lib/qc/rule-registry';
import { prisma } from '@/lib/prisma';
import { runLayer1TechQC, TechScore } from './layers/layer1-tech';
import { runLayer2MedicalQC, ContentScore } from './layers/layer2-medical';


export interface QCOptions {
  triggeredBy: 'auto' | 'manual' | 'rerun';
  triggeredByUser?: string;
  skipAutoFix?: boolean;
  sectionsOnly?: string[];
  articleOverride?: any;
}

export type { TechScore, ContentScore }; // Re-export for compatibility with other files

export interface QCResult {
  id: string;
  articleId: string;
  status: 'running' | 'completed' | 'failed';

  // Tầng 1: Kỹ thuật (100 điểm)
  techScore: TechScore;
  techGrade: QCGrade;

  // Tầng 2: Nội dung (100 điểm)
  contentScore: ContentScore;
  contentGrade: QCGrade;
  contentReviewerNote: string;

  // Điểm tổng (có trọng số)
  scoreTotal: number;  // ROUND(tech * 0.4 + content * 0.6)
  overallGrade: QCGrade;

  // Sync blocking
  syncBlocked: boolean;
  blockedReason: string;

  // QC status
  qcStatus: string;
  issuesFound: any[];
  autoFixed: any[];
  manualRequired: any[];
  blockedBy: string[];
  contentBefore: string;
  contentAfter: string;
  durationMs: number;
  // Detailed deduction findings (only failed ones with details)
  findings: Array<{ sub: string; layer: string; deduction: number; detail?: string; severity: string; quote?: string; suggestion?: string }>;
}

const emitSSE = (event: any) => {
  console.log(`[QC SSE Event]`, event);
};

const loadArticle = async (articleId: string) => {
  const articles = await getGeneratedArticles();
  const article = articles.find(a => a.id === articleId);
  if (!article) throw new Error("Article not found in DB");
  return article;
};

/**
 * Load active rules from the unified registry, split by section.
 * Returns Map<code, UnifiedRule> for each layer.
 */
const loadActiveRulesAndConfig = async (templateId: string) => {
  const allDbRules = await prisma.qcRule.findMany({
    where: { isActive: true }
  });
  
  const techRules = new Map<string, UnifiedRule>();
  const contentRules = new Map<string, UnifiedRule>();
  
  for (const dbRule of allDbRules) {
    let appliesTo = ['*'];
    try { appliesTo = JSON.parse(dbRule.appliesTo); } catch(e) {}
    
    if (!appliesTo.includes('*') && !appliesTo.includes(templateId)) continue;

    const rule: UnifiedRule = {
      code: dbRule.code,
      name: dbRule.name,
      description: dbRule.description,
      section: dbRule.section as 'TECH' | 'CONTENT',
      sub_dimension: dbRule.subDimension,
      deduction: dbRule.deduction,
      max_deduction: dbRule.maxDeduction,
      severity: dbRule.severity as 'critical' | 'warning' | 'info',
      is_active: dbRule.isActive,
      is_system: dbRule.isSystem,
      auto_fixable: dbRule.autoFixable,
      fix_instruction: dbRule.fixInstruction,
      applies_to: appliesTo,
      check_type: dbRule.checkType
    };

    if (rule.section === 'TECH') {
      techRules.set(rule.code, rule);
    } else {
      contentRules.set(rule.code, rule);
    }
  }

  return { techRules, contentRules };
};

export async function runQC(articleId: string, options: QCOptions = { triggeredBy: 'auto' }): Promise<QCResult> {
  const startTime = Date.now();
  const runId = `qc-run-${Date.now()}`;

  const article = options.articleOverride ? options.articleOverride : await loadArticle(articleId);
  const { techRules, contentRules } = await loadActiveRulesAndConfig(article.templateId);
  const contentBefore = article.content;

  emitSSE({ stage: 'preparing', percent: 5, message: 'Đang nạp bộ luật và cấu hình điểm (2-layer)' });

  // Layer 1: Technical & Format — now reads config from registry
  const l1Result = await runLayer1TechQC(contentBefore, techRules, options.skipAutoFix, article);
  
  emitSSE({ stage: 'auto_fix', percent: 30, fixes_applied: l1Result.autoFixed.length });

  // Layer 2: Medical Content Accuracy (deterministic) — now reads config from registry
  const l2Result = await runLayer2MedicalQC(l1Result.content, contentRules, options.skipAutoFix, article);

  emitSSE({ stage: 'evaluating', percent: 50, message: 'Đang chấm điểm theo 2 tầng (Kỹ thuật + Nội dung)' });

  emitSSE({ stage: 'scoring', percent: 80, message: 'Đang tổng hợp điểm...' });

  const techScore = l1Result.score;
  const contentScore = { ...l2Result.score };
  const currentContent = l2Result.content;
  
  const autoFixed = [...l1Result.autoFixed, ...l2Result.autoFixed];
  const manualRequired = [...l1Result.manualRequired, ...l2Result.manualRequired];
  const issuesFound = [...l1Result.issuesFound, ...l2Result.issuesFound];
  const allFindings = [...l1Result.findings, ...l2Result.findings];

  const scoreTotal = Math.round(techScore.total * QC_WEIGHT_CONFIG.tech + contentScore.total * QC_WEIGHT_CONFIG.content);

  const techGrade = computeGrade(techScore.total);
  const contentGrade = computeGrade(contentScore.total);
  const overallGrade = computeGrade(scoreTotal);

  const threshold = QC_THRESHOLDS.find(t => t.grade === overallGrade) ?? QC_THRESHOLDS[QC_THRESHOLDS.length - 1];
  let newStatus = threshold.status;
  let syncBlocked = threshold.blockSync;
  let blockedReason = '';

  if (techScore.total < QC_FLOOR_CONFIG.techMin) {
    syncBlocked = true;
    blockedReason = `Kỹ thuật ${techScore.total}/100 < ${QC_FLOOR_CONFIG.techMin} (ngưỡng tối thiểu)`;
    if (newStatus === 'ready_for_review') newStatus = 'needs_improvement';
  }
  if (contentScore.total < QC_FLOOR_CONFIG.contentMin) {
    syncBlocked = true;
    blockedReason = blockedReason 
      ? `${blockedReason} | Nội dung ${contentScore.total}/100 < ${QC_FLOOR_CONFIG.contentMin}`
      : `Nội dung ${contentScore.total}/100 < ${QC_FLOOR_CONFIG.contentMin} (ngưỡng tối thiểu)`;
    if (newStatus === 'ready_for_review') newStatus = 'needs_improvement';
  }

  const blockedBy: string[] = [];
  allFindings.forEach(f => {
    if (!f.passed && f.severity === 'critical') {
      syncBlocked = true;
      blockedBy.push(f.rule_code);
      if (!blockedReason) blockedReason = 'Critical rule violations';
    }
  });

  let qcStatusLabel = '';
  switch (overallGrade) {
    case 'A': qcStatusLabel = 'Chất lượng xuất sắc'; break;
    case 'B': qcStatusLabel = 'Đạt yêu cầu'; break;
    case 'C': qcStatusLabel = 'Cần cải thiện'; break;
    case 'D': qcStatusLabel = 'Cần viết lại một phần'; break;
    case 'E': qcStatusLabel = 'Không đạt — cần viết lại'; break;
  }

  const durationMs = Date.now() - startTime;

  emitSSE({ 
    stage: 'completed', 
    percent: 100,
    scoreTotal,
    techScore: techScore.total,
    contentScore: contentScore.total,
    grade: overallGrade,
    status: newStatus,
    fixes_applied: autoFixed.length,
    issues_remaining: manualRequired.length,
    syncBlocked,
  });

  return {
    id: runId,
    articleId,
    status: 'completed',
    techScore,
    techGrade,
    contentScore,
    contentGrade,
    contentReviewerNote: '',
    scoreTotal,
    overallGrade,
    syncBlocked,
    blockedReason,
    qcStatus: qcStatusLabel,
    issuesFound,
    autoFixed,
    manualRequired,
    blockedBy,
    contentBefore,
    contentAfter: currentContent,
    durationMs,
    // Only keep failed findings that have detail text (for UI display)
    findings: allFindings
      .filter(f => !f.passed && f.deduction > 0 && f.detail)
      .map(f => ({
        sub: f.sub, layer: f.layer, deduction: f.deduction, detail: f.detail, severity: f.severity,
        quote: (f as any).quote, suggestion: (f as any).suggestion,
      })),
  };
}

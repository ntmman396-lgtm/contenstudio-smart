// ─── Rescore Engine — Full 3-Layer Re-evaluation ────────────
// Runs the FULL deterministic QC pipeline (L1 + L2 + L3 Safety) on the current content.
// When user edits and re-runs, scores are re-evaluated and blocks are cleared if fixed.
// Guarantees: same content → same score.

import { getGeneratedArticles, updateArticleInStorage } from '@/lib/storage';
import { runQC } from './engine';
import { type QCGrade } from './section-config';

// ─── TYPES ──────────────────────────────────────────────────

export interface RescoreResult {
  previous_score: number;
  new_score: number;
  score_delta: number;
  previous_grade: QCGrade;
  new_grade: QCGrade;
  previous_status: string;
  new_status: string;
  // Per-layer
  previous_tech: number;
  new_tech: number;
  previous_content: number;
  new_content: number;
  // Layer 3
  previous_fsi: number | undefined;
  new_fsi: number | undefined;
  previous_decision: string | undefined;
  new_decision: string | undefined;
  // Details
  resolved_issues: any[];
  remaining_issues: any[];
  blocks_cleared: boolean;
}

// ─── RESCORE ENGINE ─────────────────────────────────────────

export async function rescoreArticle(articleId: string, _editorUserId: string): Promise<RescoreResult> {
  // 1. Load article from DB
  const articles = await getGeneratedArticles();
  const article = articles.find(a => a.id === articleId);
  if (!article) throw new Error("Article not found in DB");

  // 2. Remember previous scores
  const previousTech = article.qcTechScore?.total ?? 0;
  const previousContent = article.qcContentScore?.total ?? 0;
  const previousScore = article.qcScore ?? 0;
  const previousGrade = (article.qcGrade ?? 'E') as QCGrade;
  const previousFsi = article.qcFinalSafetyIndex;
  const previousDecision = article.qcDecision;
  const previousStatus = article.status || 'pending_review';
  const wasSyncBlocked = article.qcSyncBlocked ?? false;

  // 3. Run FULL deterministic QC (L1 + L2) on current content
  const qcResult = await runQC(articleId, { triggeredBy: 'rerun', articleOverride: article });

  // 4. Compute L1/L2 scores
  const newTech = qcResult.techScore.total;
  const newContent = qcResult.contentScore.total;
  const newScore = qcResult.scoreTotal;
  const newGrade = qcResult.overallGrade;

  // 5. Re-run Layer 3 Safety pipeline
  let newFsi: number | undefined = previousFsi;
  let newDecision: string | undefined = previousDecision;
  let newRiskScore: number | undefined = article.qcRiskScore;
  let newSafetyScore: number | undefined = article.qcSafetyScore;
  let newRiskLevel: string | undefined = article.qcRiskLevel;
  let isSafetyBlocked = false;
  let safetyBlockReason = '';

  try {
    const { SafetyQCEngine } = await import('@/lib/qc/safety-engine');
    const safetyEngine = new SafetyQCEngine();
    // Pass updated content from QC auto-fix
    const articleWithNewContent = { ...article, content: qcResult.contentAfter || article.content };
    const safetyReport = await safetyEngine.runFullPipeline(articleId, { articleOverride: articleWithNewContent });

    newRiskScore = safetyReport.risk_score;
    newSafetyScore = safetyReport.safety_score;
    newFsi = safetyReport.final_safety_index;
    newDecision = safetyReport.decision;
    newRiskLevel = safetyReport.risk_level;
    isSafetyBlocked = safetyReport.isHardBlocked ?? false;
    safetyBlockReason = safetyReport.blockReason || '';
  } catch (safetyErr) {
    console.warn('Layer 3 re-run failed, keeping previous safety scores:', safetyErr);
  }

  // 6. Determine new status — re-evaluate from scratch
  let newStatus: string;
  if (newGrade === 'A') {
    newStatus = 'approved';
  } else if (newGrade === 'B') {
    newStatus = 'ready_for_review';
  } else if (newGrade === 'C') {
    newStatus = 'needs_improvement';
  } else {
    newStatus = 'rework_required';
  }

  // 7. Re-evaluate sync block — CLEAR if issues resolved
  let newSyncBlocked = false;
  let newBlockedReason = '';

  // L1/L2 floor violations
  if (qcResult.syncBlocked) {
    // Only keep block for low grades
    if (newGrade !== 'A' && newGrade !== 'B') {
      newSyncBlocked = true;
      newBlockedReason = qcResult.blockedReason || 'Vi phạm ngưỡng tối thiểu';
      newStatus = 'rework_required';
    }
  }

  // Safety hard block
  if (isSafetyBlocked) {
    newSyncBlocked = true;
    newBlockedReason = safetyBlockReason || 'Safety hard block';
    newStatus = 'rework_required';
  }

  const blockCleared = wasSyncBlocked && !newSyncBlocked;

  // 8. Identify resolved vs remaining issues
  const resolvedIssues: any[] = [];
  const remainingIssues = qcResult.manualRequired;

  const previousIssueCount = article.qcManualIssues ?? 0;
  if (previousIssueCount > remainingIssues.length) {
    const resolved = previousIssueCount - remainingIssues.length;
    for (let i = 0; i < resolved; i++) {
      resolvedIssues.push({ rule_code: 'RESOLVED', passed: true, detail: 'Issue resolved' });
    }
  }

  // 9. Persist updated scores to DB
  const updatedArticle = {
    ...article,
    content: qcResult.contentAfter || article.content,
    qcScore: newScore,
    qcGrade: newGrade,
    qcTechScore: qcResult.techScore,
    qcTechGrade: qcResult.techGrade,
    qcContentScore: qcResult.contentScore,
    qcContentGrade: qcResult.contentGrade,
    qcContentReviewerNote: qcResult.contentReviewerNote,
    qcAutoFixes: qcResult.autoFixed.length,
    qcManualIssues: remainingIssues.length,
    qcLastRun: new Date().toISOString(),
    qcBadge: newGrade === 'A' ? 'high_quality' as const :
             newGrade === 'B' ? 'good' as const :
             newGrade === 'C' ? 'needs_work' as const :
             newGrade === 'D' ? 'poor' as const : 'failed' as const,
    status: newStatus,
    // Layer 3
    qcRiskScore: newRiskScore,
    qcSafetyScore: newSafetyScore,
    qcFinalSafetyIndex: newFsi,
    qcDecision: newDecision,
    qcRiskLevel: newRiskLevel,
    qcFindings: qcResult.findings,
    // Sync block — cleared if issues resolved
    qcSyncBlocked: newSyncBlocked || undefined,
    qcBlockedReason: newBlockedReason || undefined,
    qcBlockedBy: newSyncBlocked ? qcResult.blockedBy : undefined,
  };

  try {
    await updateArticleInStorage(updatedArticle as any);
  } catch (e) {
    console.warn('Failed to persist rescore results:', e);
  }

  return {
    previous_score: previousScore,
    new_score: newScore,
    score_delta: newScore - previousScore,
    previous_grade: previousGrade,
    new_grade: newGrade,
    previous_status: previousStatus,
    new_status: newStatus,
    previous_tech: previousTech,
    new_tech: newTech,
    previous_content: previousContent,
    new_content: newContent,
    previous_fsi: previousFsi,
    new_fsi: newFsi,
    previous_decision: previousDecision,
    new_decision: newDecision,
    resolved_issues: resolvedIssues,
    remaining_issues: remainingIssues,
    blocks_cleared: blockCleared,
  };
}

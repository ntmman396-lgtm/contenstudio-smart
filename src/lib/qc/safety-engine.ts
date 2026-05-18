import { runLayer1TechQC, EditLocation } from './layers/layer1-tech';
import { runLayer2MedicalQC } from './layers/layer2-medical';
import { runLayer3aRiskPrecheck, runLayer3bSafetyEnforcement } from './layers/layer3-safety';
import { 
  FinalQCReport, RiskAnalysisResult, SafetyAnalysisResult, QCDecision,
  InternalLinkInfo, LinkSiloAnalysis, LayerEditHistory
} from './safety-types';
import { getGeneratedArticles } from '@/lib/storage';
import { getActiveRulesMap, type UnifiedRule } from '@/lib/qc/rule-registry';

export interface QCOptions {
  skipAutoFix?: boolean;
  articleOverride?: any;
}

// ─── DECISION ENGINE ────────────────────────────────────────

function evaluateDecision(
  risk: RiskAnalysisResult, 
  safety: SafetyAnalysisResult
): { decision: QCDecision, finalIndex: number, isHardBlocked: boolean, blockReason?: string } {
  const final_safety_index = safety.safety_score - (risk.risk_score * 0.5); // was 0.8, now 0.5 — risk penalizes less
  
  if (risk.dangerous_claim) {
    return { decision: 'REJECT', finalIndex: final_safety_index, isHardBlocked: true, blockReason: 'Dangerous claim detected' };
  }
  if (risk.conflicting_dosage) {
    return { decision: 'REJECT', finalIndex: final_safety_index, isHardBlocked: true, blockReason: 'Conflicting dosage detected' };
  }
  if (final_safety_index < -10) { // was < 0, now < -10
    return { decision: 'REJECT', finalIndex: final_safety_index, isHardBlocked: true, blockReason: 'Final safety index < -10' };
  }
  if (final_safety_index < 20) { // was < 30, now < 20
    return { decision: 'NEEDS_REVISION', finalIndex: final_safety_index, isHardBlocked: false };
  }
  if (final_safety_index < 45) { // was < 60, now < 45
    return { decision: 'REVIEW', finalIndex: final_safety_index, isHardBlocked: false };
  }
  return { decision: 'SAFE_TO_PUBLISH', finalIndex: final_safety_index, isHardBlocked: false };
}

// ─── INTERNAL LINK SILO ANALYZER ────────────────────────────

/**
 * Silo mapping for Long Châu content categories.
 * Each silo groups related topics so internal links should 
 * primarily connect within the same silo cluster.
 */
const SILO_MAP: Record<string, string[]> = {
  'benh-ly':    ['benh', 'trieu-chung', 'chan-doan', 'dieu-tri', 'nguyen-nhan', 'phong-ngua'],
  'duoc-pham':  ['thuoc', 'duoc-chat', 'duoc-lieu', 'thanh-phan', 'tac-dung-phu', 'cach-dung'],
  'dinh-duong': ['thuc-pham', 'dinh-duong', 'vitamin', 'khoang-chat', 'che-do-an'],
  'suc-khoe':   ['suc-khoe', 'loi-song', 'tap-luyen', 'tam-ly', 'giac-ngu'],
  'tiem-chung': ['vaccine', 'tiem-chung', 'phong-benh', 'lich-tiem'],
};

function detectSiloFromUrl(href: string): string {
  const lower = href.toLowerCase();
  for (const [silo, keywords] of Object.entries(SILO_MAP)) {
    if (keywords.some(kw => lower.includes(kw))) return silo;
  }
  return 'other';
}

function findSectionAtPosition(html: string, position: number): string {
  const headingRegex = /<h[23][^>]*>(.*?)<\/h[23]>/gi;
  let lastHeading = 'Intro / Sapo';
  let match;
  while ((match = headingRegex.exec(html)) !== null) {
    if (match.index > position) break;
    lastHeading = match[1].replace(/<[^>]+>/g, '').trim();
  }
  return lastHeading;
}

function estimateLineNumber(html: string, position: number): number {
  return html.substring(0, position).split('\n').length;
}

function analyzeInternalLinks(content: string, siteId?: string): LinkSiloAnalysis {
  const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
  const links: InternalLinkInfo[] = [];
  const distribution_by_section: Record<string, number> = {};
  const silo_coverage: Record<string, number> = {};
  const issues: string[] = [];
  let match;

  // Extract all internal links
  while ((match = linkRegex.exec(content)) !== null) {
    const href = match[1];
    const anchor = match[2].replace(/<[^>]+>/g, '').trim();
    const section = findSectionAtPosition(content, match.index);
    const lineApprox = estimateLineNumber(content, match.index);
    const silo = detectSiloFromUrl(href);

    links.push({ anchor, href, section, lineApprox, silo_category: silo });
    
    distribution_by_section[section] = (distribution_by_section[section] || 0) + 1;
    silo_coverage[silo] = (silo_coverage[silo] || 0) + 1;

    if (siteId) {
      if (siteId === 'nha-thuoc' && (href.includes('tiemchunglongchau') || href.includes('tiemchung'))) {
        issues.push(`Lỗi vi phạm nguyên tắc chéo domain: Bài viết thuộc Nhà Thuốc nhưng lại chứa link sang Tiêm Chủng ("${href}").`);
      }
      if (siteId === 'tiem-chung' && (href.includes('nhathuoclongchau') || href.includes('nhathuoc'))) {
        issues.push(`Lỗi vi phạm nguyên tắc chéo domain: Bài viết thuộc Tiêm Chủng nhưng lại chứa link sang Nhà Thuốc ("${href}").`);
      }
    }
  }

  // ─── Analyze distribution balance ───
  const sectionNames = Object.keys(distribution_by_section);
  const sectionCounts = Object.values(distribution_by_section);
  
  // Count how many H2 sections exist in the article
  const h2Regex = /<h2[^>]*>(.*?)<\/h2>/gi;
  const totalH2Sections: string[] = [];
  let h2Match;
  while ((h2Match = h2Regex.exec(content)) !== null) {
    totalH2Sections.push(h2Match[1].replace(/<[^>]+>/g, '').trim());
  }

  // ─── Rule: Min 5, Max 10 internal links ───
  if (links.length < 5) {
    issues.push(`Bài viết chỉ có ${links.length} internal link — tối thiểu cần 5 link.`);
  }
  if (links.length > 10) {
    issues.push(`Bài viết có ${links.length} internal link — tối đa chỉ nên 10 link.`);
  }

  // ─── Rule: Anchor text capitalization ───
  // Internal link anchor text should NOT capitalize first letter if it's not at the start of a sentence.
  links.forEach(link => {
    const anchor = link.anchor;
    if (!anchor || anchor.length === 0) return;
    
    // Check if first char is uppercase but it's NOT a proper noun pattern (single capital followed by lowercase)
    const firstChar = anchor[0];
    if (firstChar === firstChar.toUpperCase() && firstChar !== firstChar.toLowerCase()) {
      // Find context: is this anchor at the beginning of a sentence?
      const anchorEscaped = anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const contextRegex = new RegExp(`([.!?]\\s*|^|<p[^>]*>\\s*|<li[^>]*>\\s*)<a[^>]*>\\s*${anchorEscaped}`, 'i');
      const isStartOfSentence = contextRegex.test(content);
      
      if (!isStartOfSentence) {
        issues.push(`Anchor "${anchor}" viết hoa chữ cái đầu nhưng không phải đầu câu → nên viết thường: "${anchor[0].toLowerCase() + anchor.slice(1)}"`);
      }
    }
  });

  // Check if links are evenly distributed
  const sectionsWithLinks = new Set(sectionNames);
  const sectionsWithoutLinks = totalH2Sections.filter(s => !sectionsWithLinks.has(s));
  
  if (sectionsWithoutLinks.length > 0) {
    issues.push(`${sectionsWithoutLinks.length} section(s) không có internal link: ${sectionsWithoutLinks.join(', ')}`);
  }

  // Check if any section is overloaded
  if (sectionCounts.length > 0) {
    const maxLinks = Math.max(...sectionCounts);
    const avgLinks = links.length / Math.max(totalH2Sections.length, 1);
    if (maxLinks > avgLinks * 2.5 && links.length > 3) {
      const overloaded = sectionNames.filter((_, i) => sectionCounts[i] > avgLinks * 2.5);
      issues.push(`Link tập trung quá nhiều ở: ${overloaded.join(', ')} (> 2.5x trung bình)`);
    }
  }

  // Check silo consistency
  const siloKeys = Object.keys(silo_coverage).filter(k => k !== 'other');
  if (siloKeys.length > 2) {
    issues.push(`Link phân tán qua ${siloKeys.length} silo khác nhau (${siloKeys.join(', ')}). Nên tập trung vào 1-2 silo chính theo cấu trúc cilo.`);
  }

  const is_balanced = issues.length === 0;

  return {
    total_links: links.length,
    links,
    distribution_by_section,
    silo_coverage,
    issues,
    is_balanced,
  };
}

// ─── DATA LOADERS ───────────────────────────────────────────

const loadArticle = async (articleId: string) => {
  const articles = await getGeneratedArticles();
  const article = articles.find(a => a.id === articleId);
  if (!article) throw new Error("Article not found in DB");
  return article;
};

const loadActiveRulesAndConfig = (templateId: string) => {
  const allRules = getActiveRulesMap(templateId);
  
  const techRules = new Map<string, UnifiedRule>();
  const contentRules = new Map<string, UnifiedRule>();
  
  for (const [code, rule] of Array.from(allRules)) {
    if (rule.section === 'TECH') {
      techRules.set(code, rule);
    } else {
      contentRules.set(code, rule);
    }
  }

  return { techRules, contentRules };
};

// ─── MAIN ENGINE ────────────────────────────────────────────

export class SafetyQCEngine {
  async runFullPipeline(articleId: string, options: QCOptions = {}): Promise<FinalQCReport> {
    const article = options.articleOverride ? options.articleOverride : await loadArticle(articleId);
    const { techRules, contentRules } = loadActiveRulesAndConfig(article.templateId);
    
    const contentOriginal = article.content;

    // ─── Layer 1: Technical & Format (may auto-fix spelling/formatting) ───
    const l1Result = await runLayer1TechQC(contentOriginal, techRules, options.skipAutoFix, article);
    
    // ─── Layer 2: Medical Content (may fix dangerous claims ONLY) ───
    const l2Result = await runLayer2MedicalQC(l1Result.content, contentRules, options.skipAutoFix, article);
    const contentAfterAutoFix = l2Result.content;

    // ─── Layer 3a: Risk Precheck (READ-ONLY — does NOT modify content) ───
    // Feed original content to 3A so it evaluates what was actually written,
    // not what L1/L2 already cleaned up.
    const riskResult = await runLayer3aRiskPrecheck(contentOriginal);

    // ─── Layer 3b: Safety Enforcement (READ-ONLY) ───
    const safetyResult = await runLayer3bSafetyEnforcement(contentAfterAutoFix);

    // ─── Internal Link Silo Analysis ───
    const linkAnalysis = analyzeInternalLinks(contentAfterAutoFix, article.siteId);

    // ─── Decision Engine ───
    const decisionOutput = evaluateDecision(riskResult, safetyResult);

    // ─── Aggregate errors/warnings ───
    const errors: string[] = [];
    const warnings: string[] = [];
    
    l1Result.manualRequired.forEach(m => {
      if (m.severity === 'critical') errors.push(m.rule_code + ": " + m.name);
      else warnings.push(m.rule_code + ": " + m.name);
    });
    
    l2Result.manualRequired.forEach(m => {
      if (m.severity === 'critical') errors.push(m.rule_code + ": " + m.name);
      else warnings.push(m.rule_code + ": " + m.name);
    });

    riskResult.flags.forEach(f => errors.push("RISK FLAG: " + f));
    safetyResult.missing_elements.forEach(f => warnings.push("MISSING SAFETY ELEMENT: " + f));

    // Link issues as warnings
    linkAnalysis.issues.forEach(issue => warnings.push("LINK SILO: " + issue));

    // ─── Build Edit History ───
    const editHistory: LayerEditHistory[] = [
      {
        layer: 'tech',
        total_edits: l1Result.autoFixed.length,
        edits: l1Result.autoFixed,
      },
      {
        layer: 'content',
        total_edits: l2Result.autoFixed.length,
        edits: l2Result.autoFixed,
      },
    ];

    return {
      technical_score: l1Result.score.total,
      medical_score: l2Result.score.total,
      risk_score: riskResult.risk_score,
      safety_score: safetyResult.safety_score,
      final_safety_index: decisionOutput.finalIndex,
      risk_level: riskResult.risk_level,
      errors,
      warnings,
      decision: decisionOutput.decision,
      isHardBlocked: decisionOutput.isHardBlocked,
      blockReason: decisionOutput.blockReason,
      details: {
        risk: riskResult,
        safety: safetyResult,
      },
      editHistory,
      linkAnalysis,
      contentOriginal,
      contentAfterAutoFix,
    };
  }

  // Standalone methods for phased workflow
  async evaluateRiskStandalone(content: string): Promise<RiskAnalysisResult> {
    return await runLayer3aRiskPrecheck(content);
  }

  async evaluateSafetyStandalone(content: string): Promise<SafetyAnalysisResult> {
    return await runLayer3bSafetyEnforcement(content);
  }

  analyzeLinks(content: string): LinkSiloAnalysis {
    return analyzeInternalLinks(content);
  }
}

// ─── Layer 2: Content/Medical QC — 100% Deterministic ────────
// NO Math.random(). All checks use regex/counting on actual content.
// NOW READS ALL deduction/max_deduction/is_active FROM rule-registry.

import type { EditLocation } from './layer1-tech';
import type { UnifiedRule } from '@/lib/qc/rule-registry';
import { prisma } from '@/lib/prisma';

export interface ContentScore {
  total: number;
  accuracy: number;   // max 40
  depth: number;      // max 30
  citation: number;   // max 20
  tone: number;       // max 10
}

interface Finding {
  rule_code: string;
  passed: boolean;
  deduction: number;
  severity: string;
  layer: string;
  sub: string;
  detail?: string;
}

interface L2Result {
  content: string;
  contentOriginal: string;
  score: ContentScore;
  autoFixed: EditLocation[];
  manualRequired: any[];
  issuesFound: any[];
  findings: Finding[];
}

// ─── Helpers ────────────────────────────────────────────────
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function findSectionAtPosition(content: string, position: number): string {
  const headings = [...content.matchAll(/<h[23][^>]*>(.*?)<\/h[23]>/gi)];
  let currentSection = 'Giới thiệu';
  for (const m of headings) {
    if (m.index !== undefined && m.index <= position) {
      currentSection = m[1].replace(/<[^>]+>/g, '').trim();
    }
  }
  return currentSection;
}

function approxLine(content: string, position: number): number {
  return content.substring(0, position).split('\n').length;
}

// ─── Helper: get rule config or return disabled stub ────────
function getRule(rules: Map<string, UnifiedRule>, code: string): UnifiedRule & { _exists: boolean } {
  const rule = rules.get(code);
  if (rule) return { ...rule, _exists: true };
  return {
    code, name: '', description: '', section: 'CONTENT', sub_dimension: 'accuracy',
    deduction: 0, max_deduction: 0, severity: 'info', is_active: false,
    is_system: false, auto_fixable: false, fix_instruction: '',
    applies_to: ['*'], check_type: 'structural', _exists: false,
  };
}

// ═══════════════════════════════════════════════════════════════
// DETERMINISTIC CONTENT CHECKS — all read from rules config
// ═══════════════════════════════════════════════════════════════

// ─── Accuracy: 40 điểm ─────────────────────────────────────
function checkAccuracy(content: string, rules: Map<string, UnifiedRule>, article?: any): { score: number; findings: Finding[]; manualRequired: any[] } {
  let score = 40;
  const findings: Finding[] = [];
  const manualRequired: any[] = [];

  const plainText = stripHtml(content);

  // 1. Has references? (minimal requirement for medical content)
  const rRef = getRule(rules, 'C-ACC-REF');
  if (rRef.is_active) {
    const refs = article?.references || [];
    if (refs.length === 0) {
      const deduction = rRef.max_deduction;
      score -= deduction;
      findings.push({ rule_code: 'C-ACC-REF', passed: false, deduction, severity: rRef.severity, layer: 'content', sub: 'accuracy', detail: 'Không có nguồn tham khảo' });
      manualRequired.push({ name: 'Thiếu nguồn tham khảo', text: 'Bài viết y tế bắt buộc phải có references', severity: rRef.severity, deduction, layer: 'content', sub: 'accuracy', suggestion: 'Thêm ít nhất 3 nguồn uy tín' });
    } else if (refs.length < 3) {
      const deduction = rRef.deduction;
      score -= deduction;
      findings.push({ rule_code: 'C-ACC-REF', passed: false, deduction, severity: 'warning', layer: 'content', sub: 'accuracy', detail: `Chỉ có ${refs.length} nguồn (cần ≥ 3)` });
      manualRequired.push({ name: 'Ít nguồn tham khảo', text: `Chỉ ${refs.length} nguồn — nên có ≥ 3`, severity: 'warning', deduction, layer: 'content', sub: 'accuracy', suggestion: 'Bổ sung thêm nguồn uy tín' });
    } else {
      findings.push({ rule_code: 'C-ACC-REF', passed: true, deduction: 0, severity: 'info', layer: 'content', sub: 'accuracy' });
    }
  }

  // 2. Competitor mentions — forbidden
  const rComp = getRule(rules, 'C-ACC-COMP');
  if (rComp.is_active) {
    const competitors = /(?:pharmacity|guardian|an khang|medicare|phano|trung sơn|bs mart|bsmart)/gi;
    const competitorMatches = [...plainText.matchAll(competitors)];
    if (competitorMatches.length > 0) {
      const deduction = rComp.max_deduction;
      score -= deduction;
      findings.push({ rule_code: 'C-ACC-COMP', passed: false, deduction, severity: rComp.severity, layer: 'content', sub: 'accuracy', detail: `Nhắc tên đối thủ: ${competitorMatches.map(m => m[0]).join(', ')}` });
      manualRequired.push({ name: 'Nhắc tên đối thủ', text: `Đề cập: ${competitorMatches.map(m => m[0]).join(', ')}`, severity: rComp.severity, deduction, layer: 'content', sub: 'accuracy', suggestion: 'Xóa toàn bộ tên đối thủ cạnh tranh' });
    } else {
      findings.push({ rule_code: 'C-ACC-COMP', passed: true, deduction: 0, severity: 'info', layer: 'content', sub: 'accuracy' });
    }
  }

  // 3. Factual hedging — content should use qualified language for claims
  const rAbs = getRule(rules, 'C-ACC-ABS');
  if (rAbs.is_active) {
    const absoluteClaims = /(?:chắc chắn|100%|tuyệt đối|luôn luôn|không bao giờ)\s+(?:chữa|khỏi|an toàn|hiệu quả|thành công)/gi;
    const absMatches = [...plainText.matchAll(absoluteClaims)];
    if (absMatches.length > 0) {
      const deduction = Math.min(absMatches.length * rAbs.deduction, rAbs.max_deduction);
      score -= deduction;
      findings.push({ rule_code: 'C-ACC-ABS', passed: false, deduction, severity: rAbs.severity, layer: 'content', sub: 'accuracy', detail: `${absMatches.length} claim tuyệt đối` });
      manualRequired.push({ name: 'Claim tuyệt đối', text: `${absMatches.length} câu dùng "chắc chắn/100%/tuyệt đối"`, severity: rAbs.severity, deduction, layer: 'content', sub: 'accuracy', suggestion: 'Thêm qualifier: "có thể", "nghiên cứu cho thấy"...' });
    } else {
      findings.push({ rule_code: 'C-ACC-ABS', passed: true, deduction: 0, severity: 'info', layer: 'content', sub: 'accuracy' });
    }
  }

  // 4. Statistics must be cited
  const rStats = getRule(rules, 'C-ACC-STATS');
  if (rStats.is_active) {
    // Looks for numbers with %, or words like "triệu/nghìn/ngàn/người/ca/bệnh nhân" preceded by numbers
    const statRegex = /\b\d+(?:\.\d+)?%|\b\d+(?:\.\d+)?\s*(?:triệu|nghìn|ngàn|người|ca\b|bệnh nhân)/gi;
    const statsMatches = [...plainText.matchAll(statRegex)];
    let uncitedStats = 0;
    
    // Check a sliding window of ~100 characters around the stat for citation markers
    const citationKeywords = /\[\d+\]|theo|nghiên cứu|báo cáo|thống kê|khảo sát|who|bộ y tế|cdc|fda/i;
    
    statsMatches.forEach(match => {
      const index = match.index || 0;
      const start = Math.max(0, index - 100);
      const end = Math.min(plainText.length, index + match[0].length + 100);
      const context = plainText.substring(start, end);
      
      if (!citationKeywords.test(context)) {
        uncitedStats++;
      }
    });

    if (uncitedStats > 0) {
      const deduction = Math.min(uncitedStats * rStats.deduction, rStats.max_deduction);
      score -= deduction;
      findings.push({ rule_code: 'C-ACC-STATS', passed: false, deduction, severity: rStats.severity, layer: 'content', sub: 'accuracy', detail: `${uncitedStats} số liệu thiếu nguồn trích dẫn rõ ràng` });
      manualRequired.push({ name: 'Số liệu thiếu nguồn', text: `${uncitedStats} câu có số liệu (%, tỷ lệ, số lượng) nhưng không có cụm từ trích dẫn nguồn`, severity: rStats.severity, deduction, layer: 'content', sub: 'accuracy', suggestion: 'Ghi rõ nguồn (ví dụ: "Theo Bộ Y tế..." hoặc thêm "[1]")' });
    } else if (statsMatches.length > 0) {
      findings.push({ rule_code: 'C-ACC-STATS', passed: true, deduction: 0, severity: 'info', layer: 'content', sub: 'accuracy', detail: `Đã dẫn nguồn cho ${statsMatches.length} số liệu` });
    } else {
      findings.push({ rule_code: 'C-ACC-STATS', passed: true, deduction: 0, severity: 'info', layer: 'content', sub: 'accuracy' });
    }
  }

  return { score: Math.max(score, 0), findings, manualRequired };
}

// ─── Depth: 30 điểm ────────────────────────────────────────
async function checkDepth(content: string, rules: Map<string, UnifiedRule>, article?: any): Promise<{ score: number; findings: Finding[]; manualRequired: any[] }> {
  let score = 30;
  const findings: Finding[] = [];
  const manualRequired: any[] = [];

  const plainText = stripHtml(content);
  const wordCount = plainText.split(/\s+/).filter(w => w.length > 0).length;

  // Template-specific word count defaults
  const TEMPLATE_WORD_DEFAULTS: Record<string, { min: number, rec: number }> = {
    'gsk-blog':       { min: 1200, rec: 1800 },
    'benh-ly':        { min: 1800, rec: 2500 },
    'hoi-dap-bac-si': { min: 200,  rec: 500  },
    'hoi-dap':        { min: 200,  rec: 500  },
    'duoc-chat':      { min: 1500, rec: 2000 },
  };

  const templateDefaults = TEMPLATE_WORD_DEFAULTS[article?.templateId] || { min: 800, rec: 1200 };
  let minWords = templateDefaults.min;
  let recWords = templateDefaults.rec;
  
  // Override from DB if available
  if (article && article.templateId) {
    try {
      const dbTemp = await prisma.template.findUnique({ where: { id: article.templateId } });
      if (dbTemp && dbTemp.estimatedWords) {
        const est = JSON.parse(dbTemp.estimatedWords);
        if (est.min) minWords = est.min;
        if (est.max) recWords = est.max;
      }
    } catch(e) {}
  }

  // 1. Word count — proportional deduction
  const rWords = getRule(rules, 'C-DEP-WORDS');
  if (rWords.is_active) {
    if (wordCount < minWords) {
      // Scale deduction: severely short = full penalty, slightly short = less
      const ratio = wordCount / minWords; // e.g. 0.8 = 80% of minimum
      const scaledDeduction = Math.round(rWords.max_deduction * (1 - ratio));
      const deduction = Math.min(scaledDeduction, rWords.max_deduction);
      score -= deduction;
      findings.push({ rule_code: 'C-DEP-WORDS', passed: false, deduction, severity: rWords.severity, layer: 'content', sub: 'depth', detail: `${wordCount} từ (cần ≥ ${minWords} theo template, thiếu ${minWords - wordCount} từ)` });
      if (ratio < 0.7) {
        // Only flag as manual issue if significantly short (< 70% of minimum)
        manualRequired.push({ name: 'Bài quá ngắn', text: `${wordCount} từ — template yêu cầu ≥ ${minWords}`, severity: rWords.severity, deduction, layer: 'content', sub: 'depth', suggestion: 'Bổ sung nội dung chi tiết hơn' });
      }
    } else if (wordCount < recWords) {
      const deduction = rWords.deduction;
      score -= deduction;
      findings.push({ rule_code: 'C-DEP-WORDS', passed: false, deduction, severity: 'info', layer: 'content', sub: 'depth', detail: `${wordCount} từ (đạt tối thiểu, khuyến nghị ≥ ${recWords})` });
    } else {
      findings.push({ rule_code: 'C-DEP-WORDS', passed: true, deduction: 0, severity: 'info', layer: 'content', sub: 'depth', detail: `${wordCount} từ ✓` });
    }
  }

  // 2. Section count (H2) — skip for Q&A templates (they use <strong> labels, not H2)
  const rSect = getRule(rules, 'C-DEP-SECT');
  const isQATemplate = article?.templateId === 'hoi-dap-bac-si' || article?.templateId === 'hoi-dap';
  if (rSect.is_active) {
    if (isQATemplate) {
      // Q&A articles don't use H2 headings — auto-pass
      findings.push({ rule_code: 'C-DEP-SECT', passed: true, deduction: 0, severity: 'info', layer: 'content', sub: 'depth', detail: 'Bài hỏi đáp — bỏ qua yêu cầu H2' });
    } else {
      const h2Count = [...content.matchAll(/<h2[^>]*>/gi)].length;
      const minSections = minWords >= 800 ? 3 : minWords >= 400 ? 2 : 1;
      if (h2Count < minSections) {
        const deduction = rSect.max_deduction;
        score -= deduction;
        findings.push({ rule_code: 'C-DEP-SECT', passed: false, deduction, severity: rSect.severity, layer: 'content', sub: 'depth', detail: `Chỉ ${h2Count} section H2 (cần ≥ ${minSections})` });
        manualRequired.push({ name: 'Thiếu section', text: `Chỉ có ${h2Count} section H2`, severity: rSect.severity, deduction, layer: 'content', sub: 'depth', suggestion: 'Bổ sung thêm section để bài chi tiết hơn' });
      } else {
        findings.push({ rule_code: 'C-DEP-SECT', passed: true, deduction: 0, severity: 'info', layer: 'content', sub: 'depth' });
      }
    }
  }

  // 3. H3 subsections (deeper structure) — skip for Q&A
  const rH3 = getRule(rules, 'C-DEP-H3');
  if (rH3.is_active) {
    if (isQATemplate) {
      findings.push({ rule_code: 'C-DEP-H3', passed: true, deduction: 0, severity: 'info', layer: 'content', sub: 'depth', detail: 'Bài hỏi đáp — bỏ qua yêu cầu H3' });
    } else {
      const h2Count = [...content.matchAll(/<h2[^>]*>/gi)].length;
      const h3Count = [...content.matchAll(/<h3[^>]*>/gi)].length;
      if (h3Count === 0 && h2Count >= 3) {
        const deduction = rH3.max_deduction;
        score -= deduction;
        findings.push({ rule_code: 'C-DEP-H3', passed: false, deduction, severity: rH3.severity, layer: 'content', sub: 'depth', detail: 'Không có H3 subsections' });
      } else {
        findings.push({ rule_code: 'C-DEP-H3', passed: true, deduction: 0, severity: 'info', layer: 'content', sub: 'depth' });
      }
    }
  }

  // 4. Lists usage (<ul>/<ol>)
  const rList = getRule(rules, 'C-DEP-LIST');
  if (rList.is_active) {
    const listCount = [...content.matchAll(/<(?:ul|ol)[^>]*>/gi)].length;
    if (listCount === 0 && wordCount >= minWords) {
      const deduction = rList.deduction;
      score -= deduction;
      findings.push({ rule_code: 'C-DEP-LIST', passed: false, deduction, severity: rList.severity, layer: 'content', sub: 'depth', detail: 'Không có danh sách (ul/ol)' });
    } else {
      findings.push({ rule_code: 'C-DEP-LIST', passed: true, deduction: 0, severity: 'info', layer: 'content', sub: 'depth' });
    }
  }

  return { score: Math.max(score, 0), findings, manualRequired };
}

// ─── Citation: 20 điểm ─────────────────────────────────────
function checkCitation(rules: Map<string, UnifiedRule>, article?: any): { score: number; findings: Finding[]; manualRequired: any[] } {
  let score = 20;
  const findings: Finding[] = [];
  const manualRequired: any[] = [];

  const refs: string[] = article?.references || [];
  
  // 0. Check existence first
  const rExist = getRule(rules, 'C-CIT-EXIST');
  if (rExist.is_active && refs.length === 0) {
    score = 0;
    findings.push({ rule_code: 'C-CIT-EXIST', passed: false, deduction: rExist.max_deduction, severity: rExist.severity, layer: 'content', sub: 'citation', detail: 'Không có references' });
    return { score, findings, manualRequired };
  }

  if (refs.length > 0) {
    findings.push({ rule_code: 'C-CIT-EXIST', passed: true, deduction: 0, severity: 'info', layer: 'content', sub: 'citation' });
  }

  // 1. References have access date?
  const rDate = getRule(rules, 'C-CIT-DATE');
  if (rDate.is_active) {
    const hasAccessDate = refs.filter(r => /truy cập ngày|accessed/i.test(r));
    if (hasAccessDate.length < refs.length * 0.5) {
      const deduction = rDate.deduction;
      score -= deduction;
      findings.push({ rule_code: 'C-CIT-DATE', passed: false, deduction, severity: rDate.severity, layer: 'content', sub: 'citation', detail: `${refs.length - hasAccessDate.length}/${refs.length} nguồn thiếu ngày truy cập` });
      manualRequired.push({ name: 'Nguồn thiếu ngày truy cập', text: `${refs.length - hasAccessDate.length} nguồn chưa ghi ngày truy cập`, severity: rDate.severity, deduction, layer: 'content', sub: 'citation', suggestion: 'Thêm "(truy cập ngày DD/MM/YYYY)" cho nguồn website' });
    } else {
      findings.push({ rule_code: 'C-CIT-DATE', passed: true, deduction: 0, severity: 'info', layer: 'content', sub: 'citation' });
    }
  }

  // 2. References contain deep links (not just homepage)?
  const rDeep = getRule(rules, 'C-CIT-DEEP');
  if (rDeep.is_active) {
    const urlRefs = refs.filter(r => /https?:\/\//.test(r));
    const homepageOnly = urlRefs.filter(r => {
      const urlMatch = r.match(/https?:\/\/[^\s)]+/);
      if (!urlMatch) return false;
      const url = urlMatch[0];
      try {
        const parsed = new URL(url);
        return parsed.pathname === '/' || parsed.pathname === '';
      } catch { return false; }
    });
    if (homepageOnly.length > 0) {
      const deduction = Math.min(homepageOnly.length * rDeep.deduction, rDeep.max_deduction);
      score -= deduction;
      findings.push({ rule_code: 'C-CIT-DEEP', passed: false, deduction, severity: rDeep.severity, layer: 'content', sub: 'citation', detail: `${homepageOnly.length} nguồn link về homepage thay vì deep link` });
      manualRequired.push({ name: 'Nguồn link homepage', text: `${homepageOnly.length} nguồn chỉ trỏ trang chủ`, severity: rDeep.severity, deduction, layer: 'content', sub: 'citation', suggestion: 'Thay bằng deep link đến bài viết cụ thể' });
    } else {
      findings.push({ rule_code: 'C-CIT-DEEP', passed: true, deduction: 0, severity: 'info', layer: 'content', sub: 'citation' });
    }
  }

  // 3. Reference domain quality check
  const rTrust = getRule(rules, 'C-CIT-TRUST');
  if (rTrust.is_active) {
    const trustedDomains = ['who.int', 'cdc.gov', 'pubmed.ncbi.nlm.nih.gov', 'ncbi.nlm.nih.gov', 
      'thelancet.com', 'nejm.org', 'bmj.com', 'uptodate.com', 'cochranelibrary.com',
      'mims.com', 'emc.medicines.org.uk', 'mayoclinic.org', 'webmd.com', 'medlineplus.gov'];
    
    const urlRefs = refs.filter(r => /https?:\/\//.test(r));
    const hasTrusted = urlRefs.some(r => trustedDomains.some(d => r.includes(d)));
    if (!hasTrusted && urlRefs.length > 0) {
      const deduction = rTrust.deduction;
      score -= deduction;
      findings.push({ rule_code: 'C-CIT-TRUST', passed: false, deduction, severity: rTrust.severity, layer: 'content', sub: 'citation', detail: 'Không có nguồn từ domain uy tín quốc tế' });
    } else {
      findings.push({ rule_code: 'C-CIT-TRUST', passed: true, deduction: 0, severity: 'info', layer: 'content', sub: 'citation' });
    }
  }

  return { score: Math.max(score, 0), findings, manualRequired };
}

// ─── Tone: 10 điểm ─────────────────────────────────────────
function checkTone(content: string, rules: Map<string, UnifiedRule>): { score: number; findings: Finding[]; autoFixed: EditLocation[]; manualRequired: any[] } {
  let score = 10;
  const findings: Finding[] = [];
  const autoFixed: EditLocation[] = [];
  const manualRequired: any[] = [];
  const plainText = stripHtml(content);

  // 1. Cure claims — strict denylist
  const rCure = getRule(rules, 'C-TONE-CURE');
  if (rCure.is_active) {
    const cureClaims = /(?:chữa khỏi hoàn toàn|khỏi hẳn|100% hiệu quả|chữa trị dứt điểm|đảm bảo khỏi|cam kết chữa)/gi;
    const cureMatches = [...plainText.matchAll(cureClaims)];
    if (cureMatches.length > 0) {
      const deduction = Math.min(cureMatches.length * rCure.deduction, rCure.max_deduction);
      score -= deduction;
      findings.push({ rule_code: 'C-TONE-CURE', passed: false, deduction, severity: rCure.severity, layer: 'content', sub: 'tone', detail: `${cureMatches.length} cure claim: ${cureMatches.map(m => `"${m[0]}"`).join(', ')}` });
      
      // Auto-fix in actual content
      cureMatches.forEach(m => {
        if (m.index !== undefined) {
          autoFixed.push({
            section: findSectionAtPosition(content, m.index),
            lineApprox: approxLine(content, m.index),
            original: m[0],
            fixed: 'hỗ trợ điều trị',
            rule_code: 'C-TONE-CURE'
          });
        }
      });
    } else {
      findings.push({ rule_code: 'C-TONE-CURE', passed: true, deduction: 0, severity: 'info', layer: 'content', sub: 'tone' });
    }
  }

  // 2. Doctor recommendation — medical articles should mention seeing a doctor
  const rDoc = getRule(rules, 'C-TONE-DOC');
  if (rDoc.is_active) {
    const hasDoctorRef = /(?:tham khảo ý kiến|hỏi ý kiến|tư vấn|thăm khám|đi khám|gặp bác sĩ|liên hệ bác sĩ)/i.test(plainText);
    if (!hasDoctorRef) {
      const deduction = rDoc.deduction;
      score -= deduction;
      findings.push({ rule_code: 'C-TONE-DOC', passed: false, deduction, severity: rDoc.severity, layer: 'content', sub: 'tone', detail: 'Chưa có lời khuyên tham khảo ý kiến bác sĩ' });
      manualRequired.push({ name: 'Thiếu tư vấn bác sĩ', text: 'Bài chưa có lời khuyên tham khảo ý kiến bác sĩ', severity: rDoc.severity, deduction, layer: 'content', sub: 'tone', suggestion: 'Thêm: "Nên tham khảo ý kiến bác sĩ trước khi..."' });
    } else {
      findings.push({ rule_code: 'C-TONE-DOC', passed: true, deduction: 0, severity: 'info', layer: 'content', sub: 'tone' });
    }
  }

  return { score: Math.max(score, 0), findings, autoFixed, manualRequired };
}

// ═══════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════

export async function runLayer2MedicalQC(
  content: string,
  rules: Map<string, UnifiedRule>, // NOW: actual rule config map from registry
  skipAutoFix?: boolean,
  article?: any
): Promise<L2Result> {
  const contentOriginal = content;
  let currentContent = content;

  const accuracyResult = checkAccuracy(currentContent, rules, article);
  const depthResult = await checkDepth(currentContent, rules, article);
  const citationResult = checkCitation(rules, article);
  const toneResult = checkTone(currentContent, rules);

  // Apply tone auto-fixes if not skipped
  if (!skipAutoFix && rules.get('C-TONE-CURE')?.is_active) {
    // Replace cure claims
    currentContent = currentContent.replace(/chữa khỏi hoàn toàn/gi, 'hỗ trợ điều trị');
    currentContent = currentContent.replace(/khỏi hẳn/gi, 'cải thiện đáng kể');
    currentContent = currentContent.replace(/100% hiệu quả/gi, 'được nghiên cứu cho thấy hiệu quả');
    currentContent = currentContent.replace(/chữa trị dứt điểm/gi, 'hỗ trợ điều trị');
    currentContent = currentContent.replace(/đảm bảo khỏi/gi, 'hỗ trợ cải thiện');
    currentContent = currentContent.replace(/cam kết chữa/gi, 'hỗ trợ điều trị');
  }

  const score: ContentScore = {
    total: accuracyResult.score + depthResult.score + citationResult.score + toneResult.score,
    accuracy: accuracyResult.score,
    depth: depthResult.score,
    citation: citationResult.score,
    tone: toneResult.score,
  };

  score.total = Math.min(score.total, 100);

  return {
    content: currentContent,
    contentOriginal,
    score,
    autoFixed: [...toneResult.autoFixed],
    manualRequired: [...accuracyResult.manualRequired, ...depthResult.manualRequired, ...citationResult.manualRequired, ...toneResult.manualRequired],
    issuesFound: [...accuracyResult.manualRequired, ...depthResult.manualRequired, ...citationResult.manualRequired, ...toneResult.manualRequired],
    findings: [...accuracyResult.findings, ...depthResult.findings, ...citationResult.findings, ...toneResult.findings],
  };
}

// ─── Layer 1: Technical QC — 100% Deterministic ─────────────
// NO Math.random(). Same content → same score, every time.
// NOW READS ALL deduction/max_deduction/is_active FROM rule-registry.

import { MOCK_DOMAIN_CONFIGS } from '@/lib/mock-rules-data';
import type { UnifiedRule } from '@/lib/qc/rule-registry';

export interface EditLocation {
  section: string;
  lineApprox: number;
  original: string;
  fixed: string;
  rule_code: string;
}

export interface TechScore {
  total: number;
  format: number;  // max 20
  link: number;    // max 30
  image: number;   // max 30
  seo: number;     // max 20
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

interface L1Result {
  content: string;
  contentOriginal: string;
  score: TechScore;
  autoFixed: EditLocation[];
  manualRequired: any[];
  issuesFound: any[];
  findings: Finding[];
}

// ─── Helper: extract plain text from HTML ───────────────────
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// ─── Helper: find section heading for a position ────────────
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
  // Return disabled stub so checks can skip gracefully
  return {
    code, name: '', description: '', section: 'TECH', sub_dimension: 'format',
    deduction: 0, max_deduction: 0, severity: 'info', is_active: false,
    is_system: false, auto_fixable: false, fix_instruction: '',
    applies_to: ['*'], check_type: 'structural', _exists: false,
  };
}

// ═══════════════════════════════════════════════════════════════
// DETERMINISTIC CHECKS — all read from rules config
// ═══════════════════════════════════════════════════════════════

function checkFormat(content: string, rules: Map<string, UnifiedRule>): { score: number; findings: Finding[]; autoFixed: EditLocation[]; manualRequired: any[] } {
  let score = 20; // start at max
  const findings: Finding[] = [];
  const autoFixed: EditLocation[] = [];
  const manualRequired: any[] = [];

  // 1. Bold inside <p> — forbidden (except Q&A headers)
  const rBold = getRule(rules, 'T-FMT-BOLD');
  if (rBold.is_active) {
    const rawMatches = [...content.matchAll(/<p[^>]*>[\s\S]*?<\/?(?:strong|b)[\s>][\s\S]*?<\/p>/gi)];
    const boldInP = rawMatches.filter(m => !/^<p[^>]*>\s*<(?:strong|b)>\s*(?:Câu hỏi|Giải đáp|Hỏi|Đáp|Trả lời):?\s*<\/(?:strong|b)>\s*<\/p>$/i.test(m[0].trim()));
    
    if (boldInP.length > 0) {
      const deduction = Math.min(boldInP.length * rBold.deduction, rBold.max_deduction);
      score -= deduction;
      findings.push({ rule_code: 'T-FMT-BOLD', passed: false, deduction, severity: rBold.severity, layer: 'tech', sub: 'format', detail: `${boldInP.length} đoạn có <strong>/<b> trong <p>` });
      manualRequired.push({ name: 'Bold trong đoạn văn', text: `${boldInP.length} chỗ sử dụng <strong>/<b> trong <p>`, severity: rBold.severity, deduction, layer: 'tech', sub: 'format', suggestion: 'Xóa thẻ bold, dùng heading hoặc danh sách thay thế' });
    } else {
      findings.push({ rule_code: 'T-FMT-BOLD', passed: true, deduction: 0, severity: 'info', layer: 'tech', sub: 'format' });
    }
  }

  // 2. Double/triple spaces
  const rSpace = getRule(rules, 'T-FMT-SPACE');
  if (rSpace.is_active) {
    const doubleSpaces = [...content.matchAll(/([^\s]) {2,}([^\s])/g)];
    if (doubleSpaces.length > 0) {
      const deduction = Math.min(doubleSpaces.length * rSpace.deduction, rSpace.max_deduction);
      score -= deduction;
      findings.push({ rule_code: 'T-FMT-SPACE', passed: false, deduction, severity: rSpace.severity, layer: 'tech', sub: 'format', detail: `${doubleSpaces.length} chỗ double space` });
      doubleSpaces.slice(0, 5).forEach(m => {
        if (m.index !== undefined) {
          autoFixed.push({
            section: findSectionAtPosition(content, m.index),
            lineApprox: approxLine(content, m.index),
            original: m[0], fixed: `${m[1]} ${m[2]}`, rule_code: 'T-FMT-SPACE'
          });
        }
      });
    } else {
      findings.push({ rule_code: 'T-FMT-SPACE', passed: true, deduction: 0, severity: 'info', layer: 'tech', sub: 'format' });
    }
  }

  // 3. Unit format: Mg → mg, ML → mL
  const rUnit = getRule(rules, 'T-FMT-UNIT');
  if (rUnit.is_active) {
    const badUnits = [...content.matchAll(/\b(\d+)\s*(Mg|MG|ML|Ml)\b/g)];
    if (badUnits.length > 0) {
      const deduction = Math.min(badUnits.length * rUnit.deduction, rUnit.max_deduction);
      score -= deduction;
      findings.push({ rule_code: 'T-FMT-UNIT', passed: false, deduction, severity: rUnit.severity, layer: 'tech', sub: 'format', detail: `${badUnits.length} đơn vị viết sai` });
      badUnits.forEach(m => {
        if (m.index !== undefined) {
          const corrected = m[2].toLowerCase() === 'ml' ? 'mL' : m[2].toLowerCase();
          autoFixed.push({
            section: findSectionAtPosition(content, m.index),
            lineApprox: approxLine(content, m.index),
            original: m[0], fixed: `${m[1]} ${corrected}`, rule_code: 'T-FMT-UNIT'
          });
        }
      });
    } else {
      findings.push({ rule_code: 'T-FMT-UNIT', passed: true, deduction: 0, severity: 'info', layer: 'tech', sub: 'format' });
    }
  }

  // 4. Paragraph too long (>150 words)
  const rPara = getRule(rules, 'T-FMT-PARA');
  if (rPara.is_active) {
    const paragraphs = [...content.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
    const longParagraphs = paragraphs.filter(p => stripHtml(p[1]).split(/\s+/).length > 150);
    if (longParagraphs.length > 0) {
      const deduction = Math.min(longParagraphs.length * rPara.deduction, rPara.max_deduction);
      score -= deduction;
      findings.push({ rule_code: 'T-FMT-PARA', passed: false, deduction, severity: rPara.severity, layer: 'tech', sub: 'format', detail: `${longParagraphs.length} đoạn văn > 150 từ` });
      manualRequired.push({ name: 'Đoạn văn quá dài', text: `${longParagraphs.length} đoạn > 150 từ`, severity: rPara.severity, deduction, layer: 'tech', sub: 'format', suggestion: 'Tách thành 2-3 đoạn ngắn hơn' });
    } else {
      findings.push({ rule_code: 'T-FMT-PARA', passed: true, deduction: 0, severity: 'info', layer: 'tech', sub: 'format' });
    }
  }

  return { score: Math.max(score, 0), findings, autoFixed, manualRequired };
}

function checkLinks(content: string, rules: Map<string, UnifiedRule>): { score: number; findings: Finding[]; autoFixed: EditLocation[]; manualRequired: any[] } {
  let score = 30; // max
  const findings: Finding[] = [];
  const autoFixed: EditLocation[] = [];
  const manualRequired: any[] = [];

  const allLinks = [...content.matchAll(/<a[^>]+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)];
  const allowedDomains = MOCK_DOMAIN_CONFIGS.allowed_internal_domains || [];
  
  // Separate internal links (to allowed domains) from external
  const internalLinks: typeof allLinks = [];
  const externalLinks: typeof allLinks = [];
  
  for (const link of allLinks) {
    const href = link[1];
    const isInternal = allowedDomains.some((d: string) => href.includes(d));
    if (isInternal) {
      internalLinks.push(link);
    } else if (href.startsWith('http')) {
      externalLinks.push(link);
    }
  }

  // 1. Internal link count → 5 to 10
  const rCount = getRule(rules, 'T-LNK-COUNT');
  if (rCount.is_active) {
    if (internalLinks.length < 5) {
      const deduction = Math.min((5 - internalLinks.length) * rCount.deduction, rCount.max_deduction);
      score -= deduction;
      findings.push({ rule_code: 'T-LNK-COUNT', passed: false, deduction, severity: rCount.severity, layer: 'tech', sub: 'link', detail: `Chỉ có ${internalLinks.length} internal link (cần 5-10)` });
      manualRequired.push({ name: 'Thiếu internal link', text: `Chỉ có ${internalLinks.length} internal link — tối thiểu 5`, severity: rCount.severity, deduction, layer: 'tech', sub: 'link', suggestion: 'Thêm internal link từ pool danh mục liên quan' });
    } else if (internalLinks.length > 10) {
      const deduction = Math.min((internalLinks.length - 10) * 2, rCount.max_deduction);
      score -= deduction;
      findings.push({ rule_code: 'T-LNK-COUNT', passed: false, deduction, severity: 'info', layer: 'tech', sub: 'link', detail: `Có ${internalLinks.length} internal link (tối đa 10)` });
      manualRequired.push({ name: 'Quá nhiều internal link', text: `Có ${internalLinks.length} internal link — tối đa 10`, severity: 'info', deduction, layer: 'tech', sub: 'link', suggestion: 'Bớt link ít liên quan' });
    } else {
      findings.push({ rule_code: 'T-LNK-COUNT', passed: true, deduction: 0, severity: 'info', layer: 'tech', sub: 'link' });
    }
  }

  // 2. No external links in content body (only in references)
  const rExt = getRule(rules, 'T-LNK-EXT');
  if (rExt.is_active) {
    if (externalLinks.length > 0) {
      const deduction = Math.min(externalLinks.length * rExt.deduction, rExt.max_deduction);
      score -= deduction;
      findings.push({ rule_code: 'T-LNK-EXT', passed: false, deduction, severity: rExt.severity, layer: 'tech', sub: 'link', detail: `${externalLinks.length} link ngoài trong nội dung` });
      manualRequired.push({ name: 'Link ngoài trong nội dung', text: `${externalLinks.length} external link (cấm trong content)`, severity: rExt.severity, deduction, layer: 'tech', sub: 'link', suggestion: 'Xóa link ngoài, chuyển vào References' });
    } else {
      findings.push({ rule_code: 'T-LNK-EXT', passed: true, deduction: 0, severity: 'info', layer: 'tech', sub: 'link' });
    }
  }

  // 3. Vague anchor text ("tại đây", "xem thêm", "click here")
  const rAnchor = getRule(rules, 'T-LNK-ANCHOR');
  if (rAnchor.is_active) {
    const vagueAnchors = allLinks.filter(l => {
      const text = stripHtml(l[2]).toLowerCase().trim();
      return ['tại đây', 'xem thêm', 'click here', 'here', 'xem chi tiết', 'nhấn vào đây'].includes(text);
    });
    if (vagueAnchors.length > 0) {
      const deduction = Math.min(vagueAnchors.length * rAnchor.deduction, rAnchor.max_deduction);
      score -= deduction;
      findings.push({ rule_code: 'T-LNK-ANCHOR', passed: false, deduction, severity: rAnchor.severity, layer: 'tech', sub: 'link', detail: `${vagueAnchors.length} anchor text mơ hồ` });
      manualRequired.push({ name: 'Anchor text mơ hồ', text: `"tại đây", "xem thêm" — cần anchor mô tả`, severity: rAnchor.severity, deduction, layer: 'tech', sub: 'link', suggestion: 'Dùng anchor text mô tả nội dung đích' });
    } else {
      findings.push({ rule_code: 'T-LNK-ANCHOR', passed: true, deduction: 0, severity: 'info', layer: 'tech', sub: 'link' });
    }
  }

  // 4. Anchor text capitalization (viết hoa vô lý)
  const rCap = getRule(rules, 'T-LNK-CAP');
  if (rCap.is_active) {
    const badCapAnchors = internalLinks.filter(l => {
      const text = stripHtml(l[2]).trim();
      if (!text || text.length < 2) return false;
      const firstChar = text[0];
      if (firstChar === firstChar.toUpperCase() && firstChar !== firstChar.toLowerCase()) {
        if (l.index === undefined) return true;
        const before = content.substring(Math.max(0, l.index - 30), l.index);
        const isStartOfSentence = /[.!?]\s*$/.test(before) || /<p[^>]*>\s*$/.test(before) || /<li[^>]*>\s*$/.test(before);
        return !isStartOfSentence;
      }
      return false;
    });
    if (badCapAnchors.length > 0) {
      const deduction = Math.min(badCapAnchors.length * rCap.deduction, rCap.max_deduction);
      score -= deduction;
      findings.push({ rule_code: 'T-LNK-CAP', passed: false, deduction, severity: rCap.severity, layer: 'tech', sub: 'link', detail: `${badCapAnchors.length} anchor viết hoa chữ cái đầu vô lý` });
      badCapAnchors.forEach(l => {
        const text = stripHtml(l[2]).trim();
        if (l.index !== undefined) {
          autoFixed.push({
            section: findSectionAtPosition(content, l.index),
            lineApprox: approxLine(content, l.index),
            original: text, fixed: text[0].toLowerCase() + text.slice(1), rule_code: 'T-LNK-CAP'
          });
        }
      });
    } else {
      findings.push({ rule_code: 'T-LNK-CAP', passed: true, deduction: 0, severity: 'info', layer: 'tech', sub: 'link' });
    }
  }

  return { score: Math.max(score, 0), findings, autoFixed, manualRequired };
}

function checkImages(content: string, rules: Map<string, UnifiedRule>): { score: number; findings: Finding[]; manualRequired: any[] } {
  let score = 30;
  const findings: Finding[] = [];
  const manualRequired: any[] = [];

  const figures = [...content.matchAll(/<figure[^>]*>[\s\S]*?<\/figure>/gi)];
  const images = [...content.matchAll(/<img[^>]*>/gi)];

  // 1. Has images?
  const rExist = getRule(rules, 'T-IMG-EXIST');
  if (rExist.is_active) {
    if (images.length === 0) {
      const deduction = rExist.max_deduction;
      score -= deduction;
      findings.push({ rule_code: 'T-IMG-EXIST', passed: false, deduction, severity: rExist.severity, layer: 'tech', sub: 'image', detail: 'Bài viết không có hình ảnh' });
      manualRequired.push({ name: 'Không có hình ảnh', text: 'Bài viết cần ít nhất 1 hình ảnh minh họa', severity: rExist.severity, deduction, layer: 'tech', sub: 'image', suggestion: 'Thêm ảnh từ nguồn có bản quyền hoặc tự chụp' });
    } else {
      findings.push({ rule_code: 'T-IMG-EXIST', passed: true, deduction: 0, severity: 'info', layer: 'tech', sub: 'image' });
    }
  }

  // 2. Images have alt text?
  const rAlt = getRule(rules, 'T-IMG-ALT');
  if (rAlt.is_active) {
    const imgsWithoutAlt = images.filter(img => {
      const altMatch = img[0].match(/alt="([^"]*)"/i);
      return !altMatch || altMatch[1].trim() === '';
    });
    if (imgsWithoutAlt.length > 0) {
      const deduction = Math.min(imgsWithoutAlt.length * rAlt.deduction, rAlt.max_deduction);
      score -= deduction;
      findings.push({ rule_code: 'T-IMG-ALT', passed: false, deduction, severity: rAlt.severity, layer: 'tech', sub: 'image', detail: `${imgsWithoutAlt.length} ảnh thiếu alt text` });
      manualRequired.push({ name: 'Ảnh thiếu alt text', text: `${imgsWithoutAlt.length} ảnh không có alt text`, severity: rAlt.severity, deduction, layer: 'tech', sub: 'image', suggestion: 'Thêm alt text mô tả cho mỗi ảnh' });
    } else if (images.length > 0) {
      findings.push({ rule_code: 'T-IMG-ALT', passed: true, deduction: 0, severity: 'info', layer: 'tech', sub: 'image' });
    }
  }

  // 3. Images have caption? (figcaption inside figure)
  const rCap = getRule(rules, 'T-IMG-CAP');
  if (rCap.is_active) {
    if (images.length > 0 && figures.length === 0) {
      const deduction = rCap.max_deduction;
      score -= deduction;
      findings.push({ rule_code: 'T-IMG-CAP', passed: false, deduction, severity: rCap.severity, layer: 'tech', sub: 'image', detail: 'Ảnh không có caption (figcaption)' });
    } else if (figures.length > 0) {
      const figuresWithCaption = figures.filter(f => /<figcaption/i.test(f[0]));
      if (figuresWithCaption.length < figures.length) {
        const missing = figures.length - figuresWithCaption.length;
        const deduction = Math.min(missing * rCap.deduction, rCap.max_deduction);
        score -= deduction;
        findings.push({ rule_code: 'T-IMG-CAP', passed: false, deduction, severity: rCap.severity, layer: 'tech', sub: 'image', detail: `${missing} figure thiếu figcaption` });
      } else {
        findings.push({ rule_code: 'T-IMG-CAP', passed: true, deduction: 0, severity: 'info', layer: 'tech', sub: 'image' });
      }
    }
  }

  // 4. Image placeholders still unfilled?
  const rPlaceholder = getRule(rules, 'T-IMG-PLACEHOLDER');
  if (rPlaceholder.is_active) {
    const placeholders = [...content.matchAll(/\[Ảnh minh ho[ạa]/gi)];
    if (placeholders.length > 0) {
      const deduction = Math.min(placeholders.length * rPlaceholder.deduction, rPlaceholder.max_deduction);
      score -= deduction;
      findings.push({ rule_code: 'T-IMG-PLACEHOLDER', passed: false, deduction, severity: rPlaceholder.severity, layer: 'tech', sub: 'image', detail: `${placeholders.length} placeholder ảnh chưa fill` });
      manualRequired.push({ name: 'Ảnh chưa được fill', text: `${placeholders.length} placeholder [Ảnh minh họa...] chưa thay thế`, severity: rPlaceholder.severity, deduction, layer: 'tech', sub: 'image', suggestion: 'Chạy lại tạo bài hoặc chèn ảnh thủ công' });
    } else {
      findings.push({ rule_code: 'T-IMG-PLACEHOLDER', passed: true, deduction: 0, severity: 'info', layer: 'tech', sub: 'image' });
    }
  }

  return { score: Math.max(score, 0), findings, manualRequired };
}

function checkSEO(content: string, rules: Map<string, UnifiedRule>, article?: any): { score: number; findings: Finding[]; manualRequired: any[] } {
  let score = 20;
  const findings: Finding[] = [];
  const manualRequired: any[] = [];

  // 1. H2 heading hierarchy
  const rH2 = getRule(rules, 'T-SEO-H2');
  if (rH2.is_active) {
    const isQA = article?.templateId === 'hoi-dap-bac-si' || article?.templateId === 'hoi-dap';
    const h2s = [...content.matchAll(/<h2[^>]*>/gi)];
    if (h2s.length < 2 && !isQA) {
      const deduction = rH2.max_deduction;
      score -= deduction;
      findings.push({ rule_code: 'T-SEO-H2', passed: false, deduction, severity: rH2.severity, layer: 'tech', sub: 'seo', detail: `Chỉ có ${h2s.length} heading H2 (cần ≥ 2)` });
      manualRequired.push({ name: 'Thiếu heading H2', text: `Chỉ có ${h2s.length} heading H2`, severity: rH2.severity, deduction, layer: 'tech', sub: 'seo', suggestion: 'Bổ sung thêm section H2 cho bài viết' });
    } else {
      findings.push({ rule_code: 'T-SEO-H2', passed: true, deduction: 0, severity: 'info', layer: 'tech', sub: 'seo' });
    }
  }

  // 2. Title length (article-level check)
  const rTitle = getRule(rules, 'T-SEO-TITLE');
  if (rTitle.is_active && article?.title) {
    if (article.title.length > 70) {
      const deduction = rTitle.deduction;
      score -= deduction;
      findings.push({ rule_code: 'T-SEO-TITLE', passed: false, deduction, severity: rTitle.severity, layer: 'tech', sub: 'seo', detail: `Title ${article.title.length} ký tự (max 70)` });
    } else {
      findings.push({ rule_code: 'T-SEO-TITLE', passed: true, deduction: 0, severity: 'info', layer: 'tech', sub: 'seo' });
    }
  }

  // 3. Meta description
  const rMeta = getRule(rules, 'T-SEO-META');
  if (rMeta.is_active) {
    if (article?.seoMeta?.description) {
      if (article.seoMeta.description.length > 160 || article.seoMeta.description.length < 50) {
        const deduction = rMeta.deduction;
        score -= deduction;
        findings.push({ rule_code: 'T-SEO-META', passed: false, deduction, severity: rMeta.severity, layer: 'tech', sub: 'seo', detail: `Meta description ${article.seoMeta.description.length} ký tự (50-160)` });
      } else {
        findings.push({ rule_code: 'T-SEO-META', passed: true, deduction: 0, severity: 'info', layer: 'tech', sub: 'seo' });
      }
    } else {
      score -= rMeta.max_deduction;
      findings.push({ rule_code: 'T-SEO-META', passed: false, deduction: rMeta.max_deduction, severity: rMeta.severity, layer: 'tech', sub: 'seo', detail: 'Thiếu meta description' });
    }
  }

  // 4. Sapo exists and reasonable length
  const rSapo = getRule(rules, 'T-SEO-SAPO');
  if (rSapo.is_active) {
    if (article?.sapo) {
      if (article.sapo.length > 300 || article.sapo.length < 20) {
        const deduction = rSapo.deduction;
        score -= deduction;
        findings.push({ rule_code: 'T-SEO-SAPO', passed: false, deduction, severity: rSapo.severity, layer: 'tech', sub: 'seo', detail: `Sapo ${article.sapo.length} ký tự (20-300)` });
      } else {
        findings.push({ rule_code: 'T-SEO-SAPO', passed: true, deduction: 0, severity: 'info', layer: 'tech', sub: 'seo' });
      }
    } else {
      score -= rSapo.max_deduction;
      findings.push({ rule_code: 'T-SEO-SAPO', passed: false, deduction: rSapo.max_deduction, severity: rSapo.severity, layer: 'tech', sub: 'seo', detail: 'Thiếu sapo' });
    }
  }

  return { score: Math.max(score, 0), findings, manualRequired };
}

// ═══════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════

export async function runLayer1TechQC(
  content: string,
  rules: Map<string, UnifiedRule>, // NOW: actual rule config map from registry
  skipAutoFix?: boolean,
  article?: any
): Promise<L1Result> {
  const contentOriginal = content;
  let currentContent = content;

  // Run all deterministic checks with registry-driven config
  const formatResult = checkFormat(currentContent, rules);
  const linkResult = checkLinks(currentContent, rules);
  const imageResult = checkImages(currentContent, rules);
  const seoResult = checkSEO(currentContent, rules, article);

  // Apply auto-fixes to content if not skipped
  if (!skipAutoFix) {
    // Fix double spaces
    if (rules.get('T-FMT-SPACE')?.is_active) {
      currentContent = currentContent.replace(/([^\s]) {2,}([^\s])/g, '$1 $2');
    }
    // Fix unit capitalization
    if (rules.get('T-FMT-UNIT')?.is_active) {
      currentContent = currentContent.replace(/(\d+)\s*(Mg|MG)\b/g, '$1 mg');
      currentContent = currentContent.replace(/(\d+)\s*(ML|Ml)\b/g, '$1 mL');
    }
  }

  const score: TechScore = {
    total: formatResult.score + linkResult.score + imageResult.score + seoResult.score,
    format: formatResult.score,
    link: linkResult.score,
    image: imageResult.score,
    seo: seoResult.score,
  };

  // Cap total at 100
  score.total = Math.min(score.total, 100);

  return {
    content: currentContent,
    contentOriginal,
    score,
    autoFixed: [...formatResult.autoFixed, ...linkResult.autoFixed],
    manualRequired: [...formatResult.manualRequired, ...linkResult.manualRequired, ...imageResult.manualRequired, ...seoResult.manualRequired],
    issuesFound: [...formatResult.manualRequired, ...linkResult.manualRequired, ...imageResult.manualRequired, ...seoResult.manualRequired],
    findings: [...formatResult.findings, ...linkResult.findings, ...imageResult.findings, ...seoResult.findings],
  };
}

import { GoogleGenAI } from '@google/genai';
import { RiskAnalysisResult, SafetyAnalysisResult } from '../safety-types';

const getClient = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Prompt for Layer 3a: Risk Pre-Check
const RISK_PRECHECK_PROMPT = `
You are a Medical Safety AI evaluating Vietnamese medical content.
Your job is to identify ONLY genuinely dangerous content that could harm patients.
Be LENIENT with general health advice, traditional medicine (Đông Y), and Q&A-style articles.
Only flag issues that pose REAL clinical danger.

1. 'dangerous_claim' (boolean): True ONLY if the article makes irresponsible guarantees like "chữa khỏi 100%", "cam kết khỏi bệnh", "thay thế hoàn toàn thuốc Tây". General phrases like "hỗ trợ điều trị" or "giúp cải thiện" are ACCEPTABLE and should NOT be flagged.
2. 'self_treatment_risk' (number 0-5): Score 4-5 ONLY if the article actively encourages skipping doctor visits for serious conditions. Articles about home remedies, nutrition, or mild symptom management should score 0-2.
3. 'dosage_issue' (boolean): True ONLY if the dosage could cause overdose or dangerous interactions. General dosage guidance (e.g. "uống 2 viên/ngày") for OTC or herbal products is acceptable.
4. 'missing_warning' (boolean): True ONLY if the article discusses prescription drugs or serious treatments but has ZERO mention of precautions. Articles about food, herbs, or general wellness do NOT need explicit drug warnings.
5. 'conflicting_dosage' (boolean): True ONLY if the SAME article gives contradictory numbers for the SAME drug.

Provide a short explanation description for any flag that is true or non-zero.

Return EXACTLY in JSON:
{
  "dangerous_claim": boolean,
  "dangerous_claim_desc": "string",
  "self_treatment_risk": number,
  "self_treatment_desc": "string",
  "dosage_issue": boolean,
  "dosage_issue_desc": "string",
  "missing_warning": boolean,
  "missing_warning_desc": "string",
  "conflicting_dosage": boolean,
  "conflicting_dosage_desc": "string"
}
`;

// Prompt for Layer 3b: Safety Enforcement
const SAFETY_ENFORCEMENT_PROMPT = `
You are a Medical Safety AI evaluating Vietnamese medical content.
Be PRACTICAL and LENIENT — not every article needs ALL safety elements.
Consider the article TYPE: Q&A articles, food/nutrition articles, and general wellness articles have lower safety requirements than drug/treatment articles.

Evaluate these flags (true if present, false if missing):
1. 'has_disclaimer': True if there is ANY general disclaimer, footnote, or statement that content is for reference. Also true if the article uses hedging language like "nên tham khảo ý kiến bác sĩ".
2. 'has_escalation': True if the article mentions seeing a doctor in ANY context. Phrases like "cần đi khám", "tham khảo bác sĩ", "hỏi ý kiến chuyên gia" all count.
3. 'has_warning': True if the article mentions ANY caution, side effect, or precaution. General statements like "không nên lạm dụng" or "cần thận trọng" also count.
4. 'has_condition_limit': True if the article provides ANY time-bound or conditional guidance. Also true for articles that naturally don't require condition limits (e.g. nutrition articles).
5. 'has_special_population_warning': True if the article mentions ANY special group (pregnant, children, elderly). Also true if the topic is NOT relevant to special populations (e.g. general wellness, food).

Return EXACTLY in JSON:
{
  "has_disclaimer": boolean,
  "has_escalation": boolean,
  "has_warning": boolean,
  "has_condition_limit": boolean,
  "has_special_population_warning": boolean
}
`;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export async function runLayer3aRiskPrecheck(content: string): Promise<RiskAnalysisResult> {
  const ai = getClient();
  let aiResult: any = {
    dangerous_claim: false,
    self_treatment_risk: 0,
    dosage_issue: false,
    missing_warning: false,
    conflicting_dosage: false
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: RISK_PRECHECK_PROMPT + "\\n\\nArticle Content:\\n" + content
    });
    
    let text = response.text || '';
    text = text.replace(/```json/g, '').replace(/```/g, '');
    aiResult = JSON.parse(text);
  } catch (err) {
    console.error("Layer 3a Risk Precheck Failed", err);
  }

  // Calculate risk_score (relaxed weights)
  let risk_score = 0;
  if (aiResult.dangerous_claim) risk_score += 40;
  risk_score += (aiResult.self_treatment_risk || 0) * 5;  // was *8, now *5
  if (aiResult.dosage_issue) risk_score += 15;              // was 25, now 15
  if (aiResult.missing_warning) risk_score += 8;            // was 15, now 8
  if (aiResult.conflicting_dosage) risk_score += 30;

  risk_score = clamp(risk_score, 0, 100);

  // Determine level (relaxed thresholds)
  let risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (risk_score >= 80 || aiResult.dangerous_claim || aiResult.conflicting_dosage) {
    risk_level = 'CRITICAL';
  } else if (risk_score >= 60) {   // was 50, now 60
    risk_level = 'HIGH';
  } else if (risk_score >= 30) {   // was 20, now 30
    risk_level = 'MEDIUM';
  }

  const flags: string[] = [];
  if (aiResult.dangerous_claim) flags.push("dangerous_claim");
  if (aiResult.self_treatment_risk >= 3) flags.push("high_self_treatment_risk");
  if (aiResult.dosage_issue) flags.push("dosage_issue");
  if (aiResult.missing_warning) flags.push("missing_warning");
  if (aiResult.conflicting_dosage) flags.push("conflicting_dosage");

  return {
    risk_score,
    risk_level,
    flags,
    dangerous_claim: !!aiResult.dangerous_claim,
    self_treatment_risk: aiResult.self_treatment_risk || 0,
    dosage_issue: !!aiResult.dosage_issue,
    missing_warning: !!aiResult.missing_warning,
    conflicting_dosage: !!aiResult.conflicting_dosage,
    details: {
      dangerous_claim_desc: aiResult.dangerous_claim_desc,
      self_treatment_desc: aiResult.self_treatment_desc,
      dosage_issue_desc: aiResult.dosage_issue_desc,
      missing_warning_desc: aiResult.missing_warning_desc,
      conflicting_dosage_desc: aiResult.conflicting_dosage_desc,
    }
  };
}

export async function runLayer3bSafetyEnforcement(content: string): Promise<SafetyAnalysisResult> {
  const ai = getClient();
  let aiResult: any = {
    has_disclaimer: true,
    has_escalation: true,
    has_warning: true,
    has_condition_limit: true,
    has_special_population_warning: true
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: SAFETY_ENFORCEMENT_PROMPT + "\\n\\nArticle Content:\\n" + content
    });
    
    let text = response.text || '';
    text = text.replace(/```json/g, '').replace(/```/g, '');
    aiResult = JSON.parse(text);
  } catch (err) {
    console.error("Layer 3b Safety Enforcement Failed", err);
  }

  // Base score starts at 30 — articles start "presumed safe" and lose points for missing elements
  let safety_score = 30;
  const missing_elements: string[] = [];

  if (aiResult.has_disclaimer) safety_score += 20; else missing_elements.push("has_disclaimer");
  if (aiResult.has_escalation) safety_score += 20; else missing_elements.push("has_escalation");
  if (aiResult.has_warning) safety_score += 15; else missing_elements.push("has_warning");
  if (aiResult.has_condition_limit) safety_score += 10; else missing_elements.push("has_condition_limit");
  if (aiResult.has_special_population_warning) safety_score += 5; else missing_elements.push("has_special_population_warning");

  safety_score = clamp(safety_score, 0, 100);

  return {
    safety_score,
    missing_elements,
    has_disclaimer: !!aiResult.has_disclaimer,
    has_escalation: !!aiResult.has_escalation,
    has_warning: !!aiResult.has_warning,
    has_condition_limit: !!aiResult.has_condition_limit,
    has_special_population_warning: !!aiResult.has_special_population_warning
  };
}

import { EditLocation } from './layers/layer1-tech';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type QCDecision = 'REJECT' | 'NEEDS_REVISION' | 'REVIEW' | 'SAFE_TO_PUBLISH';

export interface RiskAnalysisResult {
  risk_score: number; // 0-100
  risk_level: RiskLevel;
  flags: string[];
  
  // Specific indicators
  dangerous_claim: boolean;
  self_treatment_risk: number; // 0-5
  dosage_issue: boolean;
  missing_warning: boolean;
  conflicting_dosage: boolean;
  
  details: {
    dangerous_claim_desc?: string;
    self_treatment_desc?: string;
    dosage_issue_desc?: string;
    missing_warning_desc?: string;
    conflicting_dosage_desc?: string;
  };
}

export interface SafetyAnalysisResult {
  safety_score: number; // 0-100
  missing_elements: string[];
  
  // Specific components checked
  has_disclaimer: boolean;
  has_escalation: boolean;
  has_warning: boolean;
  has_condition_limit: boolean;
  has_special_population_warning: boolean;
}

// ─── Internal Link Silo Analysis ────────────────────────────

export interface InternalLinkInfo {
  anchor: string;
  href: string;
  section: string;       // H2/H3 heading it's under
  lineApprox: number;
  silo_category?: string; // detected silo/topic cluster
}

export interface LinkSiloAnalysis {
  total_links: number;
  links: InternalLinkInfo[];
  distribution_by_section: Record<string, number>;  // section → count
  silo_coverage: Record<string, number>;             // silo → count
  issues: string[];
  is_balanced: boolean;
}

// ─── Edit History (for L1/L2 transparency) ──────────────────

export interface LayerEditHistory {
  layer: 'tech' | 'content';
  total_edits: number;
  edits: EditLocation[];
}

// ─── Final Report ───────────────────────────────────────────

export interface FinalQCReport {
  technical_score: number;
  medical_score: number;
  risk_score: number;
  safety_score: number;
  final_safety_index: number;
  risk_level: RiskLevel;
  errors: string[];
  warnings: string[];
  decision: QCDecision;
  
  // For transparency
  isHardBlocked: boolean;
  blockReason?: string;
  
  // Raw sub-results
  details: {
    risk: RiskAnalysisResult;
    safety: SafetyAnalysisResult;
  };

  // Edit history from L1/L2 auto-fixes (Issue #2)
  editHistory: LayerEditHistory[];

  // Internal link silo analysis (Issue #4)
  linkAnalysis: LinkSiloAnalysis;

  // Original content preserved (Issue #1 — so 3A never modifies it)
  contentOriginal: string;
  contentAfterAutoFix: string;
}

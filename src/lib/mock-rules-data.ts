// ─── MOCK DATA: Domain Configs & Change Logs ─────────────────
// Rules have been migrated to the unified rule registry at:
//   @/lib/qc/rule-registry.ts
// This file now only exports domain configs and change logs.

export const MOCK_DOMAIN_CONFIGS: Record<string, any> = {
  allowed_internal_domains: ["nhathuoclongchau.com.vn", "tiemchunglongchau.com.vn"],
  allowed_reference_domains: [
    "who.int","cdc.gov","pubmed.ncbi.nlm.nih.gov","ncbi.nlm.nih.gov",
    "thelancet.com","nejm.org","bmj.com","uptodate.com",
    "emc.medicines.org.uk","mims.com","cochranelibrary.com"
  ],
  cross_domain_groups: [
    ["nhathuoclongchau.com.vn"],
    ["tiemchunglongchau.com.vn"]
  ],
  blocked_domains: []
};

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export const MOCK_CHANGE_LOGS = [
  { id: generateId(), time: '2026-04-01 10:00', rule_code: 'T-LNK-EXT', changed_by: 'SystemAdmin', change_type: 'created', note: 'Initial setup' },
  { id: generateId(), time: '2026-04-05 14:20', rule_code: 'T-FMT-BOLD', changed_by: 'EditorLead', change_type: 'updated', note: 'Tăng max_deduction lên 8' },
  { id: generateId(), time: '2026-04-10 09:00', rule_code: 'C-TONE-CURE', changed_by: 'SystemAdmin', change_type: 'updated', note: 'Bật auto_fixable' },
];

// Legacy re-export for backward compat with any remaining imports
export { getAllRules as MOCK_RULES } from '@/lib/qc/rule-registry';
export { type UnifiedRule as RuleSeverity } from '@/lib/qc/rule-registry';

// Legacy section data (still used by UI)
export const MOCK_RULE_SECTIONS = [
  { id: 'sec_tech', code: 'TECH', name: 'Kỹ Thuật', description: 'Rules hệ thống, định dạng, đường dẫn, SEO', sort_order: 1, is_active: true },
  { id: 'sec_content', code: 'CONTENT', name: 'Nội Dung', description: 'Rules chuyên môn y tế, thương hiệu, và nguồn trích dẫn', sort_order: 2, is_active: true }
];

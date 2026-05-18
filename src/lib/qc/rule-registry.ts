// ─── Unified Rule Registry ──────────────────────────────────
// Single source of truth for ALL QC rules.
// Both the QC Engine (layer1-tech, layer2-medical) and the
// Rules Engine Manager UI read from this registry.
//
// To change deduction points or toggle rules, call updateRuleConfig().
// Changes persist in the runtime registry and are used by the next QC run.

// ─── TYPES ──────────────────────────────────────────────────

export interface UnifiedRule {
  code: string;
  name: string;
  description: string;
  section: 'TECH' | 'CONTENT';
  sub_dimension: string; // tech: format|link|image|seo — content: accuracy|depth|citation|tone
  deduction: number;     // default deduction per occurrence
  max_deduction: number; // cap for this rule
  severity: 'critical' | 'warning' | 'info';
  is_active: boolean;
  is_system: boolean;    // system rules cannot be deleted
  auto_fixable: boolean;
  fix_instruction: string;
  applies_to: string[];  // template IDs or ['*'] for all
  check_type: string;    // regex | structural | ai | custom_ai | ...
}

export type RuleSeverity = 'critical' | 'warning' | 'info';

// ─── THE AUTHORITATIVE RULE LIST ────────────────────────────
// All 29 rules from Layer 1 (16) + Layer 2 (13)

const DEFAULT_RULES: UnifiedRule[] = [
  // ═══════════════ TECH / FORMAT (max 20) ═══════════════
  {
    code: 'T-FMT-BOLD', name: 'Không dùng bold trong đoạn văn',
    description: 'Không sử dụng <strong>/<b> bên trong thẻ <p>. Dùng heading hoặc list thay thế.',
    section: 'TECH', sub_dimension: 'format',
    deduction: 2, max_deduction: 8, severity: 'warning',
    is_active: true, is_system: true, auto_fixable: false, fix_instruction: '',
    applies_to: ['*'], check_type: 'structural',
  },
  {
    code: 'T-FMT-SPACE', name: 'Không double space',
    description: 'Phát hiện và tự động sửa khoảng trắng thừa.',
    section: 'TECH', sub_dimension: 'format',
    deduction: 1, max_deduction: 3, severity: 'info',
    is_active: true, is_system: false, auto_fixable: true, fix_instruction: 'Xóa khoảng trắng thừa',
    applies_to: ['*'], check_type: 'regex',
  },
  {
    code: 'T-FMT-UNIT', name: 'Đơn vị viết đúng format (mg, mL)',
    description: 'Sửa Mg→mg, ML→mL, Ml→mL tự động.',
    section: 'TECH', sub_dimension: 'format',
    deduction: 1, max_deduction: 4, severity: 'info',
    is_active: true, is_system: false, auto_fixable: true, fix_instruction: 'Sửa viết hoa đơn vị',
    applies_to: ['*'], check_type: 'regex',
  },
  {
    code: 'T-FMT-PARA', name: 'Đoạn văn không quá dài (≤150 từ)',
    description: 'Mỗi đoạn <p> không nên vượt quá 150 từ.',
    section: 'TECH', sub_dimension: 'format',
    deduction: 2, max_deduction: 5, severity: 'warning',
    is_active: true, is_system: false, auto_fixable: false, fix_instruction: 'Tách đoạn văn',
    applies_to: ['*'], check_type: 'structural',
  },

  // ═══════════════ TECH / LINK (max 30) ═══════════════
  {
    code: 'T-LNK-COUNT', name: 'Internal link 5-10 cái',
    description: 'Bài viết cần có 5-10 internal link đến domain nội bộ.',
    section: 'TECH', sub_dimension: 'link',
    deduction: 3, max_deduction: 10, severity: 'warning',
    is_active: true, is_system: true, auto_fixable: false, fix_instruction: '',
    applies_to: ['*'], check_type: 'structural',
  },
  {
    code: 'T-LNK-EXT', name: 'Không link ngoài trong nội dung',
    description: 'Phần nội dung chỉ được chứa link đến domain nội bộ Long Châu. Link ngoài chỉ xuất hiện ở References.',
    section: 'TECH', sub_dimension: 'link',
    deduction: 5, max_deduction: 10, severity: 'critical',
    is_active: true, is_system: true, auto_fixable: false, fix_instruction: '',
    applies_to: ['*'], check_type: 'structural',
  },
  {
    code: 'T-LNK-ANCHOR', name: 'Anchor text không mơ hồ',
    description: 'Không dùng anchor text: "tại đây", "xem thêm", "click here"...',
    section: 'TECH', sub_dimension: 'link',
    deduction: 2, max_deduction: 6, severity: 'warning',
    is_active: true, is_system: false, auto_fixable: false, fix_instruction: '',
    applies_to: ['*'], check_type: 'regex',
  },
  {
    code: 'T-LNK-CAP', name: 'Anchor text không viết hoa vô lý',
    description: 'Anchor text không nên viết hoa chữ cái đầu nếu không ở đầu câu.',
    section: 'TECH', sub_dimension: 'link',
    deduction: 1, max_deduction: 4, severity: 'info',
    is_active: true, is_system: false, auto_fixable: true, fix_instruction: 'Chuyển chữ cái đầu thành thường',
    applies_to: ['*'], check_type: 'structural',
  },

  // ═══════════════ TECH / IMAGE (max 30) ═══════════════
  {
    code: 'T-IMG-EXIST', name: 'Bài viết phải có hình ảnh',
    description: 'Cần ít nhất 1 hình ảnh minh họa.',
    section: 'TECH', sub_dimension: 'image',
    deduction: 15, max_deduction: 15, severity: 'critical',
    is_active: true, is_system: true, auto_fixable: false, fix_instruction: '',
    applies_to: ['*'], check_type: 'structural',
  },
  {
    code: 'T-IMG-ALT', name: 'Ảnh phải có alt text',
    description: 'Mọi thẻ <img> phải có thuộc tính alt mô tả nội dung ảnh.',
    section: 'TECH', sub_dimension: 'image',
    deduction: 3, max_deduction: 8, severity: 'warning',
    is_active: true, is_system: true, auto_fixable: false, fix_instruction: '',
    applies_to: ['*'], check_type: 'structural',
  },
  {
    code: 'T-IMG-CAP', name: 'Ảnh có caption (figcaption)',
    description: 'Ảnh nên được đặt trong <figure> với <figcaption>.',
    section: 'TECH', sub_dimension: 'image',
    deduction: 2, max_deduction: 5, severity: 'info',
    is_active: true, is_system: false, auto_fixable: false, fix_instruction: '',
    applies_to: ['*'], check_type: 'structural',
  },
  {
    code: 'T-IMG-PLACEHOLDER', name: 'Không còn placeholder ảnh',
    description: 'Không được còn [Ảnh minh họa...] placeholder chưa fill.',
    section: 'TECH', sub_dimension: 'image',
    deduction: 3, max_deduction: 7, severity: 'warning',
    is_active: true, is_system: false, auto_fixable: false, fix_instruction: '',
    applies_to: ['*'], check_type: 'regex',
  },

  // ═══════════════ TECH / SEO (max 20) ═══════════════
  {
    code: 'T-SEO-H2', name: 'Đủ heading H2 (≥2)',
    description: 'Bài viết cần ít nhất 2 heading H2 cho cấu trúc SEO.',
    section: 'TECH', sub_dimension: 'seo',
    deduction: 5, max_deduction: 5, severity: 'warning',
    is_active: true, is_system: true, auto_fixable: false, fix_instruction: '',
    applies_to: ['*'], check_type: 'structural',
  },
  {
    code: 'T-SEO-TITLE', name: 'Title ≤70 ký tự',
    description: 'Tiêu đề bài viết không nên vượt 70 ký tự cho SEO.',
    section: 'TECH', sub_dimension: 'seo',
    deduction: 3, max_deduction: 3, severity: 'warning',
    is_active: true, is_system: false, auto_fixable: false, fix_instruction: '',
    applies_to: ['*'], check_type: 'structural',
  },
  {
    code: 'T-SEO-META', name: 'Meta description 50-160 ký tự',
    description: 'Meta description cần đủ dài (50-160 ký tự).',
    section: 'TECH', sub_dimension: 'seo',
    deduction: 3, max_deduction: 5, severity: 'warning',
    is_active: true, is_system: true, auto_fixable: false, fix_instruction: '',
    applies_to: ['*'], check_type: 'structural',
  },
  {
    code: 'T-SEO-SAPO', name: 'Có sapo (20-300 ký tự)',
    description: 'Bài viết cần có sapo giới thiệu ngắn gọn.',
    section: 'TECH', sub_dimension: 'seo',
    deduction: 2, max_deduction: 4, severity: 'warning',
    is_active: true, is_system: true, auto_fixable: false, fix_instruction: '',
    applies_to: ['*'], check_type: 'structural',
  },

  // ═══════════════ CONTENT / ACCURACY (max 40) ═══════════════
  {
    code: 'C-ACC-REF', name: 'Phải có nguồn tham khảo (≥3)',
    description: 'Bài viết y tế bắt buộc phải có ít nhất 3 nguồn tham khảo uy tín.',
    section: 'CONTENT', sub_dimension: 'accuracy',
    deduction: 8, max_deduction: 15, severity: 'critical',
    is_active: true, is_system: true, auto_fixable: false, fix_instruction: '',
    applies_to: ['*'], check_type: 'structural',
  },
  {
    code: 'C-ACC-COMP', name: 'Không đề cập đối thủ cạnh tranh',
    description: 'Không được nhắc tên Pharmacity, Guardian, An Khang, Medicare, Phano...',
    section: 'CONTENT', sub_dimension: 'accuracy',
    deduction: 10, max_deduction: 10, severity: 'critical',
    is_active: true, is_system: true, auto_fixable: false, fix_instruction: '',
    applies_to: ['*'], check_type: 'regex',
  },
  {
    code: 'C-ACC-ABS', name: 'Không claim y tế tuyệt đối',
    description: 'Không dùng "chắc chắn", "100%", "tuyệt đối", "luôn luôn" kèm claim y tế.',
    section: 'CONTENT', sub_dimension: 'accuracy',
    deduction: 5, max_deduction: 15, severity: 'critical',
    is_active: true, is_system: true, auto_fixable: false, fix_instruction: '',
    applies_to: ['*'], check_type: 'regex',
  },

  // ═══════════════ CONTENT / DEPTH (max 30) ═══════════════
  {
    code: 'C-DEP-WORDS', name: 'Đủ dài theo template',
    description: 'Bài viết cần đủ chiều sâu theo loại template (GSK≥1200, Bệnh lý≥1800, Hỏi đáp≥200, Dược chất≥1500).',
    section: 'CONTENT', sub_dimension: 'depth',
    deduction: 2, max_deduction: 8, severity: 'warning',
    is_active: true, is_system: true, auto_fixable: false, fix_instruction: '',
    applies_to: ['*'], check_type: 'structural',
  },
  {
    code: 'C-DEP-SECT', name: 'Đủ section H2 (≥3)',
    description: 'Bài viết cần ít nhất 3 section H2 chính.',
    section: 'CONTENT', sub_dimension: 'depth',
    deduction: 8, max_deduction: 8, severity: 'warning',
    is_active: true, is_system: true, auto_fixable: false, fix_instruction: '',
    applies_to: ['*'], check_type: 'structural',
  },
  {
    code: 'C-DEP-H3', name: 'Có H3 sub-sections',
    description: 'Bài dài nên có H3 để chia nhỏ section.',
    section: 'CONTENT', sub_dimension: 'depth',
    deduction: 5, max_deduction: 5, severity: 'info',
    is_active: true, is_system: false, auto_fixable: false, fix_instruction: '',
    applies_to: ['*'], check_type: 'structural',
  },
  {
    code: 'C-DEP-LIST', name: 'Có sử dụng danh sách (ul/ol)',
    description: 'Bài y tế nên có danh sách để trình bày thông tin có cấu trúc.',
    section: 'CONTENT', sub_dimension: 'depth',
    deduction: 2, max_deduction: 2, severity: 'info',
    is_active: true, is_system: false, auto_fixable: false, fix_instruction: '',
    applies_to: ['*'], check_type: 'structural',
  },

  // ═══════════════ CONTENT / CITATION (max 20) ═══════════════
  {
    code: 'C-CIT-EXIST', name: 'Có danh sách references',
    description: 'Bài viết phải có danh mục tham khảo cuối bài.',
    section: 'CONTENT', sub_dimension: 'citation',
    deduction: 20, max_deduction: 20, severity: 'critical',
    is_active: true, is_system: true, auto_fixable: false, fix_instruction: '',
    applies_to: ['*'], check_type: 'structural',
  },
  {
    code: 'C-CIT-DATE', name: 'Nguồn có ngày truy cập',
    description: 'Ít nhất 50% nguồn phải ghi ngày truy cập.',
    section: 'CONTENT', sub_dimension: 'citation',
    deduction: 5, max_deduction: 5, severity: 'warning',
    is_active: true, is_system: false, auto_fixable: false, fix_instruction: 'Thêm "(truy cập ngày DD/MM/YYYY)"',
    applies_to: ['*'], check_type: 'structural',
  },
  {
    code: 'C-CIT-DEEP', name: 'Nguồn dùng deep link (không homepage)',
    description: 'Link nguồn phải trỏ đến bài viết cụ thể, không phải trang chủ.',
    section: 'CONTENT', sub_dimension: 'citation',
    deduction: 3, max_deduction: 8, severity: 'warning',
    is_active: true, is_system: false, auto_fixable: false, fix_instruction: '',
    applies_to: ['*'], check_type: 'structural',
  },
  {
    code: 'C-CIT-TRUST', name: 'Có nguồn uy tín quốc tế',
    description: 'Nên có ít nhất 1 nguồn từ WHO, CDC, PubMed, Lancet, NEJM...',
    section: 'CONTENT', sub_dimension: 'citation',
    deduction: 5, max_deduction: 5, severity: 'info',
    is_active: true, is_system: false, auto_fixable: false, fix_instruction: '',
    applies_to: ['*'], check_type: 'structural',
  },

  // ═══════════════ CONTENT / TONE (max 10) ═══════════════
  {
    code: 'C-TONE-CURE', name: 'Không claim chữa khỏi hoàn toàn',
    description: 'Không dùng "chữa khỏi", "khỏi hẳn", "100% hiệu quả", "chữa trị dứt điểm"...',
    section: 'CONTENT', sub_dimension: 'tone',
    deduction: 3, max_deduction: 8, severity: 'critical',
    is_active: true, is_system: true, auto_fixable: true, fix_instruction: 'Thay bằng "hỗ trợ điều trị"',
    applies_to: ['*'], check_type: 'regex',
  },
  {
    code: 'C-TONE-DOC', name: 'Khuyến nghị tham khảo ý kiến bác sĩ',
    description: 'Bài điều trị phải có lời khuyên tham khảo ý kiến bác sĩ.',
    section: 'CONTENT', sub_dimension: 'tone',
    deduction: 2, max_deduction: 2, severity: 'info',
    is_active: true, is_system: false, auto_fixable: true, fix_instruction: 'Thêm nhắc nhở tham khảo ý kiến bác sĩ',
    applies_to: ['*'], check_type: 'custom_ai',
  },
];

// ─── RUNTIME REGISTRY (mutable) ─────────────────────────────
// This is the live list that both QC engine and UI read/write.
// It starts as a deep clone of DEFAULT_RULES.

let _registry: UnifiedRule[] = JSON.parse(JSON.stringify(DEFAULT_RULES));

// ─── PUBLIC API ─────────────────────────────────────────────

/**
 * Get ALL rules (active + inactive).
 * UI uses this to show the full list with toggles.
 */
export function getAllRules(): UnifiedRule[] {
  return _registry;
}

/**
 * Get all ACTIVE rules as a Map<code, UnifiedRule> for fast lookup.
 * Optionally filter by templateId.
 * QC engine uses this.
 */
export function getActiveRulesMap(templateId?: string): Map<string, UnifiedRule> {
  const map = new Map<string, UnifiedRule>();
  for (const rule of _registry) {
    if (!rule.is_active) continue;
    if (templateId && !rule.applies_to.includes('*') && !rule.applies_to.includes(templateId)) continue;
    map.set(rule.code, rule);
  }
  return map;
}

/**
 * Get rules for a specific section.
 */
export function getRulesBySection(section: 'TECH' | 'CONTENT'): UnifiedRule[] {
  return _registry.filter(r => r.section === section);
}

/**
 * Get a single rule config by code.
 */
export function getRuleConfig(code: string): UnifiedRule | undefined {
  return _registry.find(r => r.code === code);
}

/**
 * Get unique sub-dimensions for a section.
 */
export function getSubDimensions(section: 'TECH' | 'CONTENT'): string[] {
  const subs = new Set<string>();
  _registry.filter(r => r.section === section).forEach(r => subs.add(r.sub_dimension));
  return Array.from(subs);
}

/**
 * Update a rule's config.
 * Used by Rules Engine Manager UI when user edits and saves.
 */
export function updateRuleConfig(code: string, updates: Partial<UnifiedRule>): boolean {
  const idx = _registry.findIndex(r => r.code === code);
  if (idx === -1) return false;

  const rule = _registry[idx];

  // System rules: only allow toggling is_active, deduction, max_deduction, severity
  // Cannot change code, name, section, sub_dimension, check_type
  if (rule.is_system) {
    const allowed: (keyof UnifiedRule)[] = ['is_active', 'deduction', 'max_deduction', 'severity', 'auto_fixable', 'fix_instruction'];
    const sanitized: Partial<UnifiedRule> = {};
    for (const key of allowed) {
      if (key in updates) {
        (sanitized as any)[key] = (updates as any)[key];
      }
    }
    _registry[idx] = { ...rule, ...sanitized };
  } else {
    _registry[idx] = { ...rule, ...updates };
  }

  return true;
}

/**
 * Toggle a rule's active state.
 */
export function toggleRule(code: string): boolean {
  const rule = _registry.find(r => r.code === code);
  if (!rule) return false;
  rule.is_active = !rule.is_active;
  return true;
}

/**
 * Add a new custom rule.
 * Custom rules have is_system = false.
 */
export function addRule(rule: Omit<UnifiedRule, 'is_system'>): boolean {
  // Check for duplicate code
  if (_registry.some(r => r.code === rule.code)) return false;
  _registry.push({ ...rule, is_system: false });
  return true;
}

/**
 * Delete a custom rule (is_system = false only).
 */
export function deleteRule(code: string): boolean {
  const idx = _registry.findIndex(r => r.code === code);
  if (idx === -1) return false;
  if (_registry[idx].is_system) return false; // Cannot delete system rules
  _registry.splice(idx, 1);
  return true;
}

/**
 * Reset all rules to defaults.
 */
export function resetToDefaults(): void {
  _registry = JSON.parse(JSON.stringify(DEFAULT_RULES));
}

/**
 * Export current registry state as JSON (for persistence/backup).
 */
export function exportRegistryJSON(): string {
  return JSON.stringify(_registry, null, 2);
}

/**
 * Import registry from JSON (restore from backup/DB).
 */
export function importRegistryJSON(json: string): boolean {
  try {
    const parsed = JSON.parse(json) as UnifiedRule[];
    if (!Array.isArray(parsed)) return false;
    _registry = parsed;
    return true;
  } catch {
    return false;
  }
}

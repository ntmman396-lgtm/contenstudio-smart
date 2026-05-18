// ─── Roles ──────────────────────────────────────────────────────────────────

export type Role = 'superadmin' | 'lead' | 'btv' | 'ctv' | 'hdyk' | 'bs'

export type RoleGroup = 'system' | 'content' | 'review'

export interface RoleMeta {
  label: string
  group: RoleGroup
  tier: 'executive' | 'management' | 'system'
  color: string
}

export const ROLE_META: Record<Role, RoleMeta> = {
  superadmin: { label: 'Super Admin',        group: 'system',  tier: 'system',     color: 'text-purple-400 bg-purple-500/15' },
  lead:       { label: 'Lead',               group: 'system',  tier: 'system',     color: 'text-indigo-400 bg-indigo-500/15' },
  btv:        { label: 'Biên tập viên',      group: 'content', tier: 'management', color: 'text-blue-400 bg-blue-500/15'     },
  ctv:        { label: 'Cộng tác viên',      group: 'content', tier: 'executive',  color: 'text-cyan-400 bg-cyan-500/15'     },
  hdyk:       { label: 'Hội đồng y khoa',    group: 'review',  tier: 'management', color: 'text-amber-400 bg-amber-500/15'   },
  bs:         { label: 'Bác sĩ',             group: 'review',  tier: 'executive',  color: 'text-emerald-400 bg-emerald-500/15'},
}

// ─── Permissions ─────────────────────────────────────────────────────────────

export type Permission =
  // Account management
  | 'assign_role_lead'           // chỉ superadmin
  | 'assign_role_operational'    // lead+
  | 'create_account'             // lead+
  | 'deactivate_account'         // lead+
  // Article — read
  | 'read_own_articles'          // ctv, btv
  | 'read_all_ctv_articles'      // btv, lead, superadmin
  | 'read_bs_review_articles'    // btv (read-only), hdyk, lead, superadmin
  | 'read_assigned_articles'     // bs (chỉ bài được assign)
  | 'read_all_articles'          // hdyk, lead, superadmin
  // Article — workflow actions
  | 'create_article'             // ctv, btv
  | 'submit_article'             // ctv
  | 'request_withdraw'           // ctv
  | 'approve_withdraw'           // btv
  | 'assign_article_to_ctv'      // btv
  | 'approve_article'            // bs, hdyk
  | 'reject_article'             // bs, hdyk
  | 'override_bs_decision'       // hdyk
  | 'reassign_bs'                // hdyk
  | 'close_article'              // hdyk, lead, superadmin
  | 'add_cta'                    // ctv
  | 'publish_article'            // ctv
  // System
  | 'manage_specialties'         // lead, superadmin
  | 'configure_system'           // lead, superadmin
  | 'override_article_state'     // lead, superadmin (kỹ thuật)
  | 'view_audit_log'             // lead, superadmin
  | 'export_data'                // lead, superadmin
  | 'view_own_dashboard'         // tất cả
  | 'view_all_dashboard'         // btv, hdyk, lead, superadmin

// ─── Role → Permission map ───────────────────────────────────────────────────

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  superadmin: [
    'assign_role_lead', 'assign_role_operational', 'create_account', 'deactivate_account',
    'read_own_articles', 'read_all_ctv_articles', 'read_bs_review_articles',
    'read_assigned_articles', 'read_all_articles',
    'close_article', 'override_article_state',
    'manage_specialties', 'configure_system', 'view_audit_log', 'export_data',
    'view_own_dashboard', 'view_all_dashboard',
  ],
  lead: [
    'assign_role_operational', 'create_account', 'deactivate_account',
    'read_own_articles', 'read_all_ctv_articles', 'read_bs_review_articles',
    'read_assigned_articles', 'read_all_articles',
    'close_article', 'override_article_state',
    'manage_specialties', 'configure_system', 'view_audit_log', 'export_data',
    'view_own_dashboard', 'view_all_dashboard',
  ],
  btv: [
    'read_own_articles', 'read_all_ctv_articles', 'read_bs_review_articles',
    'create_article', 'submit_article', 'assign_article_to_ctv', 'approve_withdraw',
    'add_cta', 'publish_article',
    'view_own_dashboard', 'view_all_dashboard',
  ],
  ctv: [
    'read_own_articles',
    'create_article', 'submit_article', 'request_withdraw', 'add_cta', 'publish_article',
    'view_own_dashboard',
  ],
  hdyk: [
    'read_assigned_articles', 'read_all_articles', 'read_bs_review_articles',
    'approve_article', 'reject_article',
    'override_bs_decision', 'reassign_bs', 'close_article',
    'view_own_dashboard', 'view_all_dashboard',
  ],
  bs: [
    'read_assigned_articles',
    'approve_article', 'reject_article',
    'view_own_dashboard',
  ],
}

// ─── Roles mà Lead có thể gán ────────────────────────────────────────────────

export const ASSIGNABLE_ROLES_BY: Record<Role, Role[]> = {
  superadmin: ['lead', 'btv', 'ctv', 'hdyk', 'bs'],
  lead:       ['btv', 'ctv', 'hdyk', 'bs'],
  btv:        [],
  ctv:        [],
  hdyk:       [],
  bs:         [],
}

// ─── Article Workflow Status ──────────────────────────────────────────────────

export type WorkflowStatus =
  | 'draft'             // CTV đang soạn
  | 'pending_bs_review' // Đã nộp, chờ HĐYK assign BS
  | 'under_review'      // BS đang duyệt
  | 'needs_revision'    // BS trả về, CTV cần sửa
  | 'cta_pending'       // BS đã duyệt, CTV thêm CTA
  | 'published'         // Đã publish
  | 'closed'            // Đóng/hủy bởi HĐYK hoặc Lead

export const WORKFLOW_STATUS_LABEL: Record<WorkflowStatus, string> = {
  draft:            'Bản nháp',
  pending_bs_review:'Chờ duyệt y khoa',
  under_review:     'Đang được duyệt',
  needs_revision:   'Cần chỉnh sửa',
  cta_pending:      'Chờ thêm CTA',
  published:        'Đã xuất bản',
  closed:           'Đã đóng',
}

export const WORKFLOW_STATUS_COLOR: Record<WorkflowStatus, string> = {
  draft:            'text-slate-400 bg-slate-500/15',
  pending_bs_review:'text-amber-400 bg-amber-500/15',
  under_review:     'text-blue-400 bg-blue-500/15',
  needs_revision:   'text-orange-400 bg-orange-500/15',
  cta_pending:      'text-violet-400 bg-violet-500/15',
  published:        'text-emerald-400 bg-emerald-500/15',
  closed:           'text-red-400 bg-red-500/15',
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  email: string
  name: string
  role: Role
  isActive: boolean
  specialties: string[]  // dành cho BS
  capacity: number | null
  createdAt: string
}

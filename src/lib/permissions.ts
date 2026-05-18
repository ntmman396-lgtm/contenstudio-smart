import type { Role, Permission, WorkflowStatus } from '@/types/auth'
import { ROLE_PERMISSIONS } from '@/types/auth'

// ─── Core permission check ────────────────────────────────────────────────────

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

// ─── Article workflow: các state transition hợp lệ theo role ─────────────────

type StateTransition = {
  from: WorkflowStatus[]
  to: WorkflowStatus
  requiredPermission: Permission
}

const WORKFLOW_TRANSITIONS: StateTransition[] = [
  // CTV nộp bài
  { from: ['draft', 'needs_revision'], to: 'pending_bs_review', requiredPermission: 'submit_article' },
  // HĐYK/hệ thống assign BS → under_review (xử lý server-side, không cần permission check client)
  { from: ['pending_bs_review'],       to: 'under_review',      requiredPermission: 'approve_article' },
  // BS approve
  { from: ['under_review'],            to: 'cta_pending',       requiredPermission: 'approve_article' },
  // BS reject → về needs_revision
  { from: ['under_review'],            to: 'needs_revision',    requiredPermission: 'reject_article'  },
  // HĐYK override approve
  { from: ['under_review', 'needs_revision', 'pending_bs_review'], to: 'cta_pending', requiredPermission: 'override_bs_decision' },
  // CTV publish sau khi thêm CTA
  { from: ['cta_pending'],             to: 'published',         requiredPermission: 'publish_article' },
  // HĐYK / Lead đóng bài
  { from: ['draft', 'pending_bs_review', 'under_review', 'needs_revision', 'cta_pending'],
    to: 'closed',      requiredPermission: 'close_article'    },
]

export function canTransition(
  role: Role,
  from: WorkflowStatus,
  to: WorkflowStatus,
): boolean {
  const transition = WORKFLOW_TRANSITIONS.find(
    t => t.to === to && t.from.includes(from)
  )
  if (!transition) return false
  return can(role, transition.requiredPermission)
}

// ─── Xác định những transitions user có thể thực hiện từ state hiện tại ──────

export function availableTransitions(
  role: Role,
  currentStatus: WorkflowStatus,
): WorkflowStatus[] {
  return WORKFLOW_TRANSITIONS
    .filter(t => t.from.includes(currentStatus) && can(role, t.requiredPermission))
    .map(t => t.to)
}

// ─── Utility: guard cho API route (ném Error nếu không có quyền) ──────────────

export function requirePermission(role: Role, permission: Permission, label?: string): void {
  if (!can(role, permission)) {
    const msg = label
      ? `Không có quyền: ${label}`
      : `Role "${role}" không có quyền thực hiện hành động này`
    throw new PermissionError(msg)
  }
}

export class PermissionError extends Error {
  status = 403
  constructor(message: string) {
    super(message)
    this.name = 'PermissionError'
  }
}

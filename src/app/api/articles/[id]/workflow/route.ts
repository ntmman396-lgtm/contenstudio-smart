import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, SESSION_COOKIE } from '@/lib/auth'
import { canTransition } from '@/lib/permissions'
import type { WorkflowStatus } from '@/types/auth'

type WorkflowAction = 'submit' | 'approve' | 'reject' | 'request_revision' | 'add_cta' | 'publish' | 'close' | 'reassign_bs' | 'override_approve'

const ACTION_TO_STATUS: Record<string, { from: WorkflowStatus[], to: WorkflowStatus }> = {
  submit:           { from: ['draft', 'needs_revision'], to: 'pending_bs_review' },
  approve:          { from: ['under_review'],            to: 'cta_pending' },
  reject:           { from: ['under_review'],            to: 'needs_revision' },
  request_revision: { from: ['under_review'],            to: 'needs_revision' },
  override_approve: { from: ['under_review', 'needs_revision', 'pending_bs_review'], to: 'cta_pending' },
  publish:          { from: ['cta_pending'],             to: 'published' },
  close:            { from: ['draft', 'pending_bs_review', 'under_review', 'needs_revision', 'cta_pending'], to: 'closed' },
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value
    const user = await getSessionUser(token ?? '')
    if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

    const body = await request.json()
    const action = body.action as WorkflowAction

    if (!action) {
      return NextResponse.json({ error: 'Thiếu action' }, { status: 400 })
    }

    const article = await prisma.article.findUnique({ where: { id: params.id } })
    if (!article) {
      return NextResponse.json({ error: 'Không tìm thấy bài viết' }, { status: 404 })
    }

    const currentStatus = (article.workflowStatus || 'draft') as WorkflowStatus

    // ─── Handle reassign_bs separately ───
    if (action === 'reassign_bs') {
      if (user.role !== 'hdyk' && user.role !== 'lead' && user.role !== 'superadmin') {
        return NextResponse.json({ error: 'Chỉ HĐYK mới có quyền reassign BS' }, { status: 403 })
      }
      const { newBsId } = body
      if (!newBsId) return NextResponse.json({ error: 'Thiếu newBsId' }, { status: 400 })

      await prisma.article.update({
        where: { id: params.id },
        data: { assignedBsId: newBsId },
      })

      // Log reassign_bs
      await prisma.workflowLog.create({
        data: {
          articleId: params.id,
          action: 'reassign_bs',
          fromStatus: currentStatus,
          toStatus: currentStatus,
          actorId: user.id,
          actorName: user.name,
          actorRole: user.role,
          note: `Chuyển BS sang user ${newBsId}`,
        },
      })

      return NextResponse.json({ success: true, message: 'Đã chuyển BS' })
    }

    // Validate ownership
    const isCreator = article.createdBy === user.id
    const isAssignee = article.assignedCtvId === user.id
    const hasAssignee = !!article.assignedCtvId
    const isContentOwner = 
       (user.role === 'ctv' && (isCreator || isAssignee)) ||
       (user.role === 'btv' && (!hasAssignee || isAssignee)) ||
       (user.role === 'lead' || user.role === 'superadmin')

    // ─── Handle add_cta (doesn't change status) ───
    if (action === 'add_cta') {
      if (currentStatus !== 'cta_pending') {
        return NextResponse.json({ error: 'Bài chưa ở trạng thái chờ CTA' }, { status: 400 })
      }
      if (!isContentOwner) {
        return NextResponse.json({ error: 'Chỉ nhân sự phụ trách bài (CTV/BTV) mới được thêm CTA' }, { status: 403 })
      }
      await prisma.article.update({
        where: { id: params.id },
        data: { ctaContent: body.ctaContent || '' },
      })
      return NextResponse.json({ success: true, message: 'Đã lưu CTA' })
    }

    // ─── Standard state transitions ───
    const transition = ACTION_TO_STATUS[action]
    if (!transition) {
      return NextResponse.json({ error: `Action "${action}" không hợp lệ` }, { status: 400 })
    }

    if (!transition.from.includes(currentStatus)) {
      return NextResponse.json({ 
        error: `Không thể "${action}" từ trạng thái "${currentStatus}"` 
      }, { status: 400 })
    }

    // Lead/Superadmin có quyền override_article_state → bypass canTransition
    const isAdmin = user.role === 'lead' || user.role === 'superadmin'
    if (!isAdmin && !canTransition(user.role, currentStatus, transition.to)) {
      return NextResponse.json({ 
        error: `Role "${user.role}" không có quyền "${action}"` 
      }, { status: 403 })
    }

    // ─── Build update data ───
    const updateData: Record<string, any> = {
      workflowStatus: transition.to,
    }

    switch (action) {
      case 'submit':
        // Nếu bài đã có assignedBsId (đã từng assign BS) → quay lại đúng BS cũ (under_review)
        // thay vì đi qua HĐYK phân bổ lại (pending_bs_review)
        if (article.assignedBsId && currentStatus === 'needs_revision') {
          updateData.workflowStatus = 'under_review'
        }
        if (body.specialty) updateData.specialty = body.specialty
        break

      case 'approve':
        // BS approve — chỉ BS được assign mới được duyệt
        if (user.role === 'bs' && article.assignedBsId !== user.id) {
          return NextResponse.json({ error: 'Bạn không được assign bài này' }, { status: 403 })
        }
        updateData.approvedBy = user.id
        break

      case 'reject':
        // Bắt buộc 3 trường theo IMMUTABLE_4
        if (!body.rejectionReason || !body.inlineComments || !body.revisionChecklist) {
          return NextResponse.json({ 
            error: 'Khi từ chối bài, bắt buộc điền: lý do từ chối, comment inline, và checklist chỉnh sửa' 
          }, { status: 400 })
        }
        if (user.role === 'bs' && article.assignedBsId !== user.id) {
          return NextResponse.json({ error: 'Bạn không được assign bài này' }, { status: 403 })
        }
        updateData.rejectionReason = body.rejectionReason
        updateData.inlineComments = JSON.stringify(body.inlineComments)
        updateData.revisionChecklist = JSON.stringify(body.revisionChecklist)
        updateData.revisionCount = (article.revisionCount || 0) + 1
        break

      case 'request_revision':
        // BS yêu cầu điều chỉnh nhẹ — chỉ cần ghi chú, không bắt buộc 3 trường như reject
        if (user.role === 'bs' && article.assignedBsId !== user.id) {
          return NextResponse.json({ error: 'Bạn không được assign bài này' }, { status: 403 })
        }
        if (body.rejectionReason) updateData.rejectionReason = body.rejectionReason
        if (body.inlineComments) updateData.inlineComments = JSON.stringify(body.inlineComments)
        if (body.revisionChecklist) updateData.revisionChecklist = JSON.stringify(body.revisionChecklist)
        updateData.revisionCount = (article.revisionCount || 0) + 1
        break

      case 'override_approve':
        // HĐYK override — không yêu cầu 3 trường
        updateData.approvedBy = user.id
        break

      case 'publish':
        if (!isContentOwner) {
          return NextResponse.json({ error: 'Chỉ nhân sự phụ trách bài (CTV/BTV) mới được publish' }, { status: 403 })
        }
        updateData.publishedAt = new Date()
        break

      case 'close':
        updateData.closedAt = new Date()
        updateData.closedBy = user.id
        break
    }

    const updated = await prisma.article.update({
      where: { id: params.id },
      data: updateData,
    })

    // ─── Log workflow action (non-blocking) ───
    try {
      const finalToStatus = (updateData.workflowStatus as string) || currentStatus
      await prisma.workflowLog.create({
        data: {
          articleId: params.id,
          action,
          fromStatus: currentStatus,
          toStatus: finalToStatus,
          actorId: user.id,
          actorName: user.name || 'Unknown',
          actorRole: user.role,
          note: body.rejectionReason || body.note || null,
        },
      })
    } catch (logErr) {
      console.error('[WorkflowLog] Failed to create log:', logErr)
    }

    return NextResponse.json({ 
      success: true, 
      workflowStatus: updated.workflowStatus,
      message: getActionMessage(action),
    })

  } catch (err) {
    console.error('[PATCH /api/articles/:id/workflow]', err instanceof Error ? err.message : err)
    console.error('[PATCH /api/articles/:id/workflow] Stack:', err instanceof Error ? err.stack : '')
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}

function getActionMessage(action: WorkflowAction): string {
  const messages: Record<WorkflowAction, string> = {
    submit: 'Đã nộp bài lên hàng đợi duyệt y khoa',
    approve: 'Đã duyệt bài — chờ CTV thêm CTA',
    reject: 'Đã từ chối bài — trả về CTV',
    request_revision: 'Đã yêu cầu CTV điều chỉnh — bài sẽ quay lại BS sau khi sửa',
    add_cta: 'Đã lưu CTA',
    publish: 'Đã xuất bản bài viết',
    close: 'Đã đóng bài viết',
    reassign_bs: 'Đã chuyển bài sang BS khác',
    override_approve: 'HĐYK đã override — duyệt bài',
  }
  return messages[action] || 'Thành công'
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, SESSION_COOKIE, dbUserToAuthUser } from '@/lib/auth'

/**
 * POST /api/articles/batch-assign
 * 
 * BTV: assign articles → CTV (assignedCtvId)
 * HĐYK/Lead/Superadmin: assign articles → BS (assignedBsId) + change status to under_review
 * 
 * Body: { articleIds: string[], assigneeId: string, assigneeType: 'ctv' | 'bs' }
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value
    const actor = await getSessionUser(token ?? '')
    if (!actor) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

    const payload = await request.json()

    // ─── NEW: Mảng assignments (dành cho Auto-Assign Override) ───
    if (payload.assignments && Array.isArray(payload.assignments)) {
      if (!['hdyk', 'lead', 'superadmin'].includes(actor.role)) {
        return NextResponse.json({ error: 'Chỉ HĐYK, Lead, Superadmin mới được dùng tính năng chia mảng BS' }, { status: 403 })
      }
      
      let successCount = 0;
      for (const assignment of payload.assignments) {
        if (!assignment.articleId || !assignment.bsId) continue;
        await prisma.article.update({
          where: { id: assignment.articleId },
          data: {
            assignedBsId: assignment.bsId,
            workflowStatus: 'under_review',
            assignedBy: actor.id
          }
        });
        successCount++;
      }
      
      return NextResponse.json({
        success: true,
        updatedCount: successCount,
        message: `Đã phân công thành công ${successCount} bài cho Bác sĩ.`
      });
    }

    // ─── OLD: Phân công hàng loạt 1 người duy nhất ───
    const { articleIds, assigneeId, assigneeType } = payload

    if (!articleIds?.length || !assigneeId || !assigneeType) {
      return NextResponse.json({ error: 'Thiếu articleIds, assigneeId, hoặc assigneeType' }, { status: 400 })
    }

    // Permission check
    if (assigneeType === 'ctv') {
      // BTV, Lead, Superadmin can assign CTV
      if (!['btv', 'lead', 'superadmin'].includes(actor.role)) {
        return NextResponse.json({ error: 'Chỉ BTV trở lên mới được assign CTV' }, { status: 403 })
      }
    } else if (assigneeType === 'bs') {
      // HĐYK, Lead, Superadmin can assign BS
      if (!['hdyk', 'lead', 'superadmin'].includes(actor.role)) {
        return NextResponse.json({ error: 'Chỉ HĐYK trở lên mới được assign BS' }, { status: 403 })
      }
    } else {
      return NextResponse.json({ error: 'assigneeType phải là "ctv" hoặc "bs"' }, { status: 400 })
    }

    // Validate assignee exists and has correct role
    const assignee = await prisma.user.findUnique({ where: { id: assigneeId } })
    if (!assignee || !assignee.isActive) {
      return NextResponse.json({ error: 'Người được assign không tồn tại hoặc đã bị vô hiệu' }, { status: 404 })
    }
    if (assigneeType === 'ctv') {
      if (['lead', 'superadmin'].includes(actor.role)) {
        if (!['ctv', 'btv'].includes(assignee.role)) {
          return NextResponse.json({ error: 'Người được assign phải có role CTV hoặc BTV' }, { status: 400 })
        }
      } else {
        if (assignee.role !== 'ctv') {
          return NextResponse.json({ error: 'Người được assign phải có role CTV' }, { status: 400 })
        }
      }
    }
    if (assigneeType === 'bs' && assignee.role !== 'bs') {
      return NextResponse.json({ error: 'Người được assign phải có role BS' }, { status: 400 })
    }

    // Build update data
    const updateData: Record<string, any> = { assignedBy: actor.id }
    if (assigneeType === 'ctv') {
      updateData.assignedCtvId = assigneeId
    } else {
      updateData.assignedBsId = assigneeId
      updateData.workflowStatus = 'under_review' // Move to under_review when BS assigned
    }

    // Batch update
    const result = await prisma.article.updateMany({
      where: { id: { in: articleIds } },
      data: updateData,
    })

    // Log workflow for each article
    const logAction = assigneeType === 'bs' ? 'assign_bs' : 'assign_ctv'
    const logToStatus = assigneeType === 'bs' ? 'under_review' : 'pending_bs_review'
    await Promise.all(articleIds.map(artId =>
      prisma.workflowLog.create({
        data: {
          articleId: artId,
          action: logAction,
          fromStatus: 'pending_bs_review',
          toStatus: logToStatus,
          actorId: actor.id,
          actorName: actor.name,
          actorRole: actor.role,
          note: `Phân bổ cho ${assignee.name}`,
        },
      })
    ))

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
      assigneeName: assignee.name,
      assigneeType,
      message: `Đã assign ${result.count} bài cho ${assignee.name}`,
    })
  } catch (err) {
    console.error('[POST /api/articles/batch-assign]', err)
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}

/**
 * GET /api/articles/batch-assign?role=ctv|bs
 * Returns list of active users with the given role for the assign picker
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value
    const actor = await getSessionUser(token ?? '')
    if (!actor) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')

    if (!role || !['ctv', 'bs'].includes(role)) {
      return NextResponse.json({ error: 'role phải là "ctv" hoặc "bs"' }, { status: 400 })
    }

    const targetRoles = role === 'ctv' && ['lead', 'superadmin'].includes(actor.role) ? ['ctv', 'btv'] : [role];

    const users = await prisma.user.findMany({
      where: { role: { in: targetRoles }, isActive: true },
      select: {
        id: true, name: true, email: true, role: true,
        specialties: true, capacity: true, isActive: true, createdAt: true,
      },
      orderBy: { name: 'asc' },
    })

    // For BS, also count current assigned articles
    const usersWithLoad = await Promise.all(users.map(async (u) => {
      const authUser = dbUserToAuthUser(u)
      if (role === 'bs') {
        const assignedCount = await prisma.article.count({
          where: { assignedBsId: u.id, workflowStatus: 'under_review' },
        })
        return { ...authUser, currentLoad: assignedCount }
      }
      if (role === 'ctv') {
        const assignedCount = await prisma.article.count({
          where: { assignedCtvId: u.id, workflowStatus: { in: ['draft', 'needs_revision'] } },
        })
        return { ...authUser, currentLoad: assignedCount }
      }
      return authUser
    }))

    return NextResponse.json({ users: usersWithLoad })
  } catch (err) {
    console.error('[GET /api/articles/batch-assign]', err)
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}

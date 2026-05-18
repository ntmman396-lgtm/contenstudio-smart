import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, SESSION_COOKIE } from '@/lib/auth'

/**
 * POST /api/articles/:id/assign-bs
 * Auto-assign BS theo chuyên khoa + load balancing
 * Gọi bởi: HĐYK manual hoặc system tự động khi bài vào pending_bs_review
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value
    const user = await getSessionUser(token ?? '')
    if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

    // Chỉ HĐYK, Lead, Superadmin mới trigger assign
    if (!['hdyk', 'lead', 'superadmin'].includes(user.role)) {
      return NextResponse.json({ error: 'Không có quyền assign BS' }, { status: 403 })
    }

    const article = await prisma.article.findUnique({ where: { id: params.id } })
    if (!article) return NextResponse.json({ error: 'Bài viết không tồn tại' }, { status: 404 })

    if (article.workflowStatus !== 'pending_bs_review') {
      return NextResponse.json({ error: 'Bài chưa ở trạng thái chờ assign BS' }, { status: 400 })
    }

    // Nếu HĐYK chỉ định BS cụ thể
    const body = await request.json().catch(() => ({}))
    if (body.bsId) {
      await prisma.article.update({
        where: { id: params.id },
        data: { 
          assignedBsId: body.bsId, 
          workflowStatus: 'under_review' 
        },
      })
      return NextResponse.json({ success: true, assignedBsId: body.bsId, method: 'manual' })
    }

    // Auto-assign: tìm BS phù hợp nhất thông qua hàm chung
    const { autoAssignDoctor } = await import('@/lib/assignment')
    const result = await autoAssignDoctor(params.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error, alertHdyk: result.alertHdyk }, { status: 404 })
    }

    return NextResponse.json(result)

  } catch (err) {
    console.error('[POST /api/articles/:id/assign-bs]', err)
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}

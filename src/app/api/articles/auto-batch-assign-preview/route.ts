import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, SESSION_COOKIE } from '@/lib/auth'

/**
 * POST /api/articles/auto-batch-assign-preview
 * Trả về danh sách preview giả lập việc auto assign cho HĐYK xem trước.
 * Body: { articleIds: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value
    const user = await getSessionUser(token ?? '')
    if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

    // Chỉ HĐYK, Lead, Superadmin
    if (!['hdyk', 'lead', 'superadmin'].includes(user.role)) {
      return NextResponse.json({ error: 'Không có quyền preview auto-assign' }, { status: 403 })
    }

    const { articleIds } = await request.json()
    if (!Array.isArray(articleIds) || articleIds.length === 0) {
      return NextResponse.json({ error: 'Danh sách bài viết trống' }, { status: 400 })
    }

    const { autoAssignDoctor } = await import('@/lib/assignment')

    const previews = []

    for (const articleId of articleIds) {
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        select: { id: true, title: true, specialty: true, category: true, workflowStatus: true }
      })

      if (!article) {
        previews.push({ articleId, error: 'Bài viết không tồn tại' })
        continue
      }
      if (article.workflowStatus !== 'pending_bs_review') {
        previews.push({ articleId, title: article.title, error: 'Chỉ hỗ trợ gán BS cho trạng thái chờ duyệt y khoa' })
        continue
      }

      // Gọi autoAssignDoctor với tham số previewMode = true
      const result = await autoAssignDoctor(articleId, undefined, true)

      if (result.success) {
        previews.push({
          articleId,
          title: article.title,
          specialty: article.specialty || article.category,
          suggestedBsId: result.assignedBsId,
          suggestedBsName: result.assignedBsName,
          score: result.score,
        })
      } else {
        previews.push({
          articleId,
          title: article.title,
          error: result.error,
        })
      }
    }

    return NextResponse.json({ previews })

  } catch (err) {
    console.error('[POST /api/articles/auto-batch-assign-preview]', err)
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}

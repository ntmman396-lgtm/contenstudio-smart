import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, SESSION_COOKIE } from '@/lib/auth'

// GET /api/articles/:id/workflow-logs — Lấy lịch sử workflow của bài viết
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value
    const user = await getSessionUser(token ?? '')
    if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

    const logs = await prisma.workflowLog.findMany({
      where: { articleId: params.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ logs })
  } catch (err) {
    console.error('[GET /api/articles/:id/workflow-logs]', err)
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}

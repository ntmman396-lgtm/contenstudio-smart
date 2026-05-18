import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, SESSION_COOKIE } from '@/lib/auth'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value
    const user = await getSessionUser(token ?? '')
    if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const roleQuery = searchParams.get('role')

    let whereClause: any = { isActive: true }
    if (roleQuery) {
      whereClause.role = roleQuery
    } else {
      whereClause.role = { in: ['bs', 'ctv'] }
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        specialties: true,
        capacity: true,
      }
    })

    // Prepare queries for article counts
    // For BS: count by assignedBsId and specific workflowStatus = under_review
    // For CTV: count by assignedCtvId
    const userIdStrings = users.map(u => u.id)

    const bsAssigned = await prisma.article.groupBy({
      by: ['assignedBsId', 'workflowStatus'],
      where: { assignedBsId: { in: userIdStrings } },
      _count: { id: true },
    })

    const ctvAssigned = await prisma.article.groupBy({
      by: ['assignedCtvId', 'workflowStatus'],
      where: { assignedCtvId: { in: userIdStrings } },
      _count: { id: true },
    })

    const stats = users.map(u => {
      let activeCount = 0
      let totalCount = 0
      let details: Record<string, number> = {}

      if (u.role === 'bs') {
        const theirRows = bsAssigned.filter(r => r.assignedBsId === u.id)
        theirRows.forEach(row => {
          totalCount += row._count.id
          if (row.workflowStatus === 'under_review') {
            activeCount += row._count.id
          }
          if (row.workflowStatus) {
            details[row.workflowStatus] = (details[row.workflowStatus] || 0) + row._count.id
          }
        })
      } else if (u.role === 'ctv') {
        const theirRows = ctvAssigned.filter(r => r.assignedCtvId === u.id)
        theirRows.forEach(row => {
          totalCount += row._count.id
          if (['draft', 'needs_revision', 'cta_pending'].includes(row.workflowStatus || '')) {
            activeCount += row._count.id
          }
          if (row.workflowStatus) {
            details[row.workflowStatus] = (details[row.workflowStatus] || 0) + row._count.id
          }
        })
      }

      return {
        ...u,
        specialties: u.specialties ? JSON.parse(u.specialties as string) : [],
        stats: {
          activeCount,
          totalCount,
          details
        }
      }
    })

    return NextResponse.json({ users: stats })
  } catch (error: any) {
    console.error('Failed to get user stats:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

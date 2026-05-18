import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, hashPassword, dbUserToAuthUser, SESSION_COOKIE } from '@/lib/auth'
import { requirePermission, PermissionError } from '@/lib/permissions'
import { ASSIGNABLE_ROLES_BY } from '@/types/auth'
import type { Role } from '@/types/auth'

// GET /api/auth/users — danh sách user (lead+)
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value
    const actor = await getSessionUser(token ?? '')
    if (!actor) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

    requirePermission(actor.role, 'create_account')

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, email: true, name: true, role: true,
        isActive: true, specialties: true, capacity: true,
        createdAt: true, createdBy: true,
      },
    })

    return NextResponse.json({ users: users.map(u => dbUserToAuthUser(u)) })
  } catch (err) {
    if (err instanceof PermissionError) return NextResponse.json({ error: err.message }, { status: 403 })
    console.error('[GET /api/auth/users]', err)
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}

// POST /api/auth/users — tạo user mới (lead+)
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value
    const actor = await getSessionUser(token ?? '')
    if (!actor) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

    requirePermission(actor.role, 'create_account')

    const body = await request.json()
    const { email, name, role, password, specialties, capacity } = body

    if (!email || !name || !role || !password) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 })
    }

    // Kiểm tra quyền gán role này
    const assignable = ASSIGNABLE_ROLES_BY[actor.role] as Role[]
    if (!assignable.includes(role)) {
      return NextResponse.json({ error: `Không được phép gán role "${role}"` }, { status: 403 })
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      return NextResponse.json({ error: 'Email đã tồn tại' }, { status: 409 })
    }

    const hashed = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name.trim(),
        role,
        password: hashed,
        specialties: specialties ? JSON.stringify(specialties) : null,
        capacity: capacity ?? null,
        createdBy: actor.id,
      },
    })

    return NextResponse.json({ user: dbUserToAuthUser(user) }, { status: 201 })
  } catch (err) {
    if (err instanceof PermissionError) return NextResponse.json({ error: err.message }, { status: 403 })
    console.error('[POST /api/auth/users]', err)
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, hashPassword, dbUserToAuthUser, SESSION_COOKIE } from '@/lib/auth'
import { requirePermission, PermissionError } from '@/lib/permissions'
import { ASSIGNABLE_ROLES_BY } from '@/types/auth'
import type { Role } from '@/types/auth'

// PATCH /api/auth/users/[id] — cập nhật user
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value
    const actor = await getSessionUser(token ?? '')
    if (!actor) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

    requirePermission(actor.role, 'create_account')

    const target = await prisma.user.findUnique({ where: { id: params.id } })
    if (!target) return NextResponse.json({ error: 'Không tìm thấy user' }, { status: 404 })

    // Không cho phép tự sửa role của mình
    const body = await request.json()
    const { name, role, password, isActive, specialties, capacity } = body

    // Kiểm tra quyền gán role mới
    if (role && role !== target.role) {
      const assignable = ASSIGNABLE_ROLES_BY[actor.role] as Role[]
      if (!assignable.includes(role)) {
        return NextResponse.json({ error: `Không được phép gán role "${role}"` }, { status: 403 })
      }
      // Không ai được tự thay đổi role superadmin trừ superadmin khác
      if (target.role === 'superadmin' && actor.role !== 'superadmin') {
        return NextResponse.json({ error: 'Không thể thay đổi role Superadmin' }, { status: 403 })
      }
    }

    const updateData: any = {}
    if (name)        updateData.name        = name.trim()
    if (role)        updateData.role        = role
    if (password)    updateData.password    = await hashPassword(password)
    if (isActive !== undefined) updateData.isActive = isActive
    if (specialties !== undefined) updateData.specialties = JSON.stringify(specialties)
    if (capacity    !== undefined) updateData.capacity    = capacity

    const updated = await prisma.user.update({ where: { id: params.id }, data: updateData })
    return NextResponse.json({ user: dbUserToAuthUser(updated) })
  } catch (err) {
    if (err instanceof PermissionError) return NextResponse.json({ error: err.message }, { status: 403 })
    console.error('[PATCH /api/auth/users/[id]]', err)
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}

// DELETE /api/auth/users/[id] — vô hiệu hóa (không xóa thật)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value
    const actor = await getSessionUser(token ?? '')
    if (!actor) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

    requirePermission(actor.role, 'deactivate_account')

    if (actor.id === params.id) {
      return NextResponse.json({ error: 'Không thể vô hiệu hóa tài khoản của chính mình' }, { status: 400 })
    }

    await prisma.user.update({ where: { id: params.id }, data: { isActive: false } })
    // Xóa session của user bị vô hiệu hóa
    await prisma.session.deleteMany({ where: { userId: params.id } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof PermissionError) return NextResponse.json({ error: err.message }, { status: 403 })
    console.error('[DELETE /api/auth/users/[id]]', err)
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}

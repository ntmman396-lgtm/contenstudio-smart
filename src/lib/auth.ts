import crypto from 'crypto'
import { prisma } from './prisma'
import type { AuthUser } from '@/types/auth'

const SESSION_COOKIE = 'session_token'
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 ngày

// ─── Password ────────────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex')
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err)
      resolve(`${salt}:${derivedKey.toString('hex')}`)
    })
  })
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(':')
    if (!salt || !key) return resolve(false)
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err)
      resolve(derivedKey.toString('hex') === key)
    })
  })
}

// ─── Session ─────────────────────────────────────────────────────────────────

export async function createSession(userId: string): Promise<string> {
  // Xóa session cũ của user trước khi tạo mới (giới hạn 1 session/user)
  await prisma.session.deleteMany({ where: { userId } })

  const token = crypto.randomBytes(32).toString('hex')
  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
    },
  })
  return token
}

export async function getSessionUser(token: string): Promise<AuthUser | null> {
  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session) return null
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { token } }).catch(() => {})
    return null
  }
  if (!session.user.isActive) return null

  return dbUserToAuthUser(session.user)
}

export async function deleteSession(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { token } })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function dbUserToAuthUser(user: any): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    specialties: user.specialties ? JSON.parse(user.specialties) : [],
    capacity: user.capacity ?? null,
    createdAt: user.createdAt instanceof Date
      ? user.createdAt.toISOString()
      : user.createdAt,
  }
}

export { SESSION_COOKIE }

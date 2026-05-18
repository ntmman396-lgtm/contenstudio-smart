import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, SESSION_COOKIE } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!token) return NextResponse.json({ user: null }, { status: 401 })

  const user = await getSessionUser(token)
  if (!user) return NextResponse.json({ user: null }, { status: 401 })

  return NextResponse.json({ user })
}

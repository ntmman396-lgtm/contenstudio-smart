import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, SESSION_COOKIE } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!token) {
    const response = NextResponse.json({ user: null }, { status: 401 })
    response.cookies.delete(SESSION_COOKIE)
    return response
  }

  const user = await getSessionUser(token)
  if (!user) {
    const response = NextResponse.json({ user: null }, { status: 401 })
    response.cookies.delete(SESSION_COOKIE)
    return response
  }

  return NextResponse.json({ user })
}

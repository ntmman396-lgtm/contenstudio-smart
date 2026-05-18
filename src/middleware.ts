import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIE = 'session_token'

// API routes tự xử lý auth, không redirect

// Page routes không cần auth
const PUBLIC_PAGE_PATHS = ['/login']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Bỏ qua static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2)$/)
  ) {
    return NextResponse.next()
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value

  // API routes: không redirect — các route tự trả 401/403
  if (pathname.startsWith('/api/')) {
    // Chỉ public auth endpoints không cần kiểm tra
    return NextResponse.next()
  }

  // Page routes
  const isPublicPage = PUBLIC_PAGE_PATHS.some(p => pathname.startsWith(p))

  // Đã login mà vào /login → về home
  if (isPublicPage && sessionToken) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Chưa login mà vào protected page → /login
  if (!isPublicPage && !sessionToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

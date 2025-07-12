import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { NextRequest } from 'next/server'
import { ratelimit } from '@/lib/ratelimit'
import { addSecurityHeaders } from '@/lib/security'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const isAuthenticated = !!token
  const isApproved = token?.isApproved === true
  const path = request.nextUrl.pathname

  // 공개 경로 (인증 불필요)
  const publicPaths = [
    '/auth/signin',
    '/auth/register',
    '/auth/error',
    '/api/register',
  ]

  // API 경로는 별도 처리
  if (path.startsWith('/api/')) {
    // API 요청에 대한 rate limiting 적용
    if (process.env.NODE_ENV === 'production') {
      try {
        // IP 주소 또는 토큰 ID를 기반으로 식별자 생성
        const identifier = token?.id || request.ip || 'anonymous'
        const { success, limit, reset, remaining } = await ratelimit.limit(identifier)

        // Rate limit 응답 헤더 추가
        const response = success ? NextResponse.next() : NextResponse.json(
          { error: 'Too many requests' },
          { status: 429 }
        )

        response.headers.set('X-RateLimit-Limit', limit.toString())
        response.headers.set('X-RateLimit-Remaining', remaining.toString())
        response.headers.set('X-RateLimit-Reset', reset.toString())

        // 보안 헤더 추가
        return addSecurityHeaders(response)
      } catch (error) {
        console.error('Rate limiting error:', error)
        // Rate limiting에 실패해도 요청은 처리 (안전 장치)
        const response = NextResponse.next()
        return addSecurityHeaders(response)
      }
    }
    const response = NextResponse.next()
    return addSecurityHeaders(response)
  }

  // 승인 대기 페이지
  if (path === '/auth/pending-approval') {
    // 로그인하지 않은 경우 로그인 페이지로
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }
    // 이미 승인된 경우 홈으로
    if (isApproved) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // 공개 경로는 통과
  if (publicPaths.includes(path)) {
    return NextResponse.next()
  }

  // 인증되지 않은 경우 로그인 페이지로
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  // 인증되었지만 승인되지 않은 경우 승인 대기 페이지로
  if (!isApproved) {
    return NextResponse.redirect(new URL('/auth/pending-approval', request.url))
  }

  // 학원이 선택되지 않은 경우 학원 선택 페이지로 리다이렉트
  // 단, SUPER_ADMIN 역할이거나 학원 선택 페이지나 API 요청은 제외
  if (
    token.academyId === null && 
    token.role !== 'SUPER_ADMIN' &&
    !path.startsWith('/select-academy') && 
    !path.startsWith('/api') && 
    !path.startsWith('/auth')
  ) {
    return NextResponse.redirect(new URL('/select-academy', request.url))
  }

  // 그 외의 경우 통과 (보안 헤더 추가)
  const response = NextResponse.next()
  return addSecurityHeaders(response)
}

// 미들웨어가 적용될 경로 설정
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
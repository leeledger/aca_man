import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * 보안 헤더를 추가하는 함수
 * @param response NextResponse 객체
 * @returns 보안 헤더가 추가된 NextResponse 객체
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // XSS 방지
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // 클릭재킹 방지
  response.headers.set('X-Frame-Options', 'DENY')
  
  // MIME 타입 스니핑 방지
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // 참조자 정보 제한
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // 콘텐츠 보안 정책 설정
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https://api.example.com;"
  )
  
  // HSTS 설정 (프로덕션 환경에서만)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }
  
  return response
}

/**
 * API 응답에 보안 헤더를 추가하는 미들웨어
 * @param request NextRequest 객체
 * @param response NextResponse 객체
 * @returns 보안 헤더가 추가된 NextResponse 객체
 */
export function securityMiddleware(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  return addSecurityHeaders(response)
}
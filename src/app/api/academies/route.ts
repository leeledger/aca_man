import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logApiRequest, logApiError } from '@/lib/logger'

/**
 * 학원 목록 조회 API
 * 모든 사용자가 접근 가능 (로그인 필요 없음)
 */
export async function GET(request: NextRequest) {
  logApiRequest(request, 'GET academies')
  
  try {
    // 모든 학원 목록 조회
    const academies = await prisma.academy.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(academies)
  } catch (error) {
    logApiError(request, error, { message: 'Failed to fetch academies' })
    return NextResponse.json(
      { error: '학원 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}
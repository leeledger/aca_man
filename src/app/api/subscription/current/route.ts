import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/auth-options'

// 동적 라우트 설정 추가
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // 세션 확인
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 관리자 권한 확인
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 현재 활성화된 구독 정보 조회
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVE',
        endDate: {
          gte: new Date(), // 현재 날짜보다 종료일이 이후인 경우
        },
      },
      orderBy: {
        endDate: 'desc', // 가장 나중에 끝나는 구독
      },
    })

    if (!subscription) {
      return NextResponse.json(null, { status: 404 })
    }

    return NextResponse.json(subscription, { status: 200 })
  } catch (error) {
    console.error('구독 정보 조회 오류:', error)
    return NextResponse.json(
      { error: '구독 정보 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
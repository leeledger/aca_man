import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/auth-options'
import { logApiRequest, logApiError } from '@/lib/logger'

export async function GET(request: NextRequest) {
  logApiRequest(request, 'GET approved-users')
  try {
    // 관리자 권한 확인
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN' || !session.user.isApproved) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 승인된 사용자 목록 조회 (관리자 역할만)
    const approvedUsers = await prisma.user.findMany({
      where: { 
        isApproved: true,
        role: 'ADMIN' // 원장(관리자)만 조회
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        businessLicense: true,
        role: true,
        createdAt: true,
        updatedAt: true, // 승인 시간을 대략적으로 알 수 있음
        academy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc', // 최근 승인된 순서로 정렬
      },
    })

    return NextResponse.json(approvedUsers, { status: 200 })
  } catch (error) {
    logApiError(request, error, { message: '승인된 사용자 조회 오류' })
    return NextResponse.json(
      { error: '승인된 사용자 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { logApiRequest, logApiError } from '@/lib/logger'

export async function GET(request: NextRequest) {
  logApiRequest(request, 'GET pending-users')
  try {
    // 관리자 권한 확인
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') || !session.user.isApproved) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 승인 대기 중인 사용자 목록 조회 (관리자 역할만)
    const pendingUsers = await prisma.user.findMany({
      where: { 
        isApproved: false,
        role: 'ADMIN' // 원장(관리자)만 승인 대상
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        businessLicense: true,
        role: true,
        createdAt: true,
        academy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(pendingUsers, { status: 200 })
  } catch (error) {
    logApiError(request, error, { message: '승인 대기 사용자 조회 오류' })
    return NextResponse.json(
      { error: '승인 대기 사용자 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
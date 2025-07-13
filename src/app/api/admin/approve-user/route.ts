import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/auth-options'
import { logApiRequest, logApiError } from '@/lib/logger'

export async function POST(request: NextRequest) {
  logApiRequest(request, 'POST approve-user')
  try {
    // 관리자 권한 확인
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') || !session.user.isApproved) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 사용자 존재 확인
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 사용자 승인 상태 업데이트
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isApproved: true },
    })

    return NextResponse.json(
      { 
        message: '사용자가 성공적으로 승인되었습니다.',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          isApproved: updatedUser.isApproved,
        }
      },
      { status: 200 }
    )
  } catch (error) {
    logApiError(request, error, { message: '사용자 승인 오류' })
    return NextResponse.json(
      { error: '사용자 승인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
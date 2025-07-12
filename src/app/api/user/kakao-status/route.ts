import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { logApiRequest, logApiError } from '@/lib/logger'

// 카카오톡 연동 상태 확인 API
export async function GET(request: Request) {
  logApiRequest(request, 'GET kakao-status')
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        isKakaoLinked: true,
        kakaoId: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({
      isKakaoLinked: user.isKakaoLinked || false,
      kakaoId: user.kakaoId || null,
    })
  } catch (error) {
    logApiError(request, error, { message: '카카오톡 연동 상태 확인 실패' })
    return NextResponse.json(
      { error: '카카오톡 연동 상태 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 카카오톡 연동 해제 API
export async function DELETE(request: Request) {
  logApiRequest(request, 'DELETE kakao-status')
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        isKakaoLinked: false,
        kakaoId: null,
        kakaoAccessToken: null,
        kakaoRefreshToken: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: '카카오톡 연동이 해제되었습니다.',
    })
  } catch (error) {
    logApiError(request, error, { message: '카카오톡 연동 해제 실패' })
    return NextResponse.json(
      { error: '카카오톡 연동 해제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
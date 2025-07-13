import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/auth-options'
import prisma from '@/lib/prisma'
import { logApiRequest, logApiError } from '@/lib/logger'

export async function POST(request: Request) {
  logApiRequest(request, 'POST select-academy')
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { academyId } = await request.json()

    if (!academyId) {
      return NextResponse.json(
        { error: '학원 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 학원 존재 여부 확인
    const academy = await prisma.academy.findUnique({
      where: { id: academyId },
    })

    if (!academy) {
      return NextResponse.json(
        { error: '존재하지 않는 학원입니다.' },
        { status: 404 }
      )
    }

    // 사용자 정보 업데이트
    await prisma.user.update({
      where: { id: session.user.id },
      data: { academyId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logApiError(request, error, { message: 'Failed to select academy' })
    return NextResponse.json(
      { error: '학원 선택에 실패했습니다.' },
      { status: 500 }
    )
  }
}
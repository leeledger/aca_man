import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth-options'
import prisma from '@/lib/prisma'
import { hash, compare } from 'bcrypt'
import { logApiRequest, logApiError } from '@/lib/logger'

export async function POST(request: Request) {
  logApiRequest(request, 'POST change-password')
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { currentPassword, newPassword } = body

    // 필수 필드 검증
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.' },
        { status: 400 }
      )
    }

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 현재 비밀번호 검증 (개발 환경에서 비밀번호가 없는 경우 예외 처리)
    if (user.password) {
      const isPasswordValid = await compare(currentPassword, user.password)
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: '현재 비밀번호가 일치하지 않습니다.' },
          { status: 400 }
        )
      }
    } else if (process.env.NODE_ENV !== 'development') {
      // 프로덕션 환경에서는 비밀번호가 없으면 오류
      return NextResponse.json(
        { error: '비밀번호를 설정한 적이 없습니다. 관리자에게 문의하세요.' },
        { status: 400 }
      )
    }

    // 새 비밀번호 해시화
    const hashedPassword = await hash(newPassword, 10)

    // 비밀번호 업데이트
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logApiError(request, error, { message: '비밀번호 변경 오류' })
    return NextResponse.json(
      { error: '비밀번호 변경 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
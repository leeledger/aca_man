import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/auth-options'
import prisma from '@/lib/prisma'
import { logApiRequest, logApiError } from '@/lib/logger'

export async function POST(request: Request) {
  logApiRequest(request, 'POST delete-account')
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  try {
    const userId = session.user.id

    // 사용자의 업무 상태 확인
    const assignedTasks = await prisma.task.findMany({
      where: {
        assignedToId: userId,
        status: { not: 'COMPLETED' }, // 완료되지 않은 업무
      },
    })

    // 완료되지 않은 업무가 있는 경우 탈퇴 불가
    if (assignedTasks.length > 0) {
      return NextResponse.json(
        { error: '완료되지 않은 업무가 있어 탈퇴할 수 없습니다. 모든 업무를 완료하거나 관리자에게 문의하세요.' },
        { status: 400 }
      )
    }

    // 사용자 삭제 (관련 데이터는 cascade 삭제 또는 별도 처리 필요)
    await prisma.user.delete({
      where: { id: userId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logApiError(request, error, { message: 'Failed to delete account' })
    return NextResponse.json(
      { error: '계정 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
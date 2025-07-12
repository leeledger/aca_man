import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

// 업무 상태 변경 이력 조회 API
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const taskId = params.id

    // 업무 존재 여부 확인
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        academy: true,
      },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // 권한 확인: 관리자이거나 해당 업무가 속한 학원의 사용자만 조회 가능
    if (
      session.user.role !== 'ADMIN' &&
      task.academyId !== session.user.academyId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 업무 상태 변경 이력 조회
    const statusHistory = await prisma.taskStatusHistory.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' }, // 최신순 정렬
    })

    return NextResponse.json(statusHistory)
  } catch (error) {
    console.error('Failed to fetch task status history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task status history' },
      { status: 500 }
    )
  }
}
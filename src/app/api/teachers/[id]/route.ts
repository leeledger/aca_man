import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const teacherId = params.id

    // 자기 자신을 삭제하려는 경우 방지
    if (teacherId === session.user.id) {
      return NextResponse.json(
        { error: '자신의 계정은 삭제할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 삭제하려는 사용자 정보 조회
    const userToDelete = await prisma.user.findUnique({
      where: {
        id: teacherId,
      },
    })

    // 존재하지 않는 사용자인 경우
    if (!userToDelete) {
      return NextResponse.json(
        { error: '존재하지 않는 사용자입니다.' },
        { status: 404 }
      )
    }

    // 다른 학원의 사용자를 삭제하려는 경우 방지
    if (userToDelete.academyId !== session.user.academyId) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 강사가 현재 진행 중인 업무가 있는지 확인
    const activeTasksCount = await prisma.task.count({
      where: {
        assignedToId: teacherId,
        status: {
          in: ['REGISTERED', 'CONFIRMED', 'IN_PROGRESS'],
        },
      },
    })

    if (activeTasksCount > 0) {
      return NextResponse.json(
        { error: '진행 중인 업무가 있는 강사는 삭제할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 강사 삭제
    await prisma.user.delete({
      where: {
        id: teacherId,
        academyId: session.user.academyId, // 같은 학원 소속인지 확인
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete teacher:', error)
    return NextResponse.json(
      { error: 'Failed to delete teacher' },
      { status: 500 }
    )
  }
}
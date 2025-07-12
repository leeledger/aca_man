import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { logApiRequest, logApiError } from '@/lib/logger'
import { sendTaskStatusChangeNotification } from '@/lib/kakao'

export async function GET(request: NextRequest) {
  logApiRequest(request, 'GET tasks')
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { assignedToId: session.user.id },
          { createdById: session.user.id },
        ],
      },
      include: {
        assignedTo: {
          select: {
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(tasks)
  } catch (error) {
    logApiError(request, error, { message: 'Failed to fetch tasks' })
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  logApiRequest(request, 'POST tasks')
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { title, description, assignedToId, dueDate, images } = body

    const task = await prisma.task.create({
      data: {
        title,
        description,
        images,
        dueDate: new Date(dueDate),
        assignedToId,
        createdById: session.user.id,
        academyId: session.user.academyId,
      },
      include: {
        assignedTo: true,
        createdBy: true,
      },
    })

    // 업무 생성 알림 전송
    try {
      await sendTaskStatusChangeNotification(
        task,
        task.assignedTo,
        task.createdBy,
        '새 업무'
      );
      console.log(`새 업무 생성 알림 전송 완료: ${task.id}`);
    } catch (error) {
      console.error('업무 생성 알림 전송 실패:', error);
      // 알림 전송 실패해도 API는 성공 처리
    }

    return NextResponse.json(task)
  } catch (error) {
    logApiError(request, error, { message: 'Failed to create task' })
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}
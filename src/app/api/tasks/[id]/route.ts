import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/auth-options'
import prisma from '@/lib/prisma'
import { sendTaskStatusChangeNotification, sendTaskScheduleChangeNotification } from '@/lib/kakao'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const taskId = params.id
    const body = await request.json()
    const { title, description, assignedToId, dueDate, images } = body

    // 현재 업무 정보 조회
    const currentTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignedTo: true,
      },
    })

    if (!currentTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // 권한 확인: 관리자이거나 해당 업무의 담당자만 수정 가능
    if (
      session.user.role !== 'ADMIN' &&
      currentTask.assignedToId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 업무 정보 업데이트
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        title,
        description,
        assignedToId,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        images,
      },
      include: {
        assignedTo: true,
        createdBy: true,
      },
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('Failed to update task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const taskId = params.id
    const body = await request.json()
    const { status, description, newImages, dueDate } = body

    // 현재 업무 정보 조회
    const currentTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignedTo: true,
      },
    })

    if (!currentTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // 권한 확인: 관리자이거나 해당 업무의 담당자만 상태 변경 가능
    if (
      session.user.role !== 'ADMIN' &&
      currentTask.assignedToId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 업데이트할 데이터 준비
    const updateData: any = { status }
    
    // 설명이 제공된 경우 업데이트
    if (description !== undefined) {
      updateData.description = description
    }
    
    // 완료 일정이 제공된 경우 업데이트
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null
    }
    
    // 새 이미지가 제공된 경우 기존 이미지와 병합
    if (newImages) {
      let existingImages: string[] = []
      if (currentTask.images) {
        existingImages = JSON.parse(currentTask.images)
      }
      
      const parsedNewImages = JSON.parse(newImages)
      const allImages = [...existingImages, ...parsedNewImages]
      
      updateData.images = JSON.stringify(allImages)
    }
    
    // 업무 상태 업데이트
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignedTo: true,
        createdBy: true,
      },
    })

    // 상태 변경 시 이력 저장 및 카카오톡 알림 전송
    if (status && status !== currentTask.status) {
      try {
        // 상태 변경 이력 저장
        await prisma.taskStatusHistory.create({
          data: {
            taskId,
            previousStatus: currentTask.status,
            newStatus: status,
            changedById: session.user.id,
            changedByName: session.user.name || '',
            changedByRole: session.user.role,
          },
        });
        
        // 카카오톡 알림 전송
        await sendTaskStatusChangeNotification(
          updatedTask,
          updatedTask.assignedTo,
          updatedTask.createdBy,
          currentTask.status
        );
        console.log(`업무 상태 변경 이력 저장 및 알림 전송 완료: ${taskId}`);
      } catch (error) {
        console.error('업무 상태 변경 이력 저장 또는 알림 전송 실패:', error);
        // 알림 전송 실패해도 API는 성공 처리
      }
    }
    
    // 일정 변경 시 카카오톡 알림 전송
    if (dueDate !== undefined && 
        ((currentTask.dueDate && dueDate && new Date(dueDate).getTime() !== new Date(currentTask.dueDate).getTime()) || 
         (currentTask.dueDate && !dueDate) || 
         (!currentTask.dueDate && dueDate))) {
      try {
        // 일정 변경 사유 추출
        let changeReason = '사유 없음';
        if (description && description !== currentTask.description) {
          const reasonMatch = description.match(/\[일정 변경 사유 - .*?\]\n(.*?)(?=\n\n|$)/s);
          if (reasonMatch && reasonMatch[1]) {
            changeReason = reasonMatch[1].trim();
          }
        }
        
        await sendTaskScheduleChangeNotification(
          updatedTask,
          updatedTask.assignedTo,
          updatedTask.createdBy,
          currentTask.dueDate,
          changeReason
        );
        console.log(`업무 일정 변경 알림 전송 완료: ${taskId}`);
      } catch (error) {
        console.error('업무 일정 변경 알림 전송 실패:', error);
        // 알림 전송 실패해도 API는 성공 처리
      }
    }

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('Failed to update task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}
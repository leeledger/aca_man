import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { sendTaskStatusChangeNotification, sendTaskReminderNotification } from '@/lib/kakao';

// 테스트용 API 라우트 - 개발 환경에서만 사용
export async function GET(request: Request) {
  // 개발 환경이 아니면 접근 거부
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: '개발 환경에서만 사용 가능합니다.' }, { status: 403 });
  }
  
  const session = await getServerSession(authOptions);
  
  // 관리자만 접근 가능
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '관리자만 접근 가능합니다.' }, { status: 401 });
  }
  
  try {
    // 테스트할 업무 ID 가져오기 (URL 파라미터에서)
    const url = new URL(request.url);
    const taskId = url.searchParams.get('taskId');
    
    if (!taskId) {
      return NextResponse.json({ error: '업무 ID가 필요합니다. ?taskId=xxx 형식으로 요청하세요.' }, { status: 400 });
    }
    
    // 업무 정보 조회
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignedTo: true,
        createdBy: true,
      },
    });
    
    if (!task) {
      return NextResponse.json({ error: '업무를 찾을 수 없습니다.' }, { status: 404 });
    }
    
    // 알림 유형 확인 (기본값: status)
    const notificationType = url.searchParams.get('type') || 'status';
    
    // 알림 전송
    if (notificationType === 'status') {
      // 상태 변경 알림 테스트
      await sendTaskStatusChangeNotification(
        task,
        task.assignedTo,
        task.createdBy,
        '테스트 이전 상태'
      );
      
      return NextResponse.json({
        success: true,
        message: '상태 변경 알림 테스트가 성공적으로 전송되었습니다.',
        task: {
          id: task.id,
          title: task.title,
          status: task.status,
        },
      });
    } else if (notificationType === 'reminder') {
      // 마감 시간 알림 테스트
      await sendTaskReminderNotification(task, task.assignedTo);
      
      return NextResponse.json({
        success: true,
        message: '마감 시간 알림 테스트가 성공적으로 전송되었습니다.',
        task: {
          id: task.id,
          title: task.title,
          dueDate: task.dueDate,
        },
      });
    } else {
      return NextResponse.json({ error: '유효하지 않은 알림 유형입니다. type=status 또는 type=reminder를 사용하세요.' }, { status: 400 });
    }
  } catch (error) {
    console.error('알림 테스트 중 오류 발생:', error);
    return NextResponse.json({ error: '알림 테스트 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
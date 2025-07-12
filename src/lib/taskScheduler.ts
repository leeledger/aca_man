import cron from 'node-cron';
import prisma from './prisma';
import { sendTaskReminderNotification } from './kakao';

// 환경 변수에서 알림 시간 설정 (기본값: 3시간 전)
const REMINDER_HOURS_BEFORE = parseInt(process.env.REMINDER_HOURS_BEFORE || '3');

/**
 * 업무 마감 시간 알림 스케줄러 초기화
 * 매시간 실행되며, 마감 시간이 REMINDER_HOURS_BEFORE 시간 이내인 업무에 대해 알림 전송
 */
export function initTaskReminderScheduler() {
  // 개발 환경에서는 스케줄러 비활성화 (선택적)
  if (process.env.NODE_ENV === 'development' && process.env.ENABLE_SCHEDULER !== 'true') {
    console.log('개발 환경에서 업무 알림 스케줄러가 비활성화되었습니다.');
    return;
  }

  // 매시간 0분에 실행 (cron: '0 * * * *')
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('업무 마감 시간 알림 스케줄러 실행 중...');
      
      // 현재 시간
      const now = new Date();
      
      // 알림 시간 범위 계산 (현재 시간 + REMINDER_HOURS_BEFORE 시간)
      const reminderTime = new Date(now.getTime() + (REMINDER_HOURS_BEFORE * 60 * 60 * 1000));
      
      // 알림 대상 업무 조회: 
      // 1. 마감 시간이 현재 ~ (현재 + REMINDER_HOURS_BEFORE 시간) 사이
      // 2. 상태가 'REGISTERED' 또는 'IN_PROGRESS'인 업무
      const tasks = await prisma.task.findMany({
        where: {
          dueDate: {
            gte: now,
            lte: reminderTime,
          },
          status: {
            in: ['REGISTERED', 'IN_PROGRESS'],
          },
        },
        include: {
          assignedTo: true,
        },
      });
      
      console.log(`알림 대상 업무 수: ${tasks.length}`);
      
      // 각 업무에 대해 알림 전송
      for (const task of tasks) {
        try {
          await sendTaskReminderNotification(task, task.assignedTo);
          console.log(`업무 마감 알림 전송 완료: ${task.id} - ${task.title}`);
          
          // 알림 전송 후 업무 상태 업데이트 (선택적)
          // await prisma.task.update({
          //   where: { id: task.id },
          //   data: { reminderSent: true },
          // });
        } catch (error) {
          console.error(`업무 마감 알림 전송 실패 (${task.id}):`, error);
        }
      }
    } catch (error) {
      console.error('업무 마감 시간 알림 스케줄러 오류:', error);
    }
  });
  
  console.log('업무 마감 시간 알림 스케줄러가 초기화되었습니다.');
}
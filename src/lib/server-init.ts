import { initTaskReminderScheduler } from './taskScheduler';
import { validateAllEnvVariables } from './env-validator';

// 서버 초기화 함수
export function initServer() {
  // 환경 변수 검증
  validateAllEnvVariables();
  
  // 업무 마감 시간 알림 스케줄러 초기화
  initTaskReminderScheduler();
  
  console.log('서버 초기화가 완료되었습니다.');
}
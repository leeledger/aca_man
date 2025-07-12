import { initServer } from '@/lib/server-init';

// 서버가 시작될 때 한 번만 실행되는 초기화 코드
let isInitialized = false;

export function initializeServer() {
  if (isInitialized) return;
  
  try {
    // 서버 초기화 함수 호출
    initServer();
    isInitialized = true;
    console.log('서버가 성공적으로 초기화되었습니다.');
  } catch (error) {
    console.error('서버 초기화 중 오류 발생:', error);
  }
}
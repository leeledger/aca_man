// 테스트 알림 전송 스크립트
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // 관리자 사용자 찾기
    const adminUser = await prisma.user.findFirst({
      where: {
        role: 'ADMIN',
        isKakaoLinked: true
      }
    });

    if (!adminUser) {
      console.error('카카오 연동된 관리자 사용자를 찾을 수 없습니다.');
      return;
    }

    console.log(`관리자 사용자: ${adminUser.name} (${adminUser.email})`);

    // 테스트할 업무 ID
    const taskId = 'cmczo2zaj000112dhvjzpljza'; // 테스트업무 ID
    
    // 테스트 알림 API 호출
    const response = await axios.get(
      `http://localhost:3002/api/test-notification?taskId=${taskId}&type=status`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('테스트 알림 전송 결과:', response.data);
  } catch (error) {
    console.error('테스트 알림 전송 중 오류 발생:', error.response ? error.response.data : error.message);
    console.log('직접 브라우저에서 다음 URL을 방문하세요 (관리자로 로그인한 상태에서):');
    console.log('http://localhost:3002/api/test-notification?taskId=cmczo2zaj000112dhvjzpljza&type=status');
  } finally {
    await prisma.$disconnect();
  }
}

main();
// 카카오 연동 사용자 확인 스크립트
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // 카카오 연동된 사용자 찾기
    const kakaoLinkedUsers = await prisma.user.findMany({
      where: {
        isKakaoLinked: true
      }
    });

    if (kakaoLinkedUsers.length === 0) {
      console.error('카카오 연동된 사용자를 찾을 수 없습니다.');
      return;
    }

    console.log(`카카오 연동된 사용자 ${kakaoLinkedUsers.length}명 발견:`);
    kakaoLinkedUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}), 역할: ${user.role}`);
      console.log(`  카카오 ID: ${user.kakaoId || '없음'}`);
      console.log(`  액세스 토큰: ${user.kakaoAccessToken ? '있음' : '없음'}`);
      console.log(`  리프레시 토큰: ${user.kakaoRefreshToken ? '있음' : '없음'}`);
      console.log('-----------------------------------');
    });
  } catch (error) {
    console.error('사용자 조회 중 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
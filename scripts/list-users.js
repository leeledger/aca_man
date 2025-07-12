// 사용자 목록 조회 스크립트
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // 사용자 목록 조회
    const users = await prisma.user.findMany();

    console.log('사용자 목록:');
    users.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`이름: ${user.name}`);
      console.log(`이메일: ${user.email}`);
      console.log(`역할: ${user.role}`);
      console.log(`카카오 연동 여부: ${user.isKakaoLinked ? '연동됨' : '연동안됨'}`);
      console.log(`카카오 액세스 토큰: ${user.kakaoAccessToken ? '있음' : '없음'}`);
      console.log(`카카오 리프레시 토큰: ${user.kakaoRefreshToken ? '있음' : '없음'}`);
      console.log(`카카오 ID: ${user.kakaoId ? user.kakaoId : '없음'}`);
      console.log('-----------------------------------');
    });
  } catch (error) {
    console.error('사용자 목록 조회 중 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('카카오 연동 사용자 업데이트 시작...');
    
    // 이메일이 @kakao.com으로 끝나는 사용자들을 찾아서 isKakaoLinked를 true로 설정
    const kakaoUsers = await prisma.user.findMany({
      where: {
        email: {
          endsWith: '@kakao.com'
        }
      }
    });
    
    console.log(`카카오 이메일을 가진 사용자 ${kakaoUsers.length}명 발견`);
    
    // 각 사용자 업데이트
    for (const user of kakaoUsers) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isKakaoLinked: true }
      });
      console.log(`사용자 업데이트 완료: ${user.name || user.email}`);
    }
    
    console.log('카카오 연동 사용자 업데이트 완료');
  } catch (error) {
    console.error('카카오 연동 사용자 업데이트 중 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
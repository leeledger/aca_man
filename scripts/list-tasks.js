// 업무 목록 조회 스크립트
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  try {
    // 업무 목록 조회
    const tasks = await prisma.task.findMany({
      include: {
        assignedTo: true,
        createdBy: true,
      },
      take: 5, // 최대 5개만 조회
    });

    // 결과를 콘솔에 직접 출력
    console.log('업무 목록:');
    tasks.forEach(task => {
      console.log(`ID: ${task.id}`);
      console.log(`제목: ${task.title}`);
      console.log(`상태: ${task.status}`);
      console.log(`담당자: ${task.assignedTo.name} (${task.assignedTo.email})`);
      console.log(`생성자: ${task.createdBy.name} (${task.createdBy.email})`);
      console.log(`카카오 연동 여부(담당자): ${task.assignedTo.isKakaoLinked ? '연동됨' : '연동안됨'}`);
      console.log(`카카오 연동 여부(생성자): ${task.createdBy.isKakaoLinked ? '연동됨' : '연동안됨'}`);
      console.log(`담당자 카카오 액세스 토큰: ${task.assignedTo.kakaoAccessToken ? '있음' : '없음'}`);
      console.log(`담당자 카카오 리프레시 토큰: ${task.assignedTo.kakaoRefreshToken ? '있음' : '없음'}`);
      console.log(`담당자 카카오 ID: ${task.assignedTo.kakaoId ? '있음' : '없음'}`);
      console.log('-----------------------------------');
    });

    // JSON 형식으로 파일에 저장
    const jsonOutput = JSON.stringify(tasks, null, 2);
    fs.writeFileSync('task-list.json', jsonOutput);
    console.log('업무 목록이 task-list.json 파일에 저장되었습니다.');
  } catch (error) {
    console.error('업무 목록 조회 중 오류 발생:', error);
    fs.writeFileSync('task-error.txt', String(error));
  } finally {
    await prisma.$disconnect();
  }
}

main();
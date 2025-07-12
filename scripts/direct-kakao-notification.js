// 카카오 알림 직접 전송 스크립트
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');

// 카카오 API 관련 상수
const KAKAO_API_KEY = process.env.KAKAO_CLIENT_ID;
const KAKAO_ADMIN_KEY = process.env.KAKAO_ADMIN_KEY;

// 메시지 템플릿 ID
const TASK_STATUS_TEMPLATE_ID = process.env.KAKAO_TASK_STATUS_TEMPLATE_ID || '94639';

/**
 * 카카오톡 알림 메시지 전송 함수
 * @param user 사용자 정보 (카카오 토큰 정보 포함)
 * @param templateId 메시지 템플릿 ID
 * @param templateArgs 템플릿 파라미터
 * @param retries 재시도 횟수
 */
async function sendKakaoMessage(user, templateId, templateArgs, retries = 3) {
  try {
    // 개발 환경에서 테스트 모드 확인
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isTestMode = process.env.NOTIFICATION_TEST_MODE === 'true';
    
    // 테스트 모드일 경우 실제 전송하지 않고 로그만 출력
    if (isDevelopment && isTestMode) {
      console.log('테스트 모드: 카카오톡 메시지 전송 시뮬레이션', {
        userId: user.id,
        userName: user.name,
        templateId,
        templateArgs
      });
      return true;
    }
    
    // 카카오 API 키가 없으면 중단
    if (!KAKAO_ADMIN_KEY) {
      console.error('카카오 Admin API 키가 설정되지 않았습니다.');
      return false;
    }

    // 카카오톡 연동 확인
    if (!user.isKakaoLinked || !user.kakaoAccessToken) {
      console.log(`사용자(${user.name || user.email})는 카카오톡 연동이 되어 있지 않습니다.`);
      return false;
    }

    console.log('카카오 액세스 토큰:', user.kakaoAccessToken);

    // 카카오톡 메시지 API 호출
    const response = await axios.post(
      'https://kapi.kakao.com/v2/api/talk/memo/send',
      {
        template_id: templateId,
        template_args: templateArgs
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${user.kakaoAccessToken}`
        }
      }
    );

    console.log(`카카오톡 메시지 전송 성공: ${templateId}`, templateArgs);
    return response.status === 200;
  } catch (error) {
    // 토큰 만료 오류 처리 (401 Unauthorized)
    if (error.response && error.response.status === 401) {
      console.log('카카오 액세스 토큰이 만료되었습니다. 리프레시 토큰으로 갱신을 시도합니다.');
      
      // 리프레시 토큰이 있는 경우 토큰 갱신 시도
      if (user.kakaoRefreshToken) {
        try {
          const tokenResponse = await axios.post(
            'https://kauth.kakao.com/oauth/token',
            {
              grant_type: 'refresh_token',
              client_id: KAKAO_API_KEY,
              refresh_token: user.kakaoRefreshToken
            },
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              }
            }
          );
          
          // 토큰 갱신 성공 시 DB 업데이트 및 재시도
          if (tokenResponse.data.access_token) {
            // 여기서는 DB 업데이트 로직을 직접 구현하지 않고, 로그만 출력
            // 실제로는 prisma.user.update를 통해 DB 업데이트 필요
            console.log('카카오 액세스 토큰 갱신 성공. DB 업데이트 필요');
            
            // 갱신된 토큰으로 메시지 전송 재시도
            const updatedUser = { ...user, kakaoAccessToken: tokenResponse.data.access_token };
            return sendKakaoMessage(updatedUser, templateId, templateArgs, retries);
          }
        } catch (refreshError) {
          console.error('카카오 토큰 갱신 실패:', refreshError);
        }
      }
    }
    
    console.error('카카오톡 메시지 전송 실패:', error.response ? error.response.data : error.message);
    
    // 재시도 로직
    if (retries > 0) {
      console.log(`${retries}회 재시도 중...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
      return sendKakaoMessage(user, templateId, templateArgs, retries - 1);
    }
    
    return false;
  }
}

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
    });

    // 테스트 메시지 전송
    for (const user of kakaoLinkedUsers) {
      console.log(`\n${user.name}에게 테스트 메시지 전송 시도...`);
      
      // 테스트 템플릿 파라미터
      const templateArgs = {
        task_title: '테스트 업무',
        task_id: 'test-123',
        previous_status: '등록됨',
        current_status: '진행중',
        due_date: new Date().toLocaleDateString('ko-KR'),
        updated_at: new Date().toLocaleString('ko-KR')
      };
      
      // 카카오 메시지 직접 전송
      const result = await sendKakaoMessage(user, TASK_STATUS_TEMPLATE_ID, templateArgs);
      
      if (result) {
        console.log(`✅ ${user.name}에게 메시지 전송 성공`);
      } else {
        console.log(`❌ ${user.name}에게 메시지 전송 실패`);
      }
    }
  } catch (error) {
    console.error('카카오 알림 전송 중 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
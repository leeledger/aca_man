// 카카오 알림 직접 테스트 스크립트
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

const prisma = new PrismaClient();

// 로그 파일 설정
const LOG_DIR = 'logs';
const LOG_FILE = `${LOG_DIR}/kakao-test-log-${new Date().toISOString().replace(/:/g, '-')}.txt`;

// 로그 디렉토리가 없으면 생성
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const logStream = fs.createWriteStream(LOG_FILE, { flags: 'w' });

/**
 * 로그 레벨 정의
 */
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

// 현재 로그 레벨 설정 (환경 변수에서 가져오거나 기본값 사용)
const CURRENT_LOG_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] || LOG_LEVELS.INFO;

/**
 * 로그 함수 - 콘솔과 파일에 동시에 로깅
 * @param {any} message - 로깅할 메시지
 * @param {string} level - 로그 레벨 ('debug', 'info', 'warn', 'error')
 */
function log(message, level = 'info') {
  const levelUpper = level.toUpperCase();
  const logLevel = LOG_LEVELS[levelUpper] || LOG_LEVELS.INFO;
  
  // 현재 설정된 로그 레벨보다 낮은 레벨은 출력하지 않음
  if (logLevel < CURRENT_LOG_LEVEL) {
    return;
  }
  
  const timestamp = new Date().toISOString();
  const formattedMessage = typeof message === 'object' 
    ? JSON.stringify(message, null, 2) 
    : message;
  
  const logPrefix = `[${timestamp}] [${levelUpper}]`;
  const outputMessage = `${logPrefix} ${formattedMessage}`;
  
  // 콘솔에 출력 (색상 적용)
  switch(level) {
    case 'debug':
      console.log(`\x1b[36m${outputMessage}\x1b[0m`); // 청록색
      break;
    case 'error':
      console.error(`\x1b[31m${outputMessage}\x1b[0m`); // 빨간색
      break;
    case 'warn':
      console.warn(`\x1b[33m${outputMessage}\x1b[0m`); // 노란색
      break;
    default: // info
      console.log(`\x1b[32m${outputMessage}\x1b[0m`); // 녹색
  }
  
  // 파일에 기록
  logStream.write(outputMessage + '\n');
}

// 카카오 API 관련 상수
const KAKAO_API_KEY = process.env.KAKAO_CLIENT_ID;
const KAKAO_ADMIN_KEY = process.env.KAKAO_ADMIN_KEY;
const TASK_STATUS_TEMPLATE_ID = process.env.KAKAO_TASK_STATUS_TEMPLATE_ID || '122346';
const TASK_SCHEDULE_CHANGE_TEMPLATE_ID = process.env.KAKAO_TASK_SCHEDULE_CHANGE_TEMPLATE_ID || '122346';

log('환경 변수 확인:');
log(`KAKAO_API_KEY: ${KAKAO_API_KEY ? '설정됨' : '설정안됨'}`);
log(`KAKAO_ADMIN_KEY: ${KAKAO_ADMIN_KEY ? '설정됨' : '설정안됨'}`);
log(`TASK_STATUS_TEMPLATE_ID: ${TASK_STATUS_TEMPLATE_ID}`);
log(`TASK_SCHEDULE_CHANGE_TEMPLATE_ID: ${TASK_SCHEDULE_CHANGE_TEMPLATE_ID}`);

/**
 * 카카오 액세스 토큰 갱신 함수
 * @param {object} user - 사용자 정보
 * @returns {Promise<string|null>} - 갱신된 액세스 토큰 또는 null
 */
async function refreshKakaoToken(user) {
  if (!user) {
    log('사용자 정보가 제공되지 않았습니다.', 'error');
    return null;
  }
  
  if (!user.kakaoRefreshToken) {
    log(`사용자(${user.name || user.email})의 리프레시 토큰이 없습니다.`, 'error');
    return null;
  }
  
  if (!KAKAO_API_KEY) {
    log('KAKAO_CLIENT_ID(API 키)가 설정되지 않았습니다.', 'error');
    return null;
  }

  try {
    log(`사용자(${user.name || user.email})의 카카오 액세스 토큰 갱신 시도...`, 'info');
    
    const tokenResponse = await axios.post(
      'https://kauth.kakao.com/oauth/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: KAKAO_API_KEY,
        refresh_token: user.kakaoRefreshToken
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    if (tokenResponse.data.access_token) {
      log(`사용자(${user.name || user.email})의 카카오 액세스 토큰 갱신 성공`, 'info');
      log('토큰 만료 시간: ' + new Date(Date.now() + tokenResponse.data.expires_in * 1000).toLocaleString(), 'debug');
      
      // 리프레시 토큰도 함께 갱신되었는지 확인
      const newRefreshToken = tokenResponse.data.refresh_token;
      
      // DB 업데이트
      try {
        const updateData = { 
          kakaoAccessToken: tokenResponse.data.access_token 
        };
        
        // 새 리프레시 토큰이 있으면 함께 업데이트
        if (newRefreshToken) {
          updateData.kakaoRefreshToken = newRefreshToken;
          log('새 리프레시 토큰도 함께 발급되었습니다.', 'info');
        }
        
        await prisma.user.update({
          where: { id: user.id },
          data: updateData
        });
        
        log(`사용자(${user.name || user.email})의 DB 토큰 정보 업데이트 성공`, 'info');
      } catch (dbError) {
        log(`DB 업데이트 실패: ${dbError.message}`, 'error');
        log('DB 오류가 발생했지만, 메모리에 토큰은 갱신되었습니다.', 'warn');
      }
      
      return tokenResponse.data.access_token;
    }
    
    log('토큰 응답에 액세스 토큰이 없습니다.', 'error');
    return null;
  } catch (error) {
    log(`카카오 토큰 갱신 실패: ${error.message}`, 'error');
    
    if (error.response) {
      log(`응답 상태: ${error.response.status}`, 'error');
      log('응답 데이터:', 'error');
      log(error.response.data, 'error');
      
      // 리프레시 토큰 만료 처리
      if (error.response.status === 400 && 
          error.response.data.error_code === 'KOE320' || 
          (error.response.data.error_description && 
           error.response.data.error_description.includes('refresh token'))) {
        log(`사용자(${user.name || user.email})의 리프레시 토큰이 만료되었습니다. 카카오 연동을 다시 설정해야 합니다.`, 'error');
        
        // 만료된 토큰 정보 초기화 (선택적)
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { 
              kakaoRefreshToken: null,
              kakaoAccessToken: null
            }
          });
          log('만료된 토큰 정보를 DB에서 초기화했습니다.', 'info');
        } catch (dbError) {
          log(`토큰 초기화 실패: ${dbError.message}`, 'error');
        }
      }
    } else if (error.request) {
      log('요청은 전송되었지만 응답이 없습니다:', 'error');
      log(error.request, 'error');
    } else {
      log('요청 설정 중 오류 발생:', 'error');
      log(error.config, 'error');
    }
    
    return null;
  }
}

/**
 * 카카오톡 알림 메시지 전송 함수
 * @param {object} user - 사용자 정보
 * @param {string} templateId - 템플릿 ID
 * @param {object} templateArgs - 템플릿 파라미터
 * @param {number} retries - 재시도 횟수
 * @returns {Promise<boolean>} - 전송 성공 여부
 */
async function sendKakaoMessage(user, templateId, templateArgs, retries = 3) {
  // 기본 검증
  if (!user) {
    log('사용자 정보가 제공되지 않았습니다.', 'error');
    return false;
  }
  
  if (!templateId) {
    log('템플릿 ID가 제공되지 않았습니다.', 'error');
    return false;
  }
  
  if (!templateArgs || Object.keys(templateArgs).length === 0) {
    log('템플릿 파라미터가 제공되지 않았습니다.', 'error');
    return false;
  }
  
  try {
    log(`사용자(${user.name || user.email})에게 카카오 메시지 전송 시도:`, 'info');
    log({
      userId: user.id,
      userName: user.name || user.email,
      templateId,
      templateArgs
    }, 'debug');
    
    // 카카오 API 키가 없으면 중단
    if (!KAKAO_ADMIN_KEY) {
      log('카카오 Admin API 키가 설정되지 않았습니다.', 'error');
      return false;
    }

    // 카카오톡 연동 확인
    if (!user.isKakaoLinked) {
      log(`사용자(${user.name || user.email})는 카카오톡 연동이 되어 있지 않습니다.`, 'warn');
      return false;
    }
    
    // 액세스 토큰 확인
    if (!user.kakaoAccessToken) {
      log(`사용자(${user.name || user.email})의 카카오 액세스 토큰이 없습니다.`, 'warn');
      
      // 리프레시 토큰이 있으면 액세스 토큰 갱신 시도
      if (user.kakaoRefreshToken) {
        log(`리프레시 토큰으로 액세스 토큰 갱신 시도...`, 'info');
        const newAccessToken = await refreshKakaoToken(user);
        if (newAccessToken) {
          const updatedUser = { ...user, kakaoAccessToken: newAccessToken };
          return sendKakaoMessage(updatedUser, templateId, templateArgs, retries);
        } else {
          log(`액세스 토큰 갱신 실패. 메시지를 전송할 수 없습니다.`, 'error');
          return false;
        }
      } else {
        log(`리프레시 토큰도 없습니다. 카카오 연동을 다시 설정해야 합니다.`, 'error');
        return false;
      }
    }

    // 카카오톡 메시지 API 호출
    log(`카카오 API 호출 중... (템플릿 ID: ${templateId})`, 'debug');
    const response = await axios.post(
      'https://kapi.kakao.com/v2/api/talk/memo/send',
      new URLSearchParams({
        template_id: templateId,
        template_args: JSON.stringify(templateArgs)
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${user.kakaoAccessToken}`
        }
      }
    );

    // 응답 확인
    if (response.status === 200) {
      log(`카카오톡 메시지 전송 성공: ${templateId}`, 'info');
      log(`응답 데이터:`, 'debug');
      log(response.data, 'debug');
      return true;
    } else {
      log(`카카오톡 메시지 전송 실패: 예상치 못한 응답 상태 ${response.status}`, 'error');
      log(response.data, 'error');
      return false;
    }
  } catch (error) {
    // 상세 오류 정보 출력
    log(`카카오톡 메시지 전송 실패 (사용자: ${user.name || user.email}, 템플릿: ${templateId}): ${error.message}`, 'error');
    
    if (error.response) {
      log(`응답 상태: ${error.response.status}`, 'error');
      log('응답 데이터:', 'error');
      log(error.response.data, 'error');
      
      // 토큰 만료 오류 처리 (401 Unauthorized)
      if (error.response.status === 401) {
        log(`사용자(${user.name || user.email})의 카카오 액세스 토큰이 만료되었습니다. 리프레시 토큰으로 갱신을 시도합니다.`, 'warn');
        
        // 토큰 갱신 시도
        const newAccessToken = await refreshKakaoToken(user);
        if (newAccessToken) {
          // 갱신된 토큰으로 메시지 전송 재시도
          log(`토큰 갱신 성공. 메시지 전송 재시도...`, 'info');
          const updatedUser = { ...user, kakaoAccessToken: newAccessToken };
          return sendKakaoMessage(updatedUser, templateId, templateArgs, retries);
        } else {
          log(`토큰 갱신 실패. 카카오 연동을 다시 설정해야 할 수 있습니다.`, 'error');
        }
      }
      // 템플릿 관련 오류 처리
      else if (error.response.status === 400) {
        if (error.response.data.code === -3000) {
          log(`템플릿 ID(${templateId})가 유효하지 않습니다.`, 'error');
        } else if (error.response.data.code === -3001) {
          log(`템플릿 파라미터가 유효하지 않습니다.`, 'error');
          log('필요한 파라미터:', 'error');
          log(templateArgs, 'error');
        }
      }
    } else if (error.request) {
      log('요청은 전송되었지만 응답이 없습니다:', 'error');
      log(error.request, 'error');
    } else {
      log('요청 설정 중 오류 발생:', 'error');
      log(error.config, 'error');
    }
    
    // 재시도 로직
    if (retries > 0) {
      const waitTime = 1000 * (4 - retries); // 점점 대기 시간 증가
      log(`사용자(${user.name || user.email})에게 카카오톡 메시지 전송 ${retries}회 재시도 중... (${waitTime}ms 후)`, 'warn');
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return sendKakaoMessage(user, templateId, templateArgs, retries - 1);
    }
    
    return false;
  }
}

/**
 * 환경 변수 검증 함수
 * @returns {boolean} 모든 필수 환경 변수가 설정되어 있으면 true, 아니면 false
 */
function validateEnvironmentVariables() {
  log('환경 변수 검증 시작', 'debug');
  const requiredVars = [
    { name: 'KAKAO_CLIENT_ID', value: KAKAO_API_KEY },
    { name: 'KAKAO_ADMIN_KEY', value: KAKAO_ADMIN_KEY },
    { name: 'KAKAO_TASK_STATUS_TEMPLATE_ID', value: TASK_STATUS_TEMPLATE_ID }
  ];
  
  let isValid = true;
  const missingVars = [];
  
  requiredVars.forEach(variable => {
    log(`${variable.name}: ${variable.value ? '설정됨' : '설정안됨'}`, variable.value ? 'info' : 'warn');
    if (!variable.value) {
      missingVars.push(variable.name);
      isValid = false;
    }
  });
  
  if (!isValid) {
    log(`다음 필수 환경 변수가 설정되지 않았습니다: ${missingVars.join(', ')}`, 'error');
  } else {
    log('모든 필수 환경 변수가 올바르게 설정되었습니다.', 'info');
  }
  
  return isValid;
}

/**
 * 테스트 실행 함수
 */
async function main() {
  log('카카오톡 알림 테스트 시작', 'info');
  log(`로그 파일 경로: ${LOG_FILE}`, 'debug');
  
  try {
    // 환경 변수 검증
    if (!validateEnvironmentVariables()) {
      log('필수 환경 변수가 설정되지 않아 테스트를 중단합니다.', 'error');
      return;
    }
    
    // 데이터베이스 연결 확인
    try {
      await prisma.$queryRaw`SELECT 1`;
      log('데이터베이스 연결 성공', 'info');
    } catch (dbError) {
      log(`데이터베이스 연결 실패: ${dbError.message}`, 'error');
      return;
    }
    
    // 카카오 연동된 사용자 찾기
    log('카카오 연동된 사용자 조회 중...', 'info');
    const kakaoLinkedUsers = await prisma.user.findMany({
      where: {
        isKakaoLinked: true
      }
    });

    if (kakaoLinkedUsers.length === 0) {
      log('카카오 연동된 사용자를 찾을 수 없습니다.', 'error');
      return;
    }

    log(`카카오 연동된 사용자 ${kakaoLinkedUsers.length}명 발견:`, 'info');
    kakaoLinkedUsers.forEach(user => {
      log(`- ${user.name || '이름 없음'} (${user.email}), 역할: ${user.role}`, 'debug');
      log(`  카카오 ID: ${user.kakaoId || '없음'}`, 'debug');
      log(`  액세스 토큰: ${user.kakaoAccessToken ? '있음' : '없음'}`, 'debug');
      log(`  리프레시 토큰: ${user.kakaoRefreshToken ? '있음' : '없음'}`, 'debug');
    });

    // 테스트할 사용자 선택 (robocoding@kakao.com 계정 찾기)
    const testEmail = 'robocoding@kakao.com';
    let testUser = kakaoLinkedUsers.find(user => user.email === testEmail);
    
    if (!testUser) {
      log(`지정된 테스트 사용자(${testEmail})를 찾을 수 없습니다. 첫 번째 사용자로 대체합니다.`, 'warn');
      if (kakaoLinkedUsers.length > 0) {
        testUser = kakaoLinkedUsers[0];
      } else {
        log('테스트할 사용자가 없습니다.', 'error');
        return;
      }
    }
    
    log(`테스트 사용자: ${testUser.name || '이름 없음'} (${testUser.email})`, 'info');

    // 테스트할 업무 찾기
    log('테스트할 업무 조회 중...', 'info');
    const tasks = await prisma.task.findMany({
      take: 1,
      orderBy: { createdAt: 'desc' }
    });

    if (tasks.length === 0) {
      log('테스트할 업무를 찾을 수 없습니다. 새 업무를 생성해주세요.', 'error');
      return;
    }

    const testTask = tasks[0];
    log(`테스트 업무: ${testTask.title} (ID: ${testTask.id})`, 'info');
    log(`업무 상태: ${testTask.status}, 마감일: ${testTask.dueDate ? new Date(testTask.dueDate).toLocaleString('ko-KR') : '없음'}`, 'debug');

    // 상태 변경 메시지 템플릿 파라미터
    const templateArgs = {
      task_title: testTask.title,
      task_id: testTask.id,
      previous_status: testTask.status === '완료' ? '진행중' : '대기중',
      current_status: testTask.status === '완료' ? '완료' : '진행중',
      due_date: testTask.dueDate ? new Date(testTask.dueDate).toLocaleDateString('ko-KR') : '없음',
      updated_at: new Date().toLocaleString('ko-KR')
    };

    // 카카오톡 메시지 전송
    log('카카오톡 메시지 전송 시작...', 'info');
    log('템플릿 파라미터:', 'debug');
    log(templateArgs, 'debug');
    
    const success = await sendKakaoMessage(testUser, TASK_STATUS_TEMPLATE_ID, templateArgs);

    if (success) {
      log(`카카오톡 메시지 전송 성공! 사용자: ${testUser.name || testUser.email}`, 'info');
    } else {
      log(`카카오톡 메시지 전송 실패! 사용자: ${testUser.name || testUser.email}`, 'error');
    }
  } catch (error) {
    log(`테스트 중 오류 발생: ${error.message}`, 'error');
    log(error.stack, 'error');
  } finally {
    try {
      await prisma.$disconnect();
      log('데이터베이스 연결 종료', 'info');
    } catch (err) {
      log(`데이터베이스 연결 종료 중 오류: ${err.message}`, 'error');
    }
    
    logStream.end();
    log(`테스트 완료. 로그가 ${LOG_FILE}에 저장되었습니다.`, 'info');
  }
}

main();
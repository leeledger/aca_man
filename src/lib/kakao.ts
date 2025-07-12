import axios from 'axios';
import { PrismaClient, User, Task } from '@prisma/client';
import { validateKakaoEnvVariables } from './env-validator';

const prisma = new PrismaClient();

/**
 * 카카오톡 메시지 템플릿 인자 인터페이스
 */
export interface KakaoTemplateArgs {
  [key: string]: string | number | boolean | null;
}

/**
 * 카카오 토큰 응답 인터페이스
 */
export interface KakaoTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
  refresh_token_expires_in?: number;
}

// 카카오 API 키 및 템플릿 ID
const KAKAO_API_KEY = process.env.KAKAO_CLIENT_ID;
const ADMIN_KEY = process.env.KAKAO_ADMIN_KEY; // 카카오 개발자 콘솔에서 발급받은 Admin 키

// 메시지 템플릿 ID (카카오 비즈니스 채널에서 생성한 템플릿 ID)
const TASK_STATUS_TEMPLATE_ID = process.env.KAKAO_TASK_STATUS_TEMPLATE_ID || ''; // 업무 상태 변경 알림 템플릿 ID
const TASK_REMINDER_TEMPLATE_ID = process.env.KAKAO_TASK_REMINDER_TEMPLATE_ID || ''; // 업무 마감일 알림 템플릿 ID
const TASK_SCHEDULE_CHANGE_TEMPLATE_ID = process.env.KAKAO_TASK_SCHEDULE_CHANGE_TEMPLATE_ID || ''; // 업무 일정 변경 알림 템플릿 ID

// 환경 변수 유효성 검사
if (!TASK_STATUS_TEMPLATE_ID || !TASK_REMINDER_TEMPLATE_ID || !TASK_SCHEDULE_CHANGE_TEMPLATE_ID) {
  console.error('카카오톡 템플릿 ID가 설정되지 않았습니다. 환경 변수를 확인하세요.');
}

/**
 * 카카오 액세스 토큰 갱신 함수
 * @param user 사용자 정보 (카카오 토큰 정보 포함)
 * @returns 갱신된 액세스 토큰 또는 null (갱신 실패 시)
 */
async function refreshKakaoToken(user: User): Promise<string | null> {
  if (!user.kakaoRefreshToken || !KAKAO_API_KEY) {
    console.error('리프레시 토큰 또는 API 키가 없어 토큰을 갱신할 수 없습니다.');
    return null;
  }

  try {
    const tokenResponse = await axios.post<KakaoTokenResponse>(
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
    
    if (tokenResponse.data.access_token) {
      // DB에 새 액세스 토큰 저장
      await prisma.user.update({
        where: { id: user.id },
        data: { kakaoAccessToken: tokenResponse.data.access_token }
      });
      
      console.log(`사용자(${user.name || user.email})의 카카오 액세스 토큰 갱신 성공`);
      return tokenResponse.data.access_token;
    }
    return null;
  } catch (error: any) {
    console.error('카카오 토큰 갱신 실패:', error.message);
    if (error.response) {
      console.error(`응답 상태: ${error.response.status}`);
      console.error('응답 데이터:', error.response.data);
    }
    return null;
  }
}

/**
 * 카카오톡 알림 메시지 전송 함수
 * @param user 사용자 정보 (카카오 토큰 정보 포함)
 * @param templateId 메시지 템플릿 ID
 * @param templateArgs 템플릿 파라미터
 * @param retries 재시도 횟수
 * @returns 메시지 전송 성공 여부
 */
async function sendKakaoMessage(user: User, templateId: string, templateArgs: KakaoTemplateArgs, retries = 3): Promise<boolean> {
  // 템플릿 ID 확인
  if (!templateId) {
    console.error('카카오톡 템플릿 ID가 제공되지 않았습니다.');
    return false;
  }

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
    if (!ADMIN_KEY) {
      console.error('카카오 Admin API 키가 설정되지 않았습니다. 환경 변수를 확인하세요.');
      return false;
    }

    // 카카오톡 연동 확인
    if (!user.isKakaoLinked) {
      console.log(`사용자(${user.name || user.email})는 카카오톡 연동이 되어 있지 않습니다.`);
      return false;
    }

    // 액세스 토큰 확인
    if (!user.kakaoAccessToken) {
      console.log(`사용자(${user.name || user.email})의 카카오 액세스 토큰이 없습니다.`);
      
      // 리프레시 토큰이 있으면 액세스 토큰 갱신 시도
      if (user.kakaoRefreshToken) {
        const newAccessToken = await refreshKakaoToken(user);
        if (newAccessToken) {
          const updatedUser = { ...user, kakaoAccessToken: newAccessToken };
          return sendKakaoMessage(updatedUser, templateId, templateArgs, retries);
        }
      }
      return false;
    }

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

    console.log(`카카오톡 메시지 전송 성공: ${templateId}`, {
      userId: user.id,
      userName: user.name || user.email,
      templateId,
      status: response.status
    });
    return response.status === 200;
  } catch (error: any) {
    // 상세 오류 정보 로깅
    console.error(`카카오톡 메시지 전송 실패 (사용자: ${user.name || user.email}, 템플릿: ${templateId}):`, error.message);
    if (error.response) {
      console.error(`응답 상태: ${error.response.status}`);
      console.error('응답 데이터:', error.response.data);
    }
    
    // 토큰 만료 오류 처리 (401 Unauthorized)
    if (error.response && error.response.status === 401) {
      console.log(`사용자(${user.name || user.email})의 카카오 액세스 토큰이 만료되었습니다. 리프레시 토큰으로 갱신을 시도합니다.`);
      
      // 토큰 갱신 시도
      const newAccessToken = await refreshKakaoToken(user);
      if (newAccessToken) {
        // 갱신된 토큰으로 메시지 전송 재시도
        const updatedUser = { ...user, kakaoAccessToken: newAccessToken };
        return sendKakaoMessage(updatedUser, templateId, templateArgs, retries);
      } else {
        console.error(`사용자(${user.name || user.email})의 카카오 토큰 갱신 실패. 카카오 연동을 다시 설정해야 할 수 있습니다.`);
      }
    }
    
    // 재시도 로직
    if (retries > 0) {
      console.log(`사용자(${user.name || user.email})에게 카카오톡 메시지 전송 ${retries}회 재시도 중...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
      return sendKakaoMessage(user, templateId, templateArgs, retries - 1);
    }
    
    return false;
  }
}

/**
 * 업무 상태 변경 알림 템플릿 파라미터 생성
 * @param task 업무 정보
 * @param previousStatus 이전 상태
 * @returns 템플릿 파라미터 객체
 */
function createTaskStatusTemplateArgs(task: Task, previousStatus: string): KakaoTemplateArgs {
  return {
    task_title: task.title,
    task_id: task.id,
    previous_status: previousStatus,
    current_status: task.status,
    due_date: task.dueDate ? new Date(task.dueDate).toLocaleDateString('ko-KR') : '없음',
    updated_at: new Date().toLocaleString('ko-KR')
  };
}

/**
 * 업무 상태 변경 알림 전송
 * @param task 업무 정보
 * @param assignedTo 담당자 정보
 * @param createdBy 생성자 정보 (원장님)
 * @param previousStatus 이전 상태
 */
export async function sendTaskStatusChangeNotification(
  task: Task,
  assignedTo: User,
  createdBy: User,
  previousStatus: string
) {
  try {
    // 상태 변경 메시지 템플릿 파라미터 생성
    const templateArgs = createTaskStatusTemplateArgs(task, previousStatus);

    console.log(`업무 상태 변경 알림 전송 시작: ${task.id}, 상태: ${previousStatus} → ${task.status}`);

    // 담당자에게 알림 전송 (본인 업무 상태 변경)
    const success = await sendKakaoMessage(assignedTo, TASK_STATUS_TEMPLATE_ID, templateArgs);
    if (success) {
      console.log(`담당자(${assignedTo.name || assignedTo.email})에게 상태 변경 알림 전송 성공`);
    } else {
      console.log(`담당자(${assignedTo.name || assignedTo.email})에게 상태 변경 알림 전송 실패`);
    }

    // 관리자(원장)에게 알림 전송 (모든 업무 상태 변경)
    if (createdBy.role === 'ADMIN') {
      const adminSuccess = await sendKakaoMessage(createdBy, TASK_STATUS_TEMPLATE_ID, templateArgs);
      if (adminSuccess) {
        console.log(`관리자(${createdBy.name || createdBy.email})에게 상태 변경 알림 전송 성공`);
      } else {
        console.log(`관리자(${createdBy.name || createdBy.email})에게 상태 변경 알림 전송 실패`);
      }
    }
  } catch (error) {
    console.error('업무 상태 변경 알림 전송 중 오류 발생:', error);
  }
}

/**
 * 업무 마감 시간 알림 템플릿 파라미터 생성
 * @param task 업무 정보
 * @returns 템플릿 파라미터 객체
 */
function createTaskReminderTemplateArgs(task: Task): KakaoTemplateArgs {
  return {
    task_title: task.title,
    task_id: task.id,
    due_date: task.dueDate ? new Date(task.dueDate).toLocaleString('ko-KR') : '없음',
    current_status: task.status
  };
}

/**
 * 업무 마감 시간 알림 전송
 * @param task 업무 정보
 * @param assignedTo 담당자 정보
 */
export async function sendTaskReminderNotification(task: Task, assignedTo: User) {
  try {
    // 마감 시간 알림 템플릿 파라미터 생성
    const templateArgs = createTaskReminderTemplateArgs(task);

    console.log(`업무 마감 시간 알림 전송 시작: ${task.id}, 마감일: ${task.dueDate ? new Date(task.dueDate).toLocaleString('ko-KR') : '없음'}`);

    // 담당자에게 알림 전송
    const success = await sendKakaoMessage(assignedTo, TASK_REMINDER_TEMPLATE_ID, templateArgs);
    if (success) {
      console.log(`담당자(${assignedTo.name || assignedTo.email})에게 마감 시간 알림 전송 성공`);
    } else {
      console.log(`담당자(${assignedTo.name || assignedTo.email})에게 마감 시간 알림 전송 실패`);
    }
  } catch (error) {
    console.error('업무 마감 시간 알림 전송 중 오류 발생:', error);
  }
}

/**
 * 업무 일정 변경 알림 템플릿 파라미터 생성
 * @param task 업무 정보
 * @param assignedTo 담당자 정보
 * @param previousDueDate 이전 마감일
 * @param changeReason 변경 사유
 * @returns 템플릿 파라미터 객체
 */
function createTaskScheduleChangeTemplateArgs(
  task: Task,
  assignedTo: User,
  previousDueDate: Date | null,
  changeReason: string
): KakaoTemplateArgs {
  return {
    task_title: task.title,
    task_id: task.id,
    previous_due_date: previousDueDate ? new Date(previousDueDate).toLocaleString('ko-KR') : '없음',
    current_due_date: task.dueDate ? new Date(task.dueDate).toLocaleString('ko-KR') : '없음',
    change_reason: changeReason || '사유 없음',
    updated_at: new Date().toLocaleString('ko-KR'),
    updater_name: assignedTo.name || assignedTo.email
  };
}

/**
 * 업무 일정 변경 알림 전송 (원장님에게)
 * @param task 업무 정보
 * @param assignedTo 담당자 정보
 * @param createdBy 생성자 정보 (원장님)
 * @param previousDueDate 이전 마감일
 * @param changeReason 변경 사유
 */
export async function sendTaskScheduleChangeNotification(
  task: Task,
  assignedTo: User,
  createdBy: User,
  previousDueDate: Date | null,
  changeReason: string
) {
  try {
    // 일정 변경 알림 템플릿 파라미터 생성
    const templateArgs = createTaskScheduleChangeTemplateArgs(task, assignedTo, previousDueDate, changeReason);

    // 관리자(원장)에게만 알림 전송
    if (createdBy.role !== 'ADMIN') {
      console.log('알림을 받을 관리자가 없습니다. 관리자만 일정 변경 알림을 받을 수 있습니다.');
      return;
    }
    
    console.log(`일정 변경 알림 전송 시작: ${task.id}, 관리자: ${createdBy.name || createdBy.email}`);
    
    const success = await sendKakaoMessage(createdBy, TASK_SCHEDULE_CHANGE_TEMPLATE_ID, templateArgs);
    if (success) {
      console.log(`관리자(${createdBy.name || createdBy.email})에게 일정 변경 알림 전송 성공`);
    } else {
      console.log(`관리자(${createdBy.name || createdBy.email})에게 일정 변경 알림 전송 실패`);
    }
  } catch (error) {
    console.error('일정 변경 알림 전송 중 오류 발생:', error);
  }
}
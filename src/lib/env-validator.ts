/**
 * 환경 변수 검증 유틸리티
 * 필수 환경 변수가 설정되어 있는지 확인하고 경고 메시지를 출력합니다.
 */

/**
 * 환경 변수 검증 결과 인터페이스
 */
export interface EnvValidationResult {
  isValid: boolean;
  missingVars: string[];
  message: string;
}

/**
 * 카카오톡 알림 관련 환경 변수 검증
 * @returns {EnvValidationResult} 검증 결과 객체
 */
export function validateKakaoEnvVariables(): EnvValidationResult {
  const requiredVars = [
    'KAKAO_ADMIN_KEY',
    'KAKAO_CLIENT_ID',
    'KAKAO_CLIENT_SECRET',
    'KAKAO_TASK_STATUS_TEMPLATE_ID',
    'KAKAO_TASK_REMINDER_TEMPLATE_ID',
    'KAKAO_TASK_SCHEDULE_CHANGE_TEMPLATE_ID'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    const message = `경고: 다음 카카오톡 관련 환경 변수가 설정되지 않았습니다: ${missingVars.join(', ')}\n카카오톡 알림 기능이 작동하지 않을 수 있습니다.`;
    console.warn(message);
    return {
      isValid: false,
      missingVars,
      message
    };
  }
  
  return {
    isValid: true,
    missingVars: [],
    message: '모든 카카오톡 관련 환경 변수가 올바르게 설정되었습니다.'
  };
}

/**
 * 모든 필수 환경 변수 검증 결과 인터페이스
 */
export interface AllEnvValidationResult {
  isValid: boolean;
  results: {
    [key: string]: EnvValidationResult
  };
}

/**
 * 모든 필수 환경 변수 검증
 * @param {boolean} logResults - 검증 결과를 콘솔에 출력할지 여부
 * @returns {AllEnvValidationResult} 모든 검증 결과를 포함하는 객체
 */
export function validateAllEnvVariables(logResults: boolean = true): AllEnvValidationResult {
  // 카카오톡 알림 관련 환경 변수 검증
  const kakaoResult = validateKakaoEnvVariables();
  
  // 추가적인 환경 변수 검증 로직을 여기에 추가할 수 있습니다.
  // 예: const dbResult = validateDatabaseEnvVariables();
  
  const allResults = {
    kakao: kakaoResult,
    // 추가적인 검증 결과를 여기에 추가할 수 있습니다.
    // db: dbResult,
  };
  
  // 모든 검증 결과가 유효한지 확인
  const isValid = Object.values(allResults).every(result => result.isValid);
  
  if (logResults) {
    if (isValid) {
      console.log('모든 환경 변수가 올바르게 설정되었습니다.');
    } else {
      console.warn('일부 환경 변수가 설정되지 않았습니다. 자세한 내용은 로그를 확인하세요.');
      
      // 유효하지 않은 결과만 출력
      Object.entries(allResults)
        .filter(([_, result]) => !result.isValid)
        .forEach(([category, result]) => {
          console.warn(`[${category}] ${result.message}`);
        });
    }
  }
  
  return {
    isValid,
    results: allResults
  };
}
// 환경 변수를 파일로 출력하는 스크립트
require('dotenv').config();
const fs = require('fs');

const envVars = {
  KAKAO_ADMIN_KEY: process.env.KAKAO_ADMIN_KEY ? '설정됨' : '설정안됨',
  KAKAO_CLIENT_ID: process.env.KAKAO_CLIENT_ID ? '설정됨' : '설정안됨',
  KAKAO_CLIENT_SECRET: process.env.KAKAO_CLIENT_SECRET ? '설정됨' : '설정안됨',
  KAKAO_TASK_STATUS_TEMPLATE_ID: process.env.KAKAO_TASK_STATUS_TEMPLATE_ID,
  KAKAO_TASK_REMINDER_TEMPLATE_ID: process.env.KAKAO_TASK_REMINDER_TEMPLATE_ID,
  KAKAO_TASK_SCHEDULE_CHANGE_TEMPLATE_ID: process.env.KAKAO_TASK_SCHEDULE_CHANGE_TEMPLATE_ID,
  NOTIFICATION_TEST_MODE: process.env.NOTIFICATION_TEST_MODE,
  NODE_ENV: process.env.NODE_ENV
};

fs.writeFileSync('env-vars.json', JSON.stringify(envVars, null, 2));
console.log('환경 변수가 env-vars.json 파일에 저장되었습니다.');
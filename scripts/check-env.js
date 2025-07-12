// 환경 변수 확인 스크립트
require('dotenv').config();

console.log('환경 변수 확인:');
console.log('KAKAO_ADMIN_KEY:', process.env.KAKAO_ADMIN_KEY ? '설정됨' : '설정안됨');
console.log('KAKAO_CLIENT_ID:', process.env.KAKAO_CLIENT_ID ? '설정됨' : '설정안됨');
console.log('KAKAO_CLIENT_SECRET:', process.env.KAKAO_CLIENT_SECRET ? '설정됨' : '설정안됨');
console.log('KAKAO_TASK_STATUS_TEMPLATE_ID:', process.env.KAKAO_TASK_STATUS_TEMPLATE_ID);
console.log('KAKAO_TASK_REMINDER_TEMPLATE_ID:', process.env.KAKAO_TASK_REMINDER_TEMPLATE_ID);
console.log('KAKAO_TASK_SCHEDULE_CHANGE_TEMPLATE_ID:', process.env.KAKAO_TASK_SCHEDULE_CHANGE_TEMPLATE_ID);
console.log('NOTIFICATION_TEST_MODE:', process.env.NOTIFICATION_TEST_MODE);
console.log('NODE_ENV:', process.env.NODE_ENV);
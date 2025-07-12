import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// 환경 변수에서 속도 제한 설정 가져오기
const RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX) : 10;
const RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS ? parseInt(process.env.RATE_LIMIT_WINDOW_MS) : 10000; // 기본값 10초

// Redis 클라이언트 설정
let ratelimit: Ratelimit;

if (process.env.NODE_ENV === 'production') {
  // 프로덕션 환경: Upstash Redis 사용
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
  });

  ratelimit = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(RATE_LIMIT_MAX, `${RATE_LIMIT_WINDOW_MS} ms`),
    analytics: true,
  });
} else {
  // 개발 환경: 메모리 스토리지 사용
  // @ts-ignore - 개발 환경에서는 redis 속성을 무시하고 ephemeralCache를 사용
  ratelimit = new Ratelimit({
    limiter: Ratelimit.slidingWindow(RATE_LIMIT_MAX, `${RATE_LIMIT_WINDOW_MS} ms`),
    analytics: true,
    ephemeralCache: new Map(), // 메모리 캐시 사용
  });
}

export { ratelimit };
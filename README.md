# 학원 업무 관리 시스템

학원 원장과 강사들 간의 업무 관리를 위한 웹 애플리케이션입니다. 업무 할당, 진행 상태 추적, 강사 관리 등의 기능을 제공합니다.

## 주요 기능

- 업무 등록 및 관리
- 업무 진행 상태 추적 (등록 → 확인 → 진행중 → 완료)
- 강사 관리
- 학원 정보 관리

## 기술 스택

- Frontend: Next.js, React, TailwindCSS
- Backend: Next.js API Routes
- Database: PostgreSQL
- ORM: Prisma
- Authentication: NextAuth.js

## 시작하기

### 1. 환경 설정

1. 저장소 클론
```bash
git clone [repository-url]
cd academy-task-manager
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
`.env.example` 파일을 `.env`로 복사하고 필요한 값을 설정합니다:
```bash
cp .env.example .env
# 텍스트 에디터로 .env 파일을 열고 필요한 값을 설정
```

### 2. 데이터베이스 설정

1. PostgreSQL 데이터베이스 생성

2. Prisma 마이그레이션 실행
```bash
npx prisma migrate dev
```

3. 시드 데이터 생성 (개발 환경에서만 사용)
```bash
npx prisma db seed
```

### 3. 개발 서버 실행

```bash
npm run dev
```

### 4. 프로덕션 빌드 및 실행

```bash
npm run build
npm start
```

## 테스트 계정

시드 데이터로 생성되는 테스트 계정:

- 관리자(원장)
  - 이메일: admin@trae.com

- 강사
  - 이메일: teacher1@example.com
  - 이메일: teacher2@example.com
  - 이메일: teacher3@example.com

## 프로젝트 구조

```
├── prisma/          # 데이터베이스 스키마 및 마이그레이션
├── public/          # 정적 파일
├── src/
│   ├── app/         # Next.js 13 App Router
│   │   ├── api/     # API 엔드포인트
│   │   ├── auth/    # 인증 관련 페이지
│   │   ├── dashboard/ # 대시보드 페이지
│   │   ├── manage/  # 학원 관리 페이지
│   │   └── tasks/   # 업무 관리 페이지
│   ├── components/  # React 컴포넌트
│   ├── lib/         # 유틸리티 함수
│   └── types/       # TypeScript 타입 정의
├── logs/            # 애플리케이션 로그 (프로덕션)
```

## 프로덕션 배포 가이드

### 1. 환경 준비

- Node.js 18 이상
- PostgreSQL 데이터베이스
- (선택) Redis 서버 (rate limiting용)

### 2. 환경 변수 설정

프로덕션 환경에서는 다음 환경 변수를 반드시 설정해야 합니다:

```env
# 데이터베이스 연결 정보
DATABASE_URL=postgresql://username:password@hostname:5432/database

# NextAuth 설정
NEXTAUTH_URL=https://your-production-domain.com
NEXTAUTH_SECRET=your-secure-random-string

# 애플리케이션 환경
NODE_ENV=production

# 이메일 서비스 설정 (비밀번호 재설정 등)
EMAIL_SERVER=smtp.example.com
EMAIL_PORT=587
EMAIL_USERNAME=your-email-username
EMAIL_PASSWORD=your-email-password
EMAIL_FROM=noreply@example.com

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000

# Upstash Redis (rate limiting용)
UPSTASH_REDIS_REST_URL=your-upstash-redis-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-token
```

### 3. 배포 방법

#### Vercel 배포

1. Vercel 계정에 GitHub 저장소 연결
2. 환경 변수 설정
3. 배포 설정 확인 후 배포

#### 직접 서버 배포

1. 소스 코드 다운로드 및 의존성 설치
```bash
git clone [repository-url]
cd academy-task-manager
npm install
```

2. 프로덕션 빌드 생성
```bash
npm run build
```

3. 프로덕션 서버 실행
```bash
npm start
```

4. (권장) PM2를 사용한 프로세스 관리
```bash
npm install -g pm2
pm2 start npm --name "academy-task-manager" -- start
```

### 4. 보안 고려사항

- 강력한 NEXTAUTH_SECRET 값 사용 (openssl rand -base64 32 명령으로 생성)
- 데이터베이스 비밀번호는 강력하고 복잡하게 설정
- 프로덕션 환경에서는 HTTPS 사용 필수
- 정기적인 보안 업데이트 및 의존성 패키지 업데이트

## 라이선스

MIT License
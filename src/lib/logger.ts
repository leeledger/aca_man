import winston from 'winston'
import path from 'path'
import fs from 'fs'

// 로그 디렉토리 생성
const logDir = path.join(process.cwd(), 'logs')
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

// 로그 포맷 설정
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
)

// 개발 환경용 콘솔 포맷
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    ({ timestamp, level, message, ...meta }) => {
      return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`
    }
  )
)

// 로거 설정
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'academy-task-manager' },
  transports: [
    // 개발 환경에서는 콘솔에 출력
    ...(process.env.NODE_ENV !== 'production' ? [
      new winston.transports.Console({
        format: consoleFormat,
      })
    ] : []),
    // 프로덕션 환경에서는 파일에 저장
    ...(process.env.NODE_ENV === 'production' ? [
      // 에러 로그
      new winston.transports.File({ 
        filename: path.join(logDir, 'error.log'), 
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      // 모든 로그
      new winston.transports.File({ 
        filename: path.join(logDir, 'combined.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    ] : [])
  ],
})

// 로그 헬퍼 함수
export function logApiRequest(req: any, info: string, meta: any = {}) {
  const { method, url, headers, body } = req
  logger.info(`API ${info} | ${method} ${url}`, {
    method,
    url,
    userAgent: headers['user-agent'],
    ip: headers['x-forwarded-for'] || req.connection?.remoteAddress,
    ...meta
  })
}

export function logApiError(req: any, error: any, meta: any = {}) {
  const { method, url, headers } = req
  logger.error(`API Error | ${method} ${url}`, {
    method,
    url,
    userAgent: headers['user-agent'],
    ip: headers['x-forwarded-for'] || req.connection?.remoteAddress,
    error: error.message || error,
    stack: error.stack,
    ...meta
  })
}

export function logSystemError(message: string, error: any, meta: any = {}) {
  logger.error(`System Error | ${message}`, {
    error: error.message || error,
    stack: error.stack,
    ...meta
  })
}

export default logger
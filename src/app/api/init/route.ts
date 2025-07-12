import { NextResponse } from 'next/server';
import { initializeServer } from '../init';

// 서버 초기화 API 라우트
export async function GET() {
  // 서버 초기화 함수 호출
  initializeServer();
  
  return NextResponse.json({ status: 'Server initialized successfully' });
}
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/auth-options'

export async function POST(request: NextRequest) {
  try {
    // 세션 확인
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 관리자 권한 확인
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    const { planId, amount, duration } = await request.json()

    if (!planId || !amount || !duration) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 모의 결제 처리 (실제로는 결제 게이트웨이 연동 필요)
    const paymentId = `payment_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    
    // 결제 내역 생성
    const payment = await prisma.paymentHistory.create({
      data: {
        userId: session.user.id,
        amount: amount,
        paymentMethod: 'CARD', // 가상의 결제 방식
        paymentId: paymentId,
        status: 'COMPLETED',
        description: `${planId} 플랜 ${duration}개월 구독`,
      },
    })

    // 구독 시작일과 종료일 계산
    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + duration)

    // 기존 활성 구독이 있으면 종료일 이후부터 새 구독 시작
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVE',
        endDate: {
          gte: startDate,
        },
      },
      orderBy: {
        endDate: 'desc',
      },
    })

    let newStartDate = startDate
    let newEndDate = endDate

    if (activeSubscription) {
      newStartDate = new Date(activeSubscription.endDate)
      newEndDate = new Date(newStartDate)
      newEndDate.setMonth(newEndDate.getMonth() + duration)
    }

    // 구독 정보 생성
    const subscription = await prisma.subscription.create({
      data: {
        userId: session.user.id,
        startDate: newStartDate,
        endDate: newEndDate,
        amount: amount,
        status: 'ACTIVE',
        paymentMethod: 'CARD',
        paymentId: paymentId,
      },
    })

    return NextResponse.json(
      {
        message: '구독이 성공적으로 처리되었습니다.',
        subscription: subscription,
        payment: payment,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('구독 처리 오류:', error)
    return NextResponse.json(
      { error: '구독 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
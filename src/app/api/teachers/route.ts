import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { logApiRequest, logApiError } from '@/lib/logger'
import { hash } from 'bcrypt'

export async function GET(request) {
  logApiRequest(request, 'GET teachers')
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const teachers = await prisma.user.findMany({
      where: {
        academyId: session.user.academyId,
        role: 'TEACHER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(teachers)
  } catch (error) {
    logApiError(request, error, { message: 'Failed to fetch teachers' })
    return NextResponse.json(
      { error: 'Failed to fetch teachers' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  logApiRequest(request, 'POST teachers')
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, email, role, password } = body
    
    // 비밀번호 필수 검증
    if (!password) {
      return NextResponse.json(
        { error: '비밀번호를 입력해주세요.' },
        { status: 400 }
      )
    }
    
    // 역할 검증
    if (role !== 'TEACHER' && role !== 'ADMIN') {
      return NextResponse.json(
        { error: '유효하지 않은 역할입니다.' },
        { status: 400 }
      )
    }

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 등록된 이메일입니다.' },
        { status: 400 }
      )
    }

    // 비밀번호 해시화
    const hashedPassword = await hash(password, 10)
    
    const teacher = await prisma.user.create({
      data: {
        name,
        email,
        role,
        password: hashedPassword,
        academyId: session.user.academyId,
        isApproved: true, // 강사는 자동 승인
      },
    })

    return NextResponse.json(teacher)
  } catch (error) {
    logApiError(request, error, { message: 'Failed to create teacher' })
    return NextResponse.json(
      { error: 'Failed to create teacher' },
      { status: 500 }
    )
  }
}
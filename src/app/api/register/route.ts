import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hash } from 'bcrypt'
import { logApiRequest, logApiError } from '@/lib/logger'
import { saveBusinessLicense } from '@/lib/fileUpload'

export async function POST(request: NextRequest) {
  logApiRequest(request, 'POST register')
  try {
    // FormData로 요청 처리
    const formData = await request.formData()
    const name = formData.get('name') as string
    const academyName = formData.get('academyName') as string
    const email = formData.get('email') as string
    const phoneNumber = formData.get('phoneNumber') as string
    const password = formData.get('password') as string
    const businessLicenseFile = formData.get('businessLicense') as File

    // 필수 필드 검증
    if (!name || !academyName || !email || !phoneNumber || !password || !businessLicenseFile) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      )
    }
    
    // 사업자 등록증 파일 저장
    let businessLicenseUrl: string
    try {
      businessLicenseUrl = await saveBusinessLicense(businessLicenseFile)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : '파일 업로드 중 오류가 발생했습니다.' },
        { status: 400 }
      )
    }

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 사용 중인 이메일입니다.' },
        { status: 400 }
      )
    }

    // 비밀번호 해시화
    const hashedPassword = await hash(password, 10)

    // 트랜잭션으로 학원과 사용자 생성
    const result = await prisma.$transaction(async (tx) => {
      // 학원 생성
      const academy = await tx.academy.create({
        data: {
          name: academyName,
        },
      })

      // 관리자 계정 생성 (승인 대기 상태)
      const user = await tx.user.create({
        data: {
          name,
          email,
          phoneNumber,
          businessLicense: businessLicenseUrl,
          role: 'ADMIN',
          academyId: academy.id,
          password: hashedPassword,
          isApproved: false, // 개발자 승인 필요
        },
      })

      return { academy, user }
    })

    // 민감한 정보 제외하고 응답
    const { user } = result
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
    }

    return NextResponse.json(
      { 
        message: '회원가입이 완료되었습니다. 관리자 승인 후 이용 가능합니다.',
        user: safeUser 
      },
      { status: 201 }
    )
  } catch (error) {
    logApiError(request, error, { message: '회원가입 오류' })
    return NextResponse.json(
      { error: '회원가입 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
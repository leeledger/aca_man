import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // 기존 데이터 삭제
  await prisma.task.deleteMany()
  await prisma.user.deleteMany()
  await prisma.academy.deleteMany()
  
  // 서버 관리자(SUPER_ADMIN) 계정 생성
  const hashedPassword = await hash('admin1234', 10)
  const superAdmin = await prisma.user.create({
    data: {
      name: '서버 관리자',
      email: 'admin@trae.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      isApproved: true,
    },
  })
  
  console.log('서버 관리자 계정:', { email: superAdmin.email })

  // 학원 생성
  const academy = await prisma.academy.create({
    data: {
      name: '테스트 학원',
    },
  })

  // 원장(관리자) 계정 생성
  const admin = await prisma.user.create({
    data: {
      name: '원장님',
      email: 'admin@example.com',
      role: 'ADMIN',
      academyId: academy.id,
      isApproved: true, // 기본 관리자는 승인된 상태
    },
  })

  // 강사 계정들 생성
  const teachers = await Promise.all(
    ['강사1', '강사2', '강사3'].map((name, index) =>
      prisma.user.create({
        data: {
          name,
          email: `teacher${index + 1}@example.com`,
          role: 'TEACHER',
          academyId: academy.id,
          isApproved: true, // 기본 강사는 승인된 상태
        },
      })
    )
  )

  // 샘플 업무 생성
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: '1학년 수학 교재 검토',
        description: '다음 학기 사용할 수학 교재 검토 및 의견 제출',
        status: 'REGISTERED',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 후
        academyId: academy.id,
        assignedToId: teachers[0].id,
        createdById: admin.id,
      },
    }),
    prisma.task.create({
      data: {
        title: '2학년 영어 모의고사 출제',
        description: '다음 주 실시할 영어 모의고사 문제 출제',
        status: 'IN_PROGRESS',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3일 후
        academyId: academy.id,
        assignedToId: teachers[1].id,
        createdById: admin.id,
      },
    }),
    prisma.task.create({
      data: {
        title: '3학년 과학 실험 준비',
        description: '다음 달 과학 실험 수업 준비 및 재료 목록 작성',
        status: 'CONFIRMED',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14일 후
        academyId: academy.id,
        assignedToId: teachers[2].id,
        createdById: admin.id,
      },
    }),
  ])

  console.log('시드 데이터가 성공적으로 생성되었습니다.')
  console.log('학원 관리자 계정:', { email: admin.email })
  console.log('강사 계정:', teachers.map(t => ({ email: t.email })))
}

main()
  .catch((e) => {
    console.error('시드 데이터 생성 중 오류 발생:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
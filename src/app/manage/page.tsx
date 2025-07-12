'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import TeacherManagement from '@/components/manage/TeacherManagement'
import AcademySettings from '@/components/manage/AcademySettings'

export default function ManagePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
      router.push('/')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="max-w-6xl mx-auto space-y-10 text-center py-10">
        <p>로딩중...</p>
      </div>
    )
  }

  if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN')) {
    return null
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <h1 className="text-3xl font-bold">학원 관리</h1>
      
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Link href="/manage/approvals" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow duration-200">
          <h2 className="text-xl font-semibold mb-2">회원가입 승인</h2>
          <p className="text-gray-600 text-sm">새로운 학원 관리자 가입 요청을 승인합니다.</p>
        </Link>

        <Link href="/manage/subscription" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow duration-200">
          <h2 className="text-xl font-semibold mb-2">구독 관리</h2>
          <p className="text-gray-600 text-sm">서비스 구독 상태를 확인하고 결제를 진행합니다.</p>
        </Link>
      </div>
      
      <div className="grid gap-8 md:grid-cols-2">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">강사 관리</h2>
          <TeacherManagement />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">학원 설정</h2>
          <AcademySettings />
        </div>
      </div>
    </div>
  )
}
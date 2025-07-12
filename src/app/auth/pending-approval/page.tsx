'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function PendingApproval() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
    
    // 이미 승인된 사용자는 홈으로 리다이렉트
    if (session?.user?.isApproved) {
      router.push('/')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="text-5xl mb-4">⏳</div>
          </div>
          <h2 className="mt-2 text-3xl font-extrabold text-gray-900">승인 대기 중</h2>
          <p className="mt-2 text-sm text-gray-600">관리자의 승인을 기다리고 있습니다</p>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">ℹ️</div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                회원가입 요청이 접수되었습니다. 관리자 승인 후 서비스를 이용하실 수 있습니다.
              </p>
              <p className="text-sm text-yellow-700 mt-2">
                승인 과정에는 일반적으로 1-2일이 소요됩니다. 문의사항은 아래 이메일로 연락해주세요.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            문의: <a href="mailto:support@example.com" className="text-blue-600 hover:underline">support@example.com</a>
          </p>
          <Link
            href="/auth/signin"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            로그인 페이지로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type PendingUser = {
  id: string
  name: string | null
  email: string
  phoneNumber: string | null
  businessLicense: string | null
  role: string
  createdAt: string
  academy: {
    id: string
    name: string
  }
}

export default function ApprovalManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    // 로그인하지 않았거나 서버 관리자(SUPER_ADMIN)가 아닌 경우 리다이렉트
    if (status === 'unauthenticated' || (session && session.user.role !== 'SUPER_ADMIN')) {
      router.push('/')
      return
    }

    // 승인 대기 중인 사용자 목록 가져오기
    const fetchPendingUsers = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/admin/pending-users')
        
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || '승인 대기 사용자 목록을 가져오는데 실패했습니다.')
        }
        
        const data = await response.json()
        setPendingUsers(data)
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message)
        } else {
          setError('승인 대기 사용자 목록을 가져오는데 실패했습니다.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (session?.user.role === 'SUPER_ADMIN') {
      fetchPendingUsers()
    }
  }, [session, status, router])

  const handleApprove = async (userId: string) => {
    try {
      const response = await fetch('/api/admin/approve-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '사용자 승인에 실패했습니다.')
      }

      const data = await response.json()
      setSuccessMessage(data.message || '사용자가 성공적으로 승인되었습니다.')
      
      // 승인된 사용자를 목록에서 제거
      setPendingUsers(pendingUsers.filter(user => user.id !== userId))

      // 3초 후 성공 메시지 제거
      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('사용자 승인 중 오류가 발생했습니다.')
      }

      // 3초 후 에러 메시지 제거
      setTimeout(() => {
        setError('')
      }, 3000)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">회원가입 승인 관리</h1>
        <Link 
          href="/manage/approved" 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors duration-200"
        >
          승인된 회원 목록 보기
        </Link>
      </div>

      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 rounded">
          <div className="flex">
            <div className="flex-shrink-0">✅</div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded">
          <div className="flex">
            <div className="flex-shrink-0">⚠️</div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {pendingUsers.length === 0 ? (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
          <p className="text-gray-600">승인 대기 중인 사용자가 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  학원 정보
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  원장 정보
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  연락처
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  사업자 등록증
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  가입일
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.academy.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.phoneNumber || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.businessLicense ? (
                      <a 
                        href={user.businessLicense} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-900 underline"
                      >
                        사업자 등록증 보기
                      </a>
                    ) : (
                      <span className="text-red-500">미첨부</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleApprove(user.id)}
                      className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors duration-200"
                    >
                      승인
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
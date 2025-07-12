'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function ProfilePage() {
  const { data: session, status, update: updateSession } = useSession()
  const router = useRouter()
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isUnlinkingKakao, setIsUnlinkingKakao] = useState(false)
  const [academyName, setAcademyName] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
    
    // 강사인 경우 소속 학원 정보 가져오기
    if (session?.user?.role === 'TEACHER' && session?.user?.academyId) {
      fetchAcademyInfo()
    }
  }, [status, router, session])

  // 학원 정보 가져오기
  const fetchAcademyInfo = async () => {
    try {
      const response = await fetch('/api/academy')
      if (response.ok) {
        const data = await response.json()
        setAcademyName(data.name)
      }
    } catch (error) {
      console.error('학원 정보 가져오기 실패:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // 카카오톡 연동 해제 함수
  const handleUnlinkKakao = async () => {
    if (!confirm('카카오톡 연동을 해제하시겠습니까? 더 이상 카카오톡으로 알림을 받을 수 없습니다.')) {
      return
    }
    
    setIsUnlinkingKakao(true)
    try {
      const response = await fetch('/api/user/kakao-status', {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || '카카오톡 연동 해제에 실패했습니다.')
      } else {
        // 세션 업데이트
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            isKakaoLinked: false
          }
        })
        alert('카카오톡 연동이 해제되었습니다.')
      }
    } catch (error) {
      console.error('카카오톡 연동 해제 오류:', error)
      alert('카카오톡 연동 해제 중 오류가 발생했습니다.')
    } finally {
      setIsUnlinkingKakao(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    // 비밀번호 확인
    if (formData.newPassword !== formData.confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다.')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '비밀번호 변경에 실패했습니다.')
      } else {
        setSuccess('비밀번호가 성공적으로 변경되었습니다.')
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      }
    } catch (error) {
      setError('비밀번호 변경 중 오류가 발생했습니다.')
      console.error('Password change error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
        <p className="text-center">로딩중...</p>
      </div>
    )
  }

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true)
    setDeleteError('')

    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        setDeleteError(data.error || '계정 삭제에 실패했습니다.')
      } else {
        // 로그아웃 처리 및 로그인 페이지로 리다이렉트
        router.push('/auth/signin?message=계정이 성공적으로 삭제되었습니다.')
      }
    } catch (error) {
      setDeleteError('계정 삭제 중 오류가 발생했습니다.')
      console.error('Account deletion error:', error)
    } finally {
      setIsDeletingAccount(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">내 프로필</h1>
      
      {session?.user && (
        <div className="mb-8 text-center">
          <h2 className="text-xl font-semibold">{session.user.name}</h2>
          <p className="text-gray-600">{session.user.email}</p>
          <p className="text-sm mt-1 bg-blue-100 text-blue-800 rounded-full px-3 py-1 inline-block">
            {session.user.role === 'SUPER_ADMIN' ? '서버 관리자' : session.user.role === 'ADMIN' ? '관리자' : '강사'}
          </p>
          
          {/* 강사인 경우 소속 학원 표시 */}
          {session.user.role === 'TEACHER' && academyName && (
            <p className="text-sm mt-2 text-gray-600">
              소속 학원: <span className="font-medium">{academyName}</span>
            </p>
          )}
        </div>
      )}

      {/* 카카오톡 연동 섹션 */}
      <div className="border-t pt-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">카카오톡 연동</h3>
        
        {session?.user?.isKakaoLinked ? (
          <div className="bg-yellow-50 p-4 rounded-md mb-4">
            <p className="text-sm text-gray-700 mb-2">
              <span className="font-medium">카카오톡 연동 완료</span> - 업무 알림을 카카오톡으로 받을 수 있습니다.
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => signIn('kakao', { callbackUrl: '/profile' })}
                className="flex-1 bg-yellow-400 text-gray-800 py-2 px-4 rounded-md hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
              >
                <span>카카오톡 재연동</span>
              </button>
              <button
                onClick={handleUnlinkKakao}
                disabled={isUnlinkingKakao}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center justify-center disabled:opacity-50"
              >
                <span>{isUnlinkingKakao ? '처리중...' : '연동 해제'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-md mb-4">
            <p className="text-sm text-gray-700 mb-2">
              카카오톡 연동을 통해 업무 알림을 카카오톡으로 받을 수 있습니다.
            </p>
            <button
              onClick={() => signIn('kakao', { callbackUrl: '/profile' })}
              className="w-full bg-yellow-400 text-gray-800 py-2 px-4 rounded-md hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
            >
              <span>카카오톡 연동하기</span>
            </button>
          </div>
        )}
      </div>

      {/* 비밀번호 변경 섹션 */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">비밀번호 변경</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
              현재 비밀번호
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
              value={formData.currentPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              새 비밀번호
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              value={formData.newPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              새 비밀번호 확인
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm">
              {success}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {isLoading ? '처리중...' : '비밀번호 변경'}
            </button>
          </div>
        </form>
      </div>

      {/* 회원 탈퇴 섹션 */}
      <div className="border-t pt-6 mt-8">
        <h3 className="text-lg font-semibold mb-4 text-red-600">회원 탈퇴</h3>
        
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full bg-red-100 text-red-700 py-2 px-4 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
          >
            회원 탈퇴
          </button>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없으며, 모든 개인 정보가 삭제됩니다.
              <br />
              <strong>참고:</strong> 완료되지 않은 업무가 있는 경우 탈퇴할 수 없습니다.
            </p>
            
            {deleteError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                {deleteError}
              </div>
            )}
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                disabled={isDeletingAccount}
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                disabled={isDeletingAccount}
              >
                {isDeletingAccount ? '처리중...' : '탈퇴 확인'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
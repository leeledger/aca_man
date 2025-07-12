'use client'

import { useState } from 'react'
import { signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function SignIn() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isKakaoLoading, setIsKakaoLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        if (result.error === 'CredentialsSignin') {
          setError('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.')
        } else if (result.error.includes('approved')) {
          setError('승인 대기 중인 계정입니다. 관리자 승인 후 이용 가능합니다.')
        } else {
          setError('로그인 중 오류가 발생했습니다.')
        }
      } else {
        router.push('/')
        router.refresh()
      }
    } catch (error) {
      setError('로그인 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="text-5xl mb-4">🏫</div>
          </div>
          <h2 className="mt-2 text-3xl font-extrabold text-gray-900">Trae AI</h2>
          <p className="mt-2 text-sm text-gray-600">학원 업무 관리 시스템에 로그인하세요</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="이메일 주소를 입력하세요"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  ⚠️
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">또는</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                setIsKakaoLoading(true)
                setError('')
                signIn('kakao', { callbackUrl: '/' }).catch(err => {
                  console.error('카카오 로그인 오류:', err)
                  setError('카카오 로그인 중 오류가 발생했습니다.')
                  setIsKakaoLoading(false)
                })
              }}
              disabled={isKakaoLoading}
              className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-800 bg-yellow-300 hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors duration-200 ${isKakaoLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                <path d="M9 0.5C4.02944 0.5 0 3.52944 0 7.25C0 9.56944 1.49583 11.6139 3.78056 12.7833L2.83333 16.2306C2.76111 16.4722 3.03889 16.6667 3.25278 16.5194L7.35833 13.8667C7.89722 13.9306 8.44167 13.9667 9 13.9667C13.9706 13.9667 18 10.9706 18 7.25C18 3.52944 13.9706 0.5 9 0.5Z" fill="#391B1B"/>
              </svg>
              {isKakaoLoading ? '로그인 중...' : '카카오 계정으로 로그인'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsKakaoLoading(true)
                setError('')
                
                // 카카오 로그인 URL 직접 구성
                const kakaoClientId = 'd8d86e0d1af7385f24961e0b270bc0ab';
                const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/callback/kakao`);
                const callbackUrl = encodeURIComponent('/');
                const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${kakaoClientId}&redirect_uri=${redirectUri}&response_type=code&prompt=login&state=${callbackUrl}`;
                
                // 현재 창에서 카카오 로그인 페이지로 이동
                window.location.href = kakaoAuthUrl;
                
                // 로딩 상태는 페이지 이동으로 자동 해제됨
              }}
              disabled={isKakaoLoading}
              className={`w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors duration-200 ${isKakaoLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isKakaoLoading ? '처리 중...' : '다른 카카오 계정으로 로그인'}
            </button>
          </div>
          
          <div className="text-center text-xs text-gray-500 mt-4">
            <p>테스트 계정: admin@trae.com (관리자) 또는 teacher1@example.com (강사)</p>
          </div>
          
          <div className="text-center text-sm mt-4">
            <p className="text-gray-600">
              계정이 없으신가요?{' '}
              <Link href="/auth/register" className="text-blue-600 hover:text-blue-800 font-medium">
                회원가입
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Register() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    academyName: '',
    email: '',
    phoneNumber: '',
    businessLicense: null as File | null,
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target
    
    if (name === 'businessLicense' && files && files.length > 0) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    // 필수 필드 검증
    if (!formData.businessLicense) {
      setError('사업자 등록증을 첨부해주세요.')
      setIsLoading(false)
      return
    }

    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      setIsLoading(false)
      return
    }

    try {
      // FormData 객체 생성 (파일 업로드를 위해)
      const submitData = new FormData()
      submitData.append('name', formData.name)
      submitData.append('academyName', formData.academyName)
      submitData.append('email', formData.email)
      submitData.append('phoneNumber', formData.phoneNumber)
      submitData.append('password', formData.password)
      if (formData.businessLicense) {
        submitData.append('businessLicense', formData.businessLicense)
      }

      const response = await fetch('/api/register', {
        method: 'POST',
        body: submitData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '회원가입에 실패했습니다.')
      }

      setSuccess(data.message || '회원가입이 완료되었습니다. 관리자 승인 후 이용 가능합니다.')
      // 폼 초기화
      setFormData({
        name: '',
        academyName: '',
        email: '',
        phoneNumber: '',
        businessLicense: null,
        password: '',
        confirmPassword: '',
      })

      // 3초 후 로그인 페이지로 이동
      setTimeout(() => {
        router.push('/auth/signin')
      }, 3000)
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('회원가입 중 오류가 발생했습니다.')
      }
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
          <h2 className="mt-2 text-3xl font-extrabold text-gray-900">학원 관리자 회원가입</h2>
          <p className="mt-2 text-sm text-gray-600">학원 관리 시스템에 새로운 학원을 등록합니다</p>
        </div>

        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">✅</div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
                <p className="text-xs text-green-600 mt-1">잠시 후 로그인 페이지로 이동합니다...</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">⚠️</div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="academyName" className="block text-sm font-medium text-gray-700 mb-1">
                학원 이름
              </label>
              <input
                id="academyName"
                name="academyName"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="학원 이름을 입력하세요"
                value={formData.academyName}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                원장 이름
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="원장님 이름을 입력하세요"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

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
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                전화번호 (- 없이 입력)
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                required
                pattern="[0-9]{10,11}"
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="01012345678"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="businessLicense" className="block text-sm font-medium text-gray-700 mb-1">
                사업자 등록증 첨부 (필수)
              </label>
              <input
                id="businessLicense"
                name="businessLicense"
                type="file"
                required
                accept="image/jpeg,image/png,application/pdf"
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                onChange={handleChange}
              />
              <p className="mt-1 text-xs text-gray-500">JPG, PNG, PDF 형식만 가능합니다. (최대 5MB)</p>
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
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호 확인
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="비밀번호를 다시 입력하세요"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? '처리 중...' : '회원가입'}
            </button>
          </div>

          <div className="text-center text-sm">
            <p className="text-gray-600">
              이미 계정이 있으신가요?{' '}
              <Link href="/auth/signin" className="text-blue-600 hover:text-blue-800 font-medium">
                로그인
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
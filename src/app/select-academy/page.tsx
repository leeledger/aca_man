'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

type Academy = {
  id: string
  name: string
}

export default function SelectAcademy() {
  const router = useRouter()
  const { data: session, update } = useSession()
  const [academies, setAcademies] = useState<Academy[]>([])
  const [selectedAcademy, setSelectedAcademy] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // 학원 목록 가져오기
    const fetchAcademies = async () => {
      try {
        const response = await fetch('/api/academies')
        if (!response.ok) {
          throw new Error('학원 목록을 불러오는데 실패했습니다.')
        }
        const data = await response.json()
        setAcademies(data)
      } catch (err) {
        setError('학원 목록을 불러오는데 실패했습니다.')
        console.error('Failed to fetch academies:', err)
      }
    }

    fetchAcademies()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedAcademy) {
      setError('학원을 선택해주세요.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // 선택한 학원 정보 업데이트
      const response = await fetch('/api/select-academy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ academyId: selectedAcademy }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '학원 선택에 실패했습니다.')
      }

      // 세션 업데이트
      await update({
        ...session,
        user: {
          ...session?.user,
          academyId: selectedAcademy,
        },
      })

      // 홈으로 리다이렉트
      router.push('/')
    } catch (err) {
      console.error('Failed to select academy:', err)
      setError(err instanceof Error ? err.message : '학원 선택에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-md">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">학원 선택</h2>
          <p className="mt-2 text-sm text-gray-600">
            소속 학원을 선택해주세요.
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="academy" className="block text-sm font-medium text-gray-700">
              학원
            </label>
            <select
              id="academy"
              name="academy"
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              value={selectedAcademy}
              onChange={(e) => setSelectedAcademy(e.target.value)}
              disabled={isLoading}
            >
              <option value="">학원을 선택해주세요</option>
              {academies.map((academy) => (
                <option key={academy.id} value={academy.id}>
                  {academy.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              type="submit"
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              disabled={isLoading}
            >
              {isLoading ? '처리 중...' : '선택 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
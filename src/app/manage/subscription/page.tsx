'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

type SubscriptionPlan = {
  id: string
  name: string
  price: number
  description: string
  features: string[]
  duration: number // 개월 단위
}

type Subscription = {
  id: string
  startDate: string
  endDate: string
  status: string
  amount: number
}

// 구독 플랜 정보 (실제로는 DB에서 가져올 수 있음)
const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: '기본 플랜',
    price: 30000,
    description: '소규모 학원을 위한 기본 플랜',
    features: [
      '강사 5명까지 등록 가능',
      '기본 업무 관리 기능',
      '이메일 지원',
    ],
    duration: 1, // 1개월
  },
  {
    id: 'standard',
    name: '스탠다드 플랜',
    price: 50000,
    description: '중규모 학원을 위한 표준 플랜',
    features: [
      '강사 15명까지 등록 가능',
      '고급 업무 관리 기능',
      '우선 이메일 지원',
      '통계 대시보드',
    ],
    duration: 1, // 1개월
  },
  {
    id: 'premium',
    name: '프리미엄 플랜',
    price: 100000,
    description: '대규모 학원을 위한 프리미엄 플랜',
    features: [
      '강사 무제한 등록',
      '모든 고급 기능 이용 가능',
      '우선 이메일 및 전화 지원',
      '고급 통계 및 분석',
      '맞춤형 보고서',
    ],
    duration: 1, // 1개월
  },
]

export default function SubscriptionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<string>('standard')
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    // 로그인하지 않았거나 관리자가 아닌 경우 리다이렉트
    if (status === 'unauthenticated' || (session && session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      router.push('/')
      return
    }

    // 현재 구독 정보 가져오기
    const fetchCurrentSubscription = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/subscription/current')
        
        if (response.ok) {
          const data = await response.json()
          setCurrentSubscription(data)
        }
      } catch (error) {
        console.error('구독 정보 조회 오류:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (session?.user.role === 'ADMIN') {
      fetchCurrentSubscription()
    }
  }, [session, status, router])

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId)
  }

  const handleSubscribe = async () => {
    try {
      setIsProcessing(true)
      setError('')
      setSuccessMessage('')

      const plan = subscriptionPlans.find(p => p.id === selectedPlan)
      if (!plan) {
        throw new Error('선택한 플랜을 찾을 수 없습니다.')
      }

      // 모의 결제 처리
      const response = await fetch('/api/subscription/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: selectedPlan,
          amount: plan.price,
          duration: plan.duration,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '결제 처리 중 오류가 발생했습니다.')
      }

      const data = await response.json()
      setSuccessMessage(data.message || '구독이 성공적으로 처리되었습니다.')
      setCurrentSubscription(data.subscription)

      // 3초 후 성공 메시지 제거
      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('결제 처리 중 오류가 발생했습니다.')
      }

      // 3초 후 에러 메시지 제거
      setTimeout(() => {
        setError('')
      }, 3000)
    } finally {
      setIsProcessing(false)
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
      <h1 className="text-2xl font-bold mb-6">구독 관리</h1>

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

      {currentSubscription && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">현재 구독 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">상태</p>
              <p className="font-medium">
                {currentSubscription.status === 'ACTIVE' ? (
                  <span className="text-green-600">활성</span>
                ) : currentSubscription.status === 'EXPIRED' ? (
                  <span className="text-red-600">만료됨</span>
                ) : (
                  <span className="text-yellow-600">취소됨</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">금액</p>
              <p className="font-medium">{currentSubscription.amount.toLocaleString()}원</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">시작일</p>
              <p className="font-medium">
                {new Date(currentSubscription.startDate).toLocaleDateString('ko-KR')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">만료일</p>
              <p className="font-medium">
                {new Date(currentSubscription.endDate).toLocaleDateString('ko-KR')}
              </p>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-xl font-semibold mb-4">구독 플랜 선택</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {subscriptionPlans.map((plan) => (
          <div 
            key={plan.id} 
            className={`border rounded-lg p-6 cursor-pointer transition-all duration-200 ${selectedPlan === plan.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
            onClick={() => handleSelectPlan(plan.id)}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              {selectedPlan === plan.id && (
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">선택됨</span>
              )}
            </div>
            <p className="text-2xl font-bold mb-2">{plan.price.toLocaleString()}원<span className="text-sm font-normal text-gray-600">/월</span></p>
            <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
            <ul className="space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleSubscribe}
          disabled={isProcessing}
          className={`px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isProcessing ? '처리 중...' : currentSubscription ? '구독 갱신하기' : '구독 시작하기'}
        </button>
      </div>
    </div>
  )
}
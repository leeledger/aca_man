'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AdminDashboard from '@/components/dashboard/AdminDashboard'
import TeacherDashboard from '@/components/dashboard/TeacherDashboard'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="max-w-6xl mx-auto space-y-10 text-center py-10">
        <p>로딩중...</p>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <h1 className="text-3xl font-bold">대시보드</h1>
      
      {session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN' ? (
        <AdminDashboard />
      ) : (
        <TeacherDashboard />
      )}
    </div>
  )
}
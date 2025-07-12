import { getServerSession } from 'next-auth'
import { authOptions } from './api/auth/[...nextauth]/route'
import Link from 'next/link'
import Image from 'next/image'

export default async function Home() {
  const session = await getServerSession(authOptions)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24 bg-gradient-to-b from-blue-50 to-white">
      {session ? (
        <div className="max-w-4xl w-full space-y-8 text-center bg-white p-8 rounded-xl shadow-md border border-gray-100">
          <div className="flex justify-center">
            <div className="text-6xl mb-4">🏫</div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800">
            안녕하세요, <span className="text-blue-600">{session.user.name}</span>님!
          </h1>
          <p className="text-gray-600 text-lg">
            {session.user.role === 'SUPER_ADMIN' ? '서버 관리자' : session.user.role === 'ADMIN' ? '관리자' : '강사'}로 로그인하셨습니다.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Link
              href="/dashboard"
              className="flex flex-col items-center p-6 bg-indigo-50 border border-indigo-100 rounded-xl hover:shadow-md transition-all duration-200 group"
            >
              <div className="text-4xl mb-4">📊</div>
              <h2 className="text-xl font-semibold text-indigo-700 group-hover:text-indigo-800 transition-colors">대시보드</h2>
              <p className="text-gray-600 mt-2 text-sm">업무 현황을 한눈에 확인합니다</p>
            </Link>
            
            <Link
              href="/tasks"
              className="flex flex-col items-center p-6 bg-blue-50 border border-blue-100 rounded-xl hover:shadow-md transition-all duration-200 group"
            >
              <div className="text-4xl mb-4">📋</div>
              <h2 className="text-xl font-semibold text-blue-700 group-hover:text-blue-800 transition-colors">업무 관리</h2>
              <p className="text-gray-600 mt-2 text-sm">업무 목록을 확인하고 상태를 관리합니다</p>
            </Link>
            
            {(session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN') && (
              <Link
                href="/manage"
                className="flex flex-col items-center p-6 bg-green-50 border border-green-100 rounded-xl hover:shadow-md transition-all duration-200 group"
                prefetch={true}
              >
                <div className="text-4xl mb-4">🏢</div>
                <h2 className="text-xl font-semibold text-green-700 group-hover:text-green-800 transition-colors">학원 관리</h2>
                <p className="text-gray-600 mt-2 text-sm">학원 정보와 강사 계정을 관리합니다</p>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-4xl w-full space-y-8 text-center bg-white p-8 rounded-xl shadow-md border border-gray-100">
          <div className="flex justify-center">
            <div className="text-6xl mb-4">🏫</div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800">Trae AI</h1>
          <p className="text-xl text-gray-600 mt-4">학원 업무 관리 시스템</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="flex flex-col items-center p-6 bg-blue-50 rounded-xl">
              <div className="text-4xl mb-4">📋</div>
              <h2 className="text-lg font-semibold text-gray-800">업무 관리</h2>
              <p className="text-gray-600 mt-2 text-sm">효율적인 업무 할당 및 관리</p>
            </div>
            
            <div className="flex flex-col items-center p-6 bg-yellow-50 rounded-xl">
              <div className="text-4xl mb-4">📊</div>
              <h2 className="text-lg font-semibold text-gray-800">상태 추적</h2>
              <p className="text-gray-600 mt-2 text-sm">실시간 업무 진행 상황 확인</p>
            </div>
            
            <div className="flex flex-col items-center p-6 bg-green-50 rounded-xl">
              <div className="text-4xl mb-4">👥</div>
              <h2 className="text-lg font-semibold text-gray-800">강사 관리</h2>
              <p className="text-gray-600 mt-2 text-sm">강사별 업무 할당 및 관리</p>
            </div>
          </div>
          
          <div className="mt-12">
            <Link
              href="/auth/signin"
              className="inline-block px-8 py-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-lg font-medium shadow-md hover:shadow-lg"
            >
              로그인하여 시작하기
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}
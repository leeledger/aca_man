'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'

export default function Header() {
  const { data: session } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-md sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-blue-600 flex items-center">
              <span className="mr-2">🏫</span> Trae AI
            </Link>
            {session && (
              <nav className="hidden md:flex ml-10 space-x-4">
                <Link
                  href="/dashboard"
                  className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  대시보드
                </Link>
                <Link
                  href="/tasks"
                  className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  업무 관리
                </Link>
                {(session.user?.role === 'ADMIN' || session.user?.role === 'SUPER_ADMIN') && (
                  <Link
                    href="/manage"
                    className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                    prefetch={true}
                  >
                    학원 관리
                  </Link>
                )}
              </nav>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? '✕' : '☰'}
            </button>
          </div>
          
          <div className="hidden md:flex items-center">
            {session ? (
              <div className="flex items-center space-x-4">
                <Link href="/profile" className="text-sm text-gray-700 bg-gray-50 px-3 py-1 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors">
                  <span className="font-medium">{session.user?.name}</span>
                  <span className="ml-1 text-gray-500">
                    ({session.user?.role === 'SUPER_ADMIN' ? '서버 관리자' : session.user?.role === 'ADMIN' ? '관리자' : '강사'})
                  </span>
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-gray-600 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 shadow-sm"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile menu, show/hide based on menu state */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 border-t border-gray-200">
            {session && (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-600 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  대시보드
                </Link>
                <Link
                  href="/tasks"
                  className="text-gray-600 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  업무 관리
                </Link>
                {(session.user?.role === 'ADMIN' || session.user?.role === 'SUPER_ADMIN') && (
                  <Link
                    href="/manage"
                    className="text-gray-600 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMenuOpen(false)}
                    prefetch={true}
                  >
                    학원 관리
                  </Link>
                )}
                <div className="border-t border-gray-200 pt-4 pb-3">
                  <div className="px-3">
                    <div className="text-base font-medium text-gray-800">{session.user?.name}</div>
                    <div className="text-sm font-medium text-gray-500">{session.user?.role === 'SUPER_ADMIN' ? '서버 관리자' : session.user?.role === 'ADMIN' ? '관리자' : '강사'}</div>
                  </div>
                  <div className="mt-3 px-2 space-y-1">
                    <Link
                      href="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                    >
                      내 프로필
                    </Link>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        signOut();
                      }}
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-red-600 hover:bg-red-50"
                    >
                      로그아웃
                    </button>
                  </div>
                </div>
              </>
            )}
            {!session && (
              <Link
                href="/auth/signin"
                className="block w-full text-center px-3 py-2 rounded-md text-base font-medium bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => setIsMenuOpen(false)}
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
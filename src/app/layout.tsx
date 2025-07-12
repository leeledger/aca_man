import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { getServerSession } from 'next-auth'
import { authOptions } from './api/auth/[...nextauth]/route'
import SessionProvider from '@/components/SessionProvider'
import Header from '@/components/Header'
import { initializeServer } from './api/init'
import { ToastProvider } from '@/components/ui/Toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '학원 업무 관리 시스템',
  description: '학원 업무 관리 및 진행 상황 추적 시스템',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 서버 사이드에서만 초기화 함수 호출
  if (typeof window === 'undefined') {
    initializeServer();
  }
  
  const session = await getServerSession(authOptions)

  return (
    <html lang="ko">
      <body className={inter.className}>
        <SessionProvider session={session}>
          <ToastProvider>
            <Header />
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
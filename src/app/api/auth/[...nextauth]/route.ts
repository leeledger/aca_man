import { NextAuthOptions } from 'next-auth'
import NextAuth from 'next-auth/next'
import CredentialsProvider from 'next-auth/providers/credentials'
import KakaoProvider from 'next-auth/providers/kakao'
import prisma from '@/lib/prisma'
import { compare } from 'bcrypt'

// Define authOptions but don't export it directly
const authOptions: NextAuthOptions = {
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID || '',
      clientSecret: process.env.KAKAO_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: '이메일', type: 'email' },
        password: { label: '비밀번호', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          })

          // 사용자가 존재하지 않거나 승인되지 않은 경우
          if (!user || !user.isApproved) {
            return null
          }

          // 개발 환경이거나 시드 데이터인 경우 비밀번호 검증 생략
          if (process.env.NODE_ENV === 'development' && !user.password) {
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              academyId: user.academyId,
              isApproved: user.isApproved,
              isKakaoLinked: user.isKakaoLinked || false,
            }
          }
          
          // 비밀번호 검증
          if (user.password && credentials.password) {
            const isPasswordValid = await compare(credentials.password, user.password)
            if (isPasswordValid) {
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                academyId: user.academyId,
                isApproved: user.isApproved,
                isKakaoLinked: user.isKakaoLinked || false,
              }
            }
          }

          return null
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // 카카오 로그인 처리
      if (account?.provider === 'kakao') {
        try {
          // 카카오 이메일로 사용자 조회
          const kakaoEmail = profile?.kakao_account?.email
          if (!kakaoEmail) return false
          
          // 카카오 토큰 정보 저장
          const kakaoAccessToken = account.access_token
          const kakaoRefreshToken = account.refresh_token
          const kakaoId = String(profile.id) // 문자열로 변환
          
          // 기존 사용자 확인
          let dbUser = await prisma.user.findUnique({
            where: { email: kakaoEmail },
          })
          
          // 사용자가 없으면 새로 생성 (학원 선택 없이)
          if (!dbUser) {
            // 새 사용자 생성 (자동 승인, 학원 선택 없음)
            dbUser = await prisma.user.create({
              data: {
                name: profile?.kakao_account?.profile?.nickname || '카카오 사용자',
                email: kakaoEmail,
                role: 'TEACHER', // 기본 역할
                academyId: null, // 학원 선택 없음
                isApproved: true, // 카카오 로그인은 자동 승인
                kakaoAccessToken,
                kakaoRefreshToken,
                kakaoId,
                isKakaoLinked: true,
              },
            })
          } else {
            // 기존 사용자의 카카오 연동 정보 업데이트
            dbUser = await prisma.user.update({
              where: { id: dbUser.id },
              data: {
                kakaoAccessToken,
                kakaoRefreshToken,
                kakaoId,
                isKakaoLinked: true,
              }
            })
          }
          
          // 승인되지 않은 사용자는 로그인 불가
          if (!dbUser.isApproved) return false
          
          // 사용자 정보 업데이트
          user.id = dbUser.id
          user.name = dbUser.name
          user.email = dbUser.email
          user.role = dbUser.role
          user.academyId = dbUser.academyId
          user.isApproved = dbUser.isApproved
          
          return true
        } catch (error) {
          console.error('카카오 로그인 오류:', error)
          return false
        }
      }
      
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.academyId = user.academyId
        token.isApproved = user.isApproved
        token.isKakaoLinked = user.isKakaoLinked
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER'
        session.user.academyId = token.academyId as string | null
        session.user.isApproved = token.isApproved as boolean
        session.user.isKakaoLinked = token.isKakaoLinked as boolean | undefined
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // state 파라미터가 있으면 해당 URL로 리디렉션
      try {
        const urlObj = new URL(url)
        const state = urlObj.searchParams.get('state')
        
        if (state) {
          // state가 URL인 경우 해당 URL로 리디렉션
          try {
            const decodedState = decodeURIComponent(state)
            if (decodedState.startsWith('/')) {
              return `${baseUrl}${decodedState}`
            }
          } catch (error) {
            console.error('Error decoding state parameter:', error)
          }
        }
      } catch (error) {
        console.error('Error parsing URL:', error)
      }
      
      // 기본 리디렉션 로직
      if (url.startsWith('/')) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
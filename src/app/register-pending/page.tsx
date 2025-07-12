import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

export default async function RegisterPending() {
  const session = await getServerSession()

  if (session) {
    redirect('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg text-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">승인 대기 중</h2>
          <div className="mt-4 space-y-4 text-gray-600">
            <p>
              회원가입이 완료되었습니다.
              <br />
              관리자의 승인을 기다리고 있습니다.
            </p>
            <p className="text-sm">
              승인이 완료되면 서비스를 이용하실 수 있습니다.
              <br />
              관리자에게 문의해 주세요.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            이미 승인되었다면{' '}
            <a
              href="/auth/signin"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              다시 로그인
            </a>
            해 주세요.
          </p>
        </div>
      </div>
    </div>
  )
}
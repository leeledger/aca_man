import Link from 'next/link'

export default function AuthError({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const errorMessages: Record<string, string> = {
    default: '로그인 중 오류가 발생했습니다.',
    configuration: '서버 설정에 문제가 있습니다.',
    accessdenied: '접근이 거부되었습니다.',
    verification: '이메일 인증에 실패했습니다.',
  }

  const error = searchParams.error || 'default'
  const errorMessage = errorMessages[error] || errorMessages.default

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg text-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">로그인 오류</h2>
          <p className="mt-2 text-red-600">{errorMessage}</p>
        </div>

        <div className="mt-8">
          <Link
            href="/auth/signin"
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            로그인 페이지로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  )
}
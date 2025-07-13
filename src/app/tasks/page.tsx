import { getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/auth-options'
import TaskList from '@/components/tasks/TaskList'
import CreateTaskButton from '@/components/tasks/CreateTaskButton'

export default async function TasksPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return (
      <div className="text-center py-10">
        <p className="text-xl text-gray-600">로그인이 필요한 서비스입니다.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">업무 목록</h1>
        {session.user?.role === 'ADMIN' && <CreateTaskButton />}
      </div>
      
      <TaskList />
    </div>
  )
}
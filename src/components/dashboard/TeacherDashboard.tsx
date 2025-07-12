'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import TaskStatusBadge from '../tasks/TaskStatusBadge'

type Task = {
  id: string
  title: string
  description?: string
  dueDate: string
  status: string
  assignedTo: {
    id: string
    name: string
    email: string
  }
  createdBy: {
    name: string
  }
}

type TaskStats = {
  total: number
  registered: number
  confirmed: number
  inProgress: number
  completed: number
}

export default function TeacherDashboard() {
  const { data: session } = useSession()
  const [tasks, setTasks] = useState<Task[]>([])
  const [taskStats, setTaskStats] = useState<TaskStats>({
    total: 0,
    registered: 0,
    confirmed: 0,
    inProgress: 0,
    completed: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks')
      const allTasks: Task[] = await response.json()
      
      // 현재 로그인한 강사에게 할당된 업무만 필터링
      const myTasks = allTasks.filter(task => 
        task.assignedTo.email === session?.user?.email
      )
      
      setTasks(myTasks)
      
      // 업무 통계 계산
      setTaskStats({
        total: myTasks.length,
        registered: myTasks.filter(task => task.status === 'REGISTERED').length,
        confirmed: myTasks.filter(task => task.status === 'CONFIRMED').length,
        inProgress: myTasks.filter(task => task.status === 'IN_PROGRESS').length,
        completed: myTasks.filter(task => task.status === 'COMPLETED').length,
      })
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchTasks()
      }
    } catch (error) {
      console.error('Failed to update task status:', error)
    }
  }

  if (isLoading) {
    return <div className="text-center py-10">로딩중...</div>
  }

  return (
    <div className="space-y-6">
      {/* 업무 통계 요약 */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">업무 현황</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-gray-700">{taskStats.total}</div>
            <div className="text-sm text-gray-500">전체 업무</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-yellow-700">{taskStats.inProgress}</div>
            <div className="text-sm text-yellow-500">진행중</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-blue-700">{taskStats.confirmed}</div>
            <div className="text-sm text-blue-500">확인됨</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-green-700">{taskStats.completed}</div>
            <div className="text-sm text-green-500">완료</div>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
          <div 
            className="bg-green-600 h-2.5 rounded-full" 
            style={{ width: `${taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0}%` }}
          ></div>
        </div>
        <div className="text-sm text-gray-500 text-right">
          완료율: {taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}%
        </div>
      </div>
      
      {/* 최근 업무 목록 */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">내 업무 목록</h2>
          <Link href="/tasks" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            모든 업무 보기 →
          </Link>
        </div>
        
        <div className="space-y-4">
          {tasks.length > 0 ? (
            tasks.map(task => (
              <div 
                key={task.id} 
                className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-800">{task.title}</h3>
                  <TaskStatusBadge status={task.status} />
                </div>
                
                {task.description && (
                  <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                )}
                
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <div>등록자: {task.createdBy.name}</div>
                  <div>
                    {task.dueDate ? new Date(task.dueDate).toLocaleString('ko-KR', { 
                      year: 'numeric', month: 'numeric', day: 'numeric' 
                    }) : '기한 없음'}
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end space-x-2">
                  {task.status !== 'CONFIRMED' && (
                    <button
                      onClick={() => updateTaskStatus(task.id, 'CONFIRMED')}
                      className="px-3 py-1 text-xs rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                    >
                      확인
                    </button>
                  )}
                  {task.status !== 'IN_PROGRESS' && (
                    <button
                      onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')}
                      className="px-3 py-1 text-xs rounded-md bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors"
                    >
                      진행중
                    </button>
                  )}
                  {task.status !== 'COMPLETED' && (
                    <button
                      onClick={() => updateTaskStatus(task.id, 'COMPLETED')}
                      className="px-3 py-1 text-xs rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                    >
                      완료
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              할당된 업무가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
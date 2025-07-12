'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Teacher = {
  id: string
  name: string
  email: string
  role: string
}

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

type TeacherWithTasks = Teacher & {
  tasks: Task[]
  taskStats: {
    total: number
    registered: number
    confirmed: number
    inProgress: number
    completed: number
  }
}

export default function AdminDashboard() {
  const [teachersWithTasks, setTeachersWithTasks] = useState<TeacherWithTasks[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTeachersAndTasks()
  }, [])

  const fetchTeachersAndTasks = async () => {
    try {
      // 강사 목록 가져오기
      const teachersResponse = await fetch('/api/teachers')
      const teachers: Teacher[] = await teachersResponse.json()
      
      // 업무 목록 가져오기
      const tasksResponse = await fetch('/api/tasks')
      const tasks: Task[] = await tasksResponse.json()
      
      // 강사별 업무 통계 계산
      const teachersData = teachers
        .filter(teacher => teacher.role === 'TEACHER') // 관리자 제외
        .map(teacher => {
          const teacherTasks = tasks.filter(task => 
            task.assignedTo.id === teacher.id
          )
          
          const taskStats = {
            total: teacherTasks.length,
            registered: teacherTasks.filter(task => task.status === 'REGISTERED').length,
            confirmed: teacherTasks.filter(task => task.status === 'CONFIRMED').length,
            inProgress: teacherTasks.filter(task => task.status === 'IN_PROGRESS').length,
            completed: teacherTasks.filter(task => task.status === 'COMPLETED').length,
          }
          
          return {
            ...teacher,
            tasks: teacherTasks,
            taskStats
          }
        })
      
      setTeachersWithTasks(teachersData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div className="text-center py-10">로딩중...</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachersWithTasks.map(teacher => (
          <div key={teacher.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">{teacher.name}</h3>
                <p className="text-gray-600 text-sm">{teacher.email}</p>
              </div>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                업무 {teacher.taskStats.total}개
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-green-600 h-2.5 rounded-full" 
                  style={{ width: `${teacher.taskStats.total > 0 ? (teacher.taskStats.completed / teacher.taskStats.total) * 100 : 0}%` }}
                ></div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-gray-300 rounded-full mr-2"></span>
                  <span>등록됨: {teacher.taskStats.registered}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-blue-300 rounded-full mr-2"></span>
                  <span>확인됨: {teacher.taskStats.confirmed}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-yellow-300 rounded-full mr-2"></span>
                  <span>진행중: {teacher.taskStats.inProgress}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  <span>완료: {teacher.taskStats.completed}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link 
                href={`/tasks?teacher=${teacher.email}`}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                업무 상세 보기 →
              </Link>
            </div>
          </div>
        ))}
      </div>
      
      {teachersWithTasks.length === 0 && (
        <div className="text-center py-10 bg-white rounded-lg shadow-md">
          <p className="text-gray-600">등록된 강사가 없습니다.</p>
        </div>
      )}
    </div>
  )
}
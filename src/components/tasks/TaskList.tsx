'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import TaskStatusBadge from './TaskStatusBadge'
import Image from 'next/image'
import Pagination from '@/components/ui/Pagination'
import EditTaskModal from './EditTaskModal'
import TeacherTaskModal from './TeacherTaskModal'
import ImageModal from '@/components/ui/ImageModal'

type Task = {
  id: string
  title: string
  description?: string
  images?: string
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

type UploadedImage = {
  url: string
  file?: File
}

type Teacher = {
  id: string
  name: string
  email: string
}

export default function TaskList() {
  const { data: session } = useSession()
  const [tasks, setTasks] = useState<Task[]>([])
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false)
  // 이미지 업로드 관련 상태는 모달로 이동됨
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1)
  const [tasksPerPage] = useState(5) // 페이지당 표시할 업무 수
  
  // 업무 수정 모달 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState<Task | null>(null)
  
  // 강사용 업무 상태 변경 모달 상태
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false)
  const [selectedTaskForTeacher, setSelectedTaskForTeacher] = useState<Task | null>(null)
  
  // 이미지 리뷰 모달 상태
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('')

  useEffect(() => {
    fetchTasks()
    
    // 관리자인 경우에만 강사 목록 가져오기
    if (session?.user?.role === 'ADMIN') {
      fetchTeachers()
    }
    
    // URL에서 teacher 파라미터 확인
    const urlParams = new URLSearchParams(window.location.search)
    const teacherEmail = urlParams.get('teacher')
    if (teacherEmail) {
      setSelectedTeacher(teacherEmail)
    }
  }, [session])

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks')
      const data = await response.json()
      setAllTasks(data)
      setTasks(data)
      
      // URL에서 teacher 파라미터 확인 (관리자만 적용)
      if (session?.user?.role === 'ADMIN') {
        const urlParams = new URLSearchParams(window.location.search)
        const teacherEmail = urlParams.get('teacher')
        
        if (teacherEmail && teacherEmail !== 'all') {
          // 특정 강사의 업무만 필터링
          const filteredTasks = data.filter(task => task.assignedTo.email === teacherEmail)
          setTasks(filteredTasks)
        }
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/teachers')
      if (response.ok) {
        const data = await response.json()
        setTeachers(data)
      }
    } catch (error) {
      console.error('Failed to fetch teachers:', error)
    }
  }
  
  const filterTasksByTeacher = (teacherId: string) => {
    // 강사는 필터링 기능을 사용할 수 없음
    if (session?.user?.role !== 'ADMIN') return
    
    setSelectedTeacher(teacherId)
    setCurrentPage(1) // 필터 변경 시 첫 페이지로 이동
    
    if (teacherId === 'all') {
      setTasks(allTasks)
    } else {
      const filteredTasks = allTasks.filter(task => task.assignedTo.email === teacherId)
      setTasks(filteredTasks)
    }
  }
  
  // 페이지 변경 핸들러
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  // 이미지 업로드 관련 함수는 모달로 이동됨

  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    setStatusUpdateLoading(true)
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus
        }),
      })

      if (response.ok) {
        // 상태 업데이트 성공 시 목록 새로고침
        fetchTasks()
      }
    } catch (error) {
      console.error('Failed to update task status:', error)
    } finally {
      setStatusUpdateLoading(false)
    }
  }

  if (isLoading) {
    return <div className="text-center py-10">로딩중...</div>
  }

  // 현재 페이지에 표시할 업무 계산
  const indexOfLastTask = currentPage * tasksPerPage
  const indexOfFirstTask = indexOfLastTask - tasksPerPage
  const currentTasks = tasks.slice(indexOfFirstTask, indexOfLastTask)
  const totalPages = Math.ceil(tasks.length / tasksPerPage)

  return (
    <div className="space-y-6">
      {/* 관리자만 강사별 필터링 표시 */}
      {session?.user?.role === 'ADMIN' && (
        <div className="mb-6 bg-white rounded-lg shadow-md p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <label htmlFor="teacherFilter" className="font-medium text-gray-700 mr-3">강사별 필터링:</label>
              <select
                id="teacherFilter"
                value={selectedTeacher}
                onChange={(e) => filterTasksByTeacher(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">전체 보기</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.email}>{teacher.name}</option>
                ))}
              </select>
            </div>
            <div className="text-sm text-gray-500">
              전체 {tasks.length}개 중 {indexOfFirstTask + 1}-{Math.min(indexOfLastTask, tasks.length)}개 표시
            </div>
          </div>
        </div>
      )}
      
      {/* 강사인 경우 업무 개수 표시 */}
      {session?.user?.role === 'TEACHER' && (
        <div className="mb-6 bg-white rounded-lg shadow-md p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              내 업무 목록
            </div>
            <div className="text-sm text-gray-500">
              전체 {tasks.length}개 중 {indexOfFirstTask + 1}-{Math.min(indexOfLastTask, tasks.length)}개 표시
            </div>
          </div>
        </div>
      )}
      
      {currentTasks.map((task) => (
        <div
          key={task.id}
          className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 p-6 space-y-4 border border-gray-100"
        >
          <div className="flex justify-between items-start">
            <div 
              className="flex-1 pr-4 cursor-pointer" 
              onClick={() => {
                // 사용자 역할에 따라 다른 모달 열기
                if (session?.user?.role === 'ADMIN') {
                  // 관리자는 기존 수정 모달 사용
                  setSelectedTaskForEdit(task)
                  setIsEditModalOpen(true)
                } else {
                  // 강사는 상태 변경 모달 사용
                  setSelectedTaskForTeacher(task)
                  setIsTeacherModalOpen(true)
                }
              }}
            >
              <h3 className="text-xl font-semibold text-gray-800 hover:text-blue-600 transition-colors">{task.title}</h3>
              {task.description && (
                <p className="text-gray-600 mt-2 text-sm">{task.description}</p>
              )}
              
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {task.images && (
                  <>
                    {JSON.parse(task.images).map((imageUrl: string, index: number) => (
                      <div key={index} className="relative group">
                        <div 
                          className="relative h-12 w-12 overflow-hidden rounded-md border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation(); // 이벤트 버블링 방지
                            setSelectedImageUrl(imageUrl);
                            setIsImageModalOpen(true);
                          }}
                        >
                          <Image
                            src={imageUrl}
                            alt={`Task image ${index + 1}`}
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>
                    ))}
                  </>
                )}
                
                {/* 이미지 첨부 버튼은 모달로 이동됨 */}
              </div>
            </div>
            <TaskStatusBadge status={task.status} />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
            <div>
              <p className="flex items-center"><span className="w-16 inline-block font-medium">담당:</span> {task.assignedTo.name}</p>
              <p className="flex items-center mt-1"><span className="w-16 inline-block font-medium">등록자:</span> {task.createdBy.name}</p>
            </div>
            <div className="flex items-center">
              <span className="font-medium mr-2">예정 완료일:</span>
              <span className="bg-white px-2 py-1 rounded border border-gray-200">
                {task.dueDate ? new Date(task.dueDate).toLocaleString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '미정'}
              </span>
            </div>
          </div>

          {((session?.user?.role === 'ADMIN') ||
            (session?.user?.email === task.assignedTo.email)) && (
            <div className="flex flex-col space-y-4 pt-4 border-t border-gray-100">
              {/* 이미지 업로드 영역은 모달로 이동됨 */}
              
              <div className="flex justify-end space-x-3">
                {task.status !== 'CONFIRMED' && (
                  <button
                    onClick={() => updateTaskStatus(task.id, 'CONFIRMED')}
                    disabled={statusUpdateLoading}
                    className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${task.status === 'REGISTERED' 
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} disabled:opacity-50`}
                  >
                    확인
                  </button>
                )}
                {task.status !== 'IN_PROGRESS' && (
                  <button
                    onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')}
                    disabled={statusUpdateLoading}
                    className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${task.status === 'CONFIRMED' 
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} disabled:opacity-50`}
                  >
                    진행중
                  </button>
                )}
                {task.status !== 'COMPLETED' && (
                  <button
                    onClick={() => updateTaskStatus(task.id, 'COMPLETED')}
                    disabled={statusUpdateLoading}
                    className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${task.status === 'IN_PROGRESS' 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'} disabled:opacity-50`}
                  >
                    완료
                  </button>
                )}

              </div>
            </div>
          )}
        </div>
      ))}
      
      {/* 페이지네이션 */}
      {tasks.length > 0 && (
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={handlePageChange} 
        />
      )}
      
      {/* 데이터가 없을 때 메시지 표시 */}
      {tasks.length === 0 && !isLoading && (
        <div className="text-center py-10 bg-white rounded-lg shadow-md border border-gray-100">
          <p className="text-gray-500">표시할 업무가 없습니다.</p>
        </div>
      )}
      
      {/* 업무 수정 모달 */}
      <EditTaskModal 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedTaskForEdit(null)
        }} 
        task={selectedTaskForEdit} 
      />
      
      {/* 강사용 업무 상태 변경 모달 */}
      <TeacherTaskModal 
        isOpen={isTeacherModalOpen} 
        onClose={() => {
          setIsTeacherModalOpen(false)
          setSelectedTaskForTeacher(null)
          fetchTasks() // 모달이 닫힐 때 업무 목록 새로고침
        }} 
        task={selectedTaskForTeacher}
      />
      
      {/* 이미지 리뷰 모달 */}
      <ImageModal 
        imageUrl={selectedImageUrl}
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
      />
    </div>
  )
}
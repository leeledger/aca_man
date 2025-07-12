'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Teacher = {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

export default function TeacherManagement() {
  const router = useRouter()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [isAddingTeacher, setIsAddingTeacher] = useState(false)
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    email: '',
    role: 'TEACHER',
    password: '',
  })

  useEffect(() => {
    fetchTeachers()
  }, [])

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/teachers')
      const data = await response.json()
      setTeachers(data)
    } catch (error) {
      console.error('Failed to fetch teachers:', error)
    }
  }

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTeacher),
      })

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || '강사 추가에 실패했습니다.');
        return;
      }

      setNewTeacher({ name: '', email: '', role: 'TEACHER', password: '' })
      setIsAddingTeacher(false)
      fetchTeachers()
      router.refresh()
    } catch (error) {
      console.error('Failed to add teacher:', error)
      alert('강사 추가 중 오류가 발생했습니다.')
    }
  }

  const handleDeleteTeacher = async (teacherId: string) => {
    if (!confirm('정말 이 강사를 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/teachers/${teacherId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || '강사 삭제에 실패했습니다.');
        return;
      }

      fetchTeachers()
      router.refresh()
    } catch (error) {
      console.error('Failed to delete teacher:', error)
      alert('강사 삭제 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="space-y-6">
      {isAddingTeacher ? (
        <form onSubmit={handleAddTeacher} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이름
            </label>
            <input
              type="text"
              required
              value={newTeacher.name}
              onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일
            </label>
            <input
              type="email"
              required
              value={newTeacher.email}
              onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <input
              type="password"
              required
              value={newTeacher.password}
              onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="초기 비밀번호 설정"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              권한
            </label>
            <select
              value={newTeacher.role}
              onChange={(e) => setNewTeacher({ ...newTeacher, role: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="TEACHER">강사</option>
              <option value="ADMIN">관리자</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsAddingTeacher(false)}
              className="btn-secondary"
            >
              취소
            </button>
            <button type="submit" className="btn-primary">
              추가
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsAddingTeacher(true)}
          className="btn-primary"
        >
          강사 추가
        </button>
      )}

      <div className="space-y-4">
        {teachers.map((teacher) => (
          <div
            key={teacher.id}
            className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
          >
            <div>
              <h3 className="font-medium">{teacher.name}</h3>
              <p className="text-sm text-gray-600">{teacher.email}</p>
              <span className={`text-xs px-2 py-1 rounded-full ${teacher.role === 'ADMIN' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                {teacher.role === 'ADMIN' ? '관리자' : '강사'}
              </span>
            </div>
            <button
              onClick={() => handleDeleteTeacher(teacher.id)}
              className="text-red-600 hover:text-red-800"
            >
              삭제
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
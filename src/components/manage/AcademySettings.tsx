'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Academy = {
  id: string
  name: string
}

export default function AcademySettings() {
  const router = useRouter()
  const [academy, setAcademy] = useState<Academy | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState('')

  useEffect(() => {
    fetchAcademyInfo()
  }, [])

  const fetchAcademyInfo = async () => {
    try {
      const response = await fetch('/api/academy')
      const data = await response.json()
      setAcademy(data)
      setEditedName(data.name)
    } catch (error) {
      console.error('Failed to fetch academy info:', error)
    }
  }

  const handleUpdateAcademy = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/academy', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: editedName }),
      })

      if (response.ok) {
        setIsEditing(false)
        fetchAcademyInfo()
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to update academy:', error)
    }
  }

  if (!academy) {
    return <div>로딩중...</div>
  }

  return (
    <div className="space-y-6">
      {isEditing ? (
        <form onSubmit={handleUpdateAcademy} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              학원명
            </label>
            <input
              type="text"
              required
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false)
                setEditedName(academy.name)
              }}
              className="btn-secondary"
            >
              취소
            </button>
            <button type="submit" className="btn-primary">
              저장
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-gray-500">학원명</h3>
              <p className="mt-1 text-lg">{academy.name}</p>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="btn-secondary"
            >
              수정
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
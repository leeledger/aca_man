'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

type StatusHistoryItem = {
  id: string
  taskId: string
  previousStatus: string
  newStatus: string
  changedById: string
  changedByName: string | null
  changedByRole: string
  createdAt: string
}

const statusLabels: Record<string, string> = {
  REGISTERED: '등록됨',
  CONFIRMED: '확인됨',
  IN_PROGRESS: '진행중',
  COMPLETED: '완료',
}

export default function TaskStatusHistory({ taskId }: { taskId: string }) {
  const [history, setHistory] = useState<StatusHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/tasks/${taskId}/history`)
        if (!response.ok) {
          throw new Error('이력 조회에 실패했습니다')
        }
        const data = await response.json()
        setHistory(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '이력 조회에 실패했습니다')
      } finally {
        setIsLoading(false)
      }
    }

    if (taskId) {
      fetchHistory()
    }
  }, [taskId])

  if (isLoading) {
    return <div className="text-center py-4">이력을 불러오는 중...</div>
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>
  }

  if (history.length === 0) {
    return <div className="text-center py-4 text-gray-500">상태 변경 이력이 없습니다</div>
  }

  return (
    <div className="mt-4">
      <h3 className="text-lg font-medium mb-3">상태 변경 이력</h3>
      <div className="overflow-hidden border border-gray-200 rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                변경 일시
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                이전 상태
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                변경 상태
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                변경자
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {history.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(item.createdAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100">
                    {statusLabels[item.previousStatus] || item.previousStatus}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100">
                    {statusLabels[item.newStatus] || item.newStatus}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {item.changedByName || '알 수 없음'}
                  {item.changedByRole === 'ADMIN' ? ' (원장)' : ' (강사)'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
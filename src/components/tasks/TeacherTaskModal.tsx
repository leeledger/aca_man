'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useToast } from '@/components/ui/Toast'
import TaskStatusHistory from './TaskStatusHistory'

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

export default function TeacherTaskModal({
  isOpen,
  onClose,
  task,
}: {
  isOpen: boolean
  onClose: () => void
  task: Task | null
}) {
  const router = useRouter()
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    status: '',
    progressNote: '',
    dueDate: '',
    delayReason: '',
    images: [] as UploadedImage[],
  })
  
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 날짜를 로컬 시간대 기반의 ISO 문자열로 변환하는 함수
  const formatDateToLocalISOString = (date: string | null | undefined): string => {
    if (!date) return '';
    
    const localDate = new Date(date);
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const hours = String(localDate.getHours()).padStart(2, '0');
    const minutes = String(localDate.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  
  // 이미지 업로드 함수
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      throw new Error('이미지 업로드에 실패했습니다.')
    }
    
    const data = await response.json()
    return data.url
  }
  
  // 이미지 추가 핸들러
  const handleAddImage = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    
    setIsLoading(true)
    setError('')
    
    try {
      const newImages: UploadedImage[] = [...formData.images]
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!file.type.startsWith('image/')) continue
        
        // 이미지 파일 업로드
        const url = await uploadImage(file)
        newImages.push({ url, file })
      }
      
      setFormData({ ...formData, images: newImages })
      setUploadedImages(newImages)
    } catch (error) {
      console.error('Failed to add image:', error)
      setError('이미지 업로드에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }
  
  // 이미지 삭제 핸들러
  const handleRemoveImage = (index: number) => {
    const newImages = [...formData.images]
    newImages.splice(index, 1)
    setFormData({ ...formData, images: newImages })
    setUploadedImages(newImages)
  }
  
  // 드래그 앤 드롭 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  
  const handleDragLeave = () => {
    setIsDragging(false)
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleAddImage(e.dataTransfer.files)
  }
  
  // 붙여넣기 핸들러
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    const files = []

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile()
        if (file) files.push(file)
      }
    }

    if (files.length > 0) {
      e.preventDefault()
      handleAddImage(files as unknown as FileList)
    }
  }

  useEffect(() => {
    if (isOpen && task) {
      // 업무 데이터로 폼 초기화
      const initialImages = uploadedImages.length > 0 ? uploadedImages : [];
      
      // 기존 이미지가 있으면 추가
      if (task.images) {
        try {
          const existingImages = JSON.parse(task.images);
          const formattedImages = existingImages.map((url: string) => ({ url }));
          
          // 중복 이미지 제거 (URL 기준)
          const uniqueImages = [...initialImages];
          formattedImages.forEach((img: UploadedImage) => {
            if (!uniqueImages.some(existing => existing.url === img.url)) {
              uniqueImages.push(img);
            }
          });
          
          setFormData({
            status: task.status,
            progressNote: '',
            dueDate: formatDateToLocalISOString(task.dueDate),
            delayReason: '',
            images: uniqueImages,
          });
        } catch (e) {
          console.error('이미지 파싱 오류:', e);
          setFormData({
            status: task.status,
            progressNote: '',
            dueDate: formatDateToLocalISOString(task.dueDate),
            delayReason: '',
            images: initialImages,
          });
        }
      } else {
        setFormData({
          status: task.status,
          progressNote: '',
          dueDate: formatDateToLocalISOString(task.dueDate),
          delayReason: '',
          images: initialImages,
        });
      }
    }
  }, [isOpen, task, uploadedImages])

  if (!isOpen || !task) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 날짜 형식을 표준화하여 비교
    const originalDate = task.dueDate ? new Date(task.dueDate).getTime() : 0;
    const newDate = formData.dueDate ? new Date(formData.dueDate).getTime() : 0;
    const isDateChanged = originalDate !== newDate;
    
    // 일정이 변경되었는데 사유가 없는 경우에만 검증
    if (isDateChanged && !formData.delayReason.trim()) {
      setError('일정이 변경된 경우 변경 사유를 반드시 입력해야 합니다.')
      return
    }
    
    setIsLoading(true)
    setError('')

    try {
      // 이미지가 있으면 이미지 URL 배열 생성
      const imageUrls = formData.images.map(img => img.url)
      const newImages = imageUrls.length > 0 ? JSON.stringify(imageUrls) : undefined

      // 진행 상황 노트와 지연 사유를 설명에 추가
      let updatedDescription = task.description || ''
      
      if (formData.progressNote) {
        const date = new Date().toLocaleString('ko-KR')
        updatedDescription += `\n\n[진행 상황 - ${date}]\n${formData.progressNote}`
      }
      
      // 일정이 변경된 경우에만 지연 사유 추가
      if (isDateChanged && formData.delayReason) {
        const date = new Date().toLocaleString('ko-KR')
        updatedDescription += `\n\n[일정 변경 사유 - ${date}]\n${formData.delayReason}`
      }

      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: formData.status,
          description: updatedDescription,
          dueDate: formData.dueDate,
          newImages: newImages
        }),
      })

      if (response.ok) {
        showToast('업무가 성공적으로 업데이트되었습니다.', 'success')
        router.refresh()
        onClose()
      } else {
        const data = await response.json()
        setError(data.error || '업무 업데이트에 실패했습니다.')
      }
    } catch (error) {
      console.error('Failed to update task:', error)
      setError('서버 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all relative z-10"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">업무 상태 업데이트</h3>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500"
              onClick={onClose}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">업무 정보</h4>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-lg font-semibold text-gray-800">{task.title}</p>
                {task.description && (
                  <p className="text-gray-600 mt-2 text-sm whitespace-pre-line">{task.description}</p>
                )}
                
                {task.images && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {JSON.parse(task.images).map((imageUrl: string, index: number) => (
                      <div key={index} className="relative group">
                        <div className="relative h-16 w-16 overflow-hidden rounded-md border border-gray-200">
                          <Image
                            src={imageUrl}
                            alt={`Task image ${index + 1}`}
                            width={64}
                            height={64}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                업무 상태
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="REGISTERED">등록됨</option>
                <option value="CONFIRMED">확인됨</option>
                <option value="IN_PROGRESS">진행중</option>
                <option value="COMPLETED">완료</option>
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="progressNote" className="block text-sm font-medium text-gray-700 mb-1">
                진행 상황 노트
              </label>
              <textarea
                id="progressNote"
                value={formData.progressNote}
                onChange={(e) => setFormData({ ...formData, progressNote: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="현재 업무 진행 상황에 대한 설명을 입력하세요"
              />
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center">
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                  예상 완료 일정
                </label>
                {(() => {
                  const originalDate = task.dueDate ? new Date(task.dueDate).getTime() : 0;
                  const newDate = formData.dueDate ? new Date(formData.dueDate).getTime() : 0;
                  return originalDate !== newDate && (
                    <span className="text-xs text-orange-600 font-medium">일정이 변경되었습니다</span>
                  );
                })()}
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="datetime-local"
                  id="dueDate"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {task.dueDate && (
                  <button 
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, dueDate: formatDateToLocalISOString(task.dueDate) });
                    }}
                    className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    원래 일정으로 복원
                  </button>
                )}
              </div>
              {task.dueDate && (
                <p className="text-xs text-gray-500 mt-1">
                  원래 일정: {new Date(task.dueDate).toLocaleString('ko-KR')}
                </p>
              )}
            </div>

            {(() => {
              const originalDate = task.dueDate ? new Date(task.dueDate).getTime() : 0;
              const newDate = formData.dueDate ? new Date(formData.dueDate).getTime() : 0;
              const isDateChanged = originalDate !== newDate;
              
              return isDateChanged && (
                <div className="mb-4 bg-orange-50 p-3 rounded-md border border-orange-100">
                  <label htmlFor="delayReason" className="block text-sm font-medium text-gray-700 mb-1">
                    일정 변경 사유 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="delayReason"
                    value={formData.delayReason}
                    onChange={(e) => setFormData({ ...formData, delayReason: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="일정이 변경된 이유를 입력하세요 (원장님에게 알림이 전송됩니다)"
                    required={isDateChanged}
                  />
               </div>
              );
            })()}

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">이미지 첨부</h4>
              <div 
                className={`p-4 border-2 border-dashed rounded-md ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onPaste={handlePaste}
              >
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-2">이미지를 드래그하여 업로드하거나 붙여넣기 하세요</p>
                  <button
                    type="button"
                    className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    이미지 선택
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleAddImage(e.target.files)}
                  />
                </div>
              </div>
              
              {formData.images.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">첨부된 이미지</h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="relative h-16 w-16 overflow-hidden rounded-md border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity">
                          <img
                            src={image.url}
                            alt={`Uploaded image ${index + 1}`}
                            className="h-full w-full object-cover"
                            onClick={() => {
                              // 이미지 클릭 시 크게 보기 기능 추가 가능
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveImage(index)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}  
            </div>
            
            {/* 업무 상태 변경 이력 */}
            {task && <TaskStatusHistory taskId={task.id} />}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isLoading ? '처리중...' : '저장'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
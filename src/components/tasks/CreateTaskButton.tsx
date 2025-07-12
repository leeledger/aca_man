'use client'

import { useState } from 'react'
import CreateTaskModal from './CreateTaskModal'

export default function CreateTaskButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors shadow-sm hover:shadow flex items-center"
      >
        <span className="mr-2">+</span> 업무 등록
      </button>

      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
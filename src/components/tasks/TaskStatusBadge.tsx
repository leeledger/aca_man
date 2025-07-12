const statusConfig: Record<string, { label: string; className: string; icon: string }> = {
  REGISTERED: {
    label: '등록됨',
    className: 'bg-gray-100 text-gray-800 border border-gray-200',
    icon: '📝',
  },
  CONFIRMED: {
    label: '확인됨',
    className: 'bg-blue-100 text-blue-800 border border-blue-200',
    icon: '✓',
  },
  IN_PROGRESS: {
    label: '진행중',
    className: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    icon: '⚙️',
  },
  COMPLETED: {
    label: '완료',
    className: 'bg-green-100 text-green-800 border border-green-200',
    icon: '✅',
  },
}

export default function TaskStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800 border border-gray-200', icon: '❓' }

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center shadow-sm ${config.className}`}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </span>
  )
}
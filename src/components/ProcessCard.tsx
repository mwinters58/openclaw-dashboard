import { ProcessData } from '../lib/types'

interface ProcessCardProps {
  process: ProcessData
  columnColor: string
}

export default function ProcessCard({ process, columnColor }: ProcessCardProps) {
  const getTypeIcon = (type: string) => {
    const icons = {
      'session': '💬',
      'cron': '⏰', 
      'sub-agent': '🤖',
      'background': '🔄',
      'system': '⚙️'
    }
    return icons[type as keyof typeof icons] || '📋'
  }

  const getElapsedTime = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date()
    const diffMs = end.getTime() - startTime.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`
    if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`
    if (diffMins > 0) return `${diffMins}m`
    return `${Math.floor(diffMs / 1000)}s`
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow">
      {/* Card Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm">{getTypeIcon(process.type)}</span>
          <h3 className="font-semibold text-gray-900 truncate">
            {process.title}
          </h3>
        </div>
        <div className={`text-xs font-medium px-2 py-1 rounded-full ${columnColor} bg-current bg-opacity-10`}>
          {process.type}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {process.description}
      </p>

      {/* Progress Bar (for running processes) */}
      {process.status === 'running' && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{process.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-openclaw-primary to-openclaw-accent h-2 rounded-full transition-all duration-300"
              style={{ width: `${process.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            ⏱️ {getElapsedTime(process.startTime, process.endTime)}
          </span>
          {process.tokens > 0 && (
            <span className="flex items-center gap-1">
              🪙 {process.tokens.toLocaleString()}
            </span>
          )}
        </div>
        
        {process.tools.length > 0 && (
          <div className="flex gap-1">
            {process.tools.slice(0, 2).map((tool, index) => (
              <div 
                key={index}
                className="bg-gray-100 rounded px-1.5 py-0.5 text-xs"
                title={tool}
              >
                {tool.split('_')[0]}
              </div>
            ))}
            {process.tools.length > 2 && (
              <div className="bg-gray-100 rounded px-1.5 py-0.5 text-xs">
                +{process.tools.length - 2}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {process.error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          {process.error}
        </div>
      )}
    </div>
  )
}
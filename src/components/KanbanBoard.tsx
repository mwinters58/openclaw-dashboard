import { ProcessData, ColumnConfig } from '../lib/types'
import ProcessCard from './ProcessCard'

interface KanbanBoardProps {
  processes: ProcessData[]
}

const COLUMNS: ColumnConfig[] = [
  {
    status: 'idle',
    title: 'IDLE',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    icon: '😴'
  },
  {
    status: 'running',
    title: 'RUNNING',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    icon: '⚡'
  },
  {
    status: 'waiting',
    title: 'WAITING',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    icon: '⏳'
  },
  {
    status: 'completed',
    title: 'COMPLETED',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    icon: '✅'
  },
  {
    status: 'error',
    title: 'ERROR',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    icon: '❌'
  }
]

export default function KanbanBoard({ processes }: KanbanBoardProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {COLUMNS.map((column) => {
        const columnProcesses = processes.filter(p => p.status === column.status)
        
        return (
          <div 
            key={column.status}
            className="flex-shrink-0 w-72 sm:w-80 md:w-96"
          >
            <div className={`${column.bgColor} rounded-xl p-4 min-h-96`}>
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{column.icon}</span>
                  <h2 className={`font-bold text-lg ${column.color}`}>
                    {column.title}
                  </h2>
                </div>
                <div className={`${column.color} bg-white/50 rounded-full px-2 py-1 text-sm font-bold`}>
                  {columnProcesses.length}
                </div>
              </div>
              
              {/* Process Cards */}
              <div className="space-y-3">
                {columnProcesses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-3xl mb-2">🫧</div>
                    <p className="text-sm">No processes</p>
                  </div>
                ) : (
                  columnProcesses.map((process) => (
                    <ProcessCard 
                      key={process.id} 
                      process={process} 
                      columnColor={column.color}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
interface HeaderProps {
  lastUpdate: Date
  processCount: number
}

export default function Header({ lastUpdate, processCount }: HeaderProps) {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl mb-4 p-4 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-lg p-2">
            <span className="text-xl">🤖</span>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              OpenClaw Dashboard
            </h1>
            <p className="text-white/70 text-sm">
              {processCount} active processes
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="hidden sm:inline">Last update:</span>
            <span className="sm:hidden">Updated:</span>
            <time className="font-mono">
              {lastUpdate.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
              })}
            </time>
          </div>
          
          <button 
            onClick={() => window.location.reload()}
            className="bg-white/20 hover:bg-white/30 transition-colors rounded-lg p-2 text-white"
            title="Refresh dashboard"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
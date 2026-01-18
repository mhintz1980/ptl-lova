import { useApp } from '../../store'
import { AlertTriangle, Check, X } from 'lucide-react'

export function SandboxToolbar() {
  const { isSandbox, commitSandbox, exitSandbox } = useApp()

  if (!isSandbox) return null

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-yellow-400 flex flex-col items-center gap-3 p-4 shadow-lg border-4 border-black rounded-lg">
      <div className="flex flex-col items-center gap-1 font-bold text-black uppercase tracking-wider text-center">
        <AlertTriangle className="h-6 w-6" />
        <span className="text-sm">Sandbox Mode</span>
        <span className="text-xs bg-black text-yellow-400 px-2 py-0.5 rounded">
          SIMULATION
        </span>
      </div>

      <div className="flex flex-col gap-2 w-full">
        <button
          onClick={exitSandbox}
          className="flex items-center justify-center gap-1 px-3 py-1.5 bg-white border-2 border-black text-black font-bold hover:bg-red-100 text-xs rounded"
        >
          <X className="h-3 w-3" />
          Discard
        </button>
        <button
          onClick={commitSandbox}
          className="flex items-center justify-center gap-1 px-3 py-1.5 bg-black text-white font-bold hover:bg-gray-800 text-xs rounded"
        >
          <Check className="h-3 w-3" />
          Commit
        </button>
      </div>
    </div>
  )
}

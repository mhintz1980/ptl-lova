import { Pump } from '../../types'
import { Button } from '../ui/Button'

interface ActionCardProps {
  pump: Pump
  onActionClick: () => void
  compact?: boolean
}

export function ActionCard({
  pump,
  onActionClick,
  compact = false,
}: ActionCardProps) {
  // Determine the highest priority action based on pump state
  let actionLabel = 'MOVE TO NEXT STAGE'
  let actionColor =
    'bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)] border-yellow-500/50'
  let statusText = `${pump.stage} (Pending)`
  let statusColor = 'text-yellow-500'
  let neonColorClass = 'text-yellow-500 text-shadow-sm'

  if (pump.isPaused) {
    actionLabel = 'RESOLVE ISSUE'
    actionColor =
      'bg-red-600 text-white hover:bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)] border-red-500/50'
    statusText = `${pump.stage} (Stalled)`
    statusColor = 'text-red-500'
    neonColorClass = 'text-red-500'
  } else if (pump.serial === null && pump.stage !== 'QUEUE') {
    actionLabel = 'ASSIGN SERIAL'
    actionColor =
      'bg-red-600 text-white hover:bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)] border-red-500/50'
    statusText = `${pump.stage} (Blocked)`
    statusColor = 'text-red-500'
    neonColorClass = 'text-red-500'
  } else if (pump.stage === 'STAGED_FOR_POWDER') {
    actionLabel = 'START COATING'
    actionColor =
      'bg-green-500 text-black hover:bg-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)] border-green-500/50'
    statusText = 'COATING (Ready)'
    statusColor = 'text-green-500'
    neonColorClass = 'text-green-500'
  } else if (!pump.isPaused && pump.stage !== 'CLOSED') {
    // Default healthy active pump
    actionLabel = 'VIEW DETAILS'
    actionColor =
      'bg-primary/20 text-primary hover:bg-primary/30 border-primary/50'
    statusText = `${pump.stage} (Active)`
    statusColor = 'text-primary'
    neonColorClass = 'text-primary drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]'
  }

  if (compact) {
    return (
      <div
        className={`p-4 rounded-xl border bg-card/50 backdrop-blur-sm relative overflow-hidden layer-l1 h-full flex flex-col justify-between`}
      >
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-1">
            PO{' '}
            <span className={`font-bold ${neonColorClass}`}>
              {pump.po || 'N/A'}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mb-3">
            {pump.customer}
          </div>
          <div className={`text-xs font-bold ${statusColor}`}>{pump.stage}</div>
        </div>
        <Button
          onClick={onActionClick}
          className={`w-full h-8 mt-4 text-[10px] font-bold tracking-wider rounded-lg ${actionColor}`}
        >
          {actionLabel}
        </Button>
      </div>
    )
  }

  return (
    <div
      className={`p-5 rounded-2xl border bg-card/50 backdrop-blur-sm relative overflow-hidden layer-l1 isolation-auto`}
    >
      <div className="flex flex-col md:flex-row gap-4 justify-between w-full h-full relative z-10">
        {/* Left side: Order Info */}
        <div className="flex flex-col justify-between flex-1">
          <div>
            <div className="text-xl font-bold flex items-center gap-2">
              Order{' '}
              <span className={neonColorClass}>{pump.po || 'Unassigned'}</span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Pump Model: {pump.model} | Customer: {pump.customer}
            </div>
          </div>
          <div className="mt-4">
            <Button
              onClick={onActionClick}
              className={`w-full md:w-64 h-12 text-sm font-bold tracking-wider rounded-xl transition-all active:scale-95 border ${actionColor}`}
            >
              {actionLabel}
            </Button>
          </div>
        </div>

        {/* Right side: Status Info */}
        <div className="flex flex-col justify-between items-start md:items-end flex-shrink-0">
          <div className="flex flex-col items-start md:items-end">
            <div className="text-sm font-medium text-muted-foreground">
              Status:{' '}
              <span className={`font-bold ${statusColor}`}>{statusText}</span>
            </div>
            {pump.isPaused && (
              <div className="text-xs text-red-400 mt-1">
                Urgent Action Required
              </div>
            )}
          </div>

          <div className="text-xs text-muted-foreground mt-4 md:mt-0 flex gap-2 items-center opacity-80">
            <span>
              Stage:{' '}
              {new Date(pump.last_update).toLocaleDateString(undefined, {
                month: '2-digit',
                day: '2-digit',
              })}
            </span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span>Pri: {pump.priority}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

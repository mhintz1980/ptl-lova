// src/components/print/WeeklyScheduleView.tsx
import { useMemo } from 'react'
import { useApp } from '../../store'
import { format } from 'date-fns'

export function WeeklyScheduleView() {
  const { pumps } = useApp()
  const currentDate = format(new Date(), 'MMMM d, yyyy')

  // SECTION 1: Fabrication Targets (Active in FAB or QUEUE)
  const fabTargets = useMemo(() => {
    return pumps.filter((p) => p.stage === 'FABRICATION').slice(0, 10) // Limit to top 10
  }, [pumps])

  // SECTION 2: Powder Coat (Staged + Powder)
  const powderSchedule = useMemo(() => {
    return pumps.filter(
      (p) => p.stage === 'STAGED_FOR_POWDER' || p.stage === 'POWDER_COAT'
    )
  }, [pumps])

  // SECTION 3: Assembly Completions (Active in Assembly)
  const assemblyTargets = useMemo(() => {
    return pumps.filter((p) => p.stage === 'ASSEMBLY')
  }, [pumps])

  // SECTION 4: Shipping (Active in Ship)
  const shippingSchedule = useMemo(() => {
    return pumps.filter((p) => p.stage === 'SHIP')
  }, [pumps])

  return (
    <div className="h-screen flex flex-col page-break-after-always p-4">
      <header className="mb-6 border-b-2 border-black pb-2 text-center">
        <h1 className="text-3xl font-bold uppercase tracking-wider">
          Weekly Production Schedule
        </h1>
        <p className="text-sm font-medium text-gray-600">
          Week of {currentDate}
        </p>
      </header>

      {/* 4 Quadrants */}
      <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-0 border-2 border-black">
        {/* Q1: Fabrication */}
        <Quadrant
          title="Fabrication Targets"
          subtitle="Finish welding this week"
        >
          {fabTargets.map((p) => (
            <CheckItem
              key={p.id}
              label={`${p.model} (SN: ${p.serial || '-'})`}
            />
          ))}
          {fabTargets.length === 0 && <EmptyLines count={5} />}
          <EmptyLines count={3} />
        </Quadrant>

        {/* Q2: Powder Coat */}
        <Quadrant title="Powder Coat Schedule" subtitle="Drop-offs & Pick-ups">
          {powderSchedule.map((p) => (
            <div
              key={p.id}
              className="flex justify-between items-center text-xs mb-2 border-b border-gray-100 pb-1"
            >
              <span>
                {p.model} - {p.powder_color || 'Std Color'}
              </span>
              <div className="flex gap-2">
                <span className="border border-black px-1 rounded text-[9px]">
                  {p.stage === 'STAGED_FOR_POWDER' ? 'DROP' : 'PICK'}
                </span>
                <div className="w-4 h-4 border border-black"></div>
              </div>
            </div>
          ))}
          {powderSchedule.length === 0 && <EmptyLines count={5} />}
        </Quadrant>

        {/* Q3: Assembly */}
        <Quadrant
          title="Assembly Completions"
          subtitle="Pumps finishing assembly"
        >
          {assemblyTargets.map((p) => (
            <CheckItem
              key={p.id}
              label={`${p.model} - ${p.customer}`}
              rightLabel="Due: [  /  ]"
            />
          ))}
          {assemblyTargets.length === 0 && <EmptyLines count={5} />}
          <EmptyLines count={3} />
        </Quadrant>

        {/* Q4: Shipping */}
        <Quadrant title="Shipping Schedule" subtitle="Carrier pickups">
          {shippingSchedule.map((p) => (
            <div
              key={p.id}
              className="flex justify-between items-center text-xs mb-2"
            >
              <span className="font-bold">{p.customer}</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 italic">Carrier: _______</span>
                <div className="w-4 h-4 border border-black"></div>
              </div>
            </div>
          ))}
          {shippingSchedule.length === 0 && <EmptyLines count={5} />}
          <EmptyLines count={3} />
        </Quadrant>
      </div>
    </div>
  )
}

function Quadrant({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="border border-black p-4 flex flex-col">
      <div className="mb-4 text-center">
        <h2 className="font-bold uppercase text-lg">{title}</h2>
        <div className="text-xs text-gray-500 italic">({subtitle})</div>
      </div>
      <div className="flex-1 overflow-visible">{children}</div>
    </div>
  )
}

function CheckItem({
  label,
  rightLabel,
}: {
  label: string
  rightLabel?: string
}) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <div className="w-5 h-5 border-2 border-black rounded-sm flex-shrink-0"></div>
      <div className="flex-1 border-b border-gray-300 text-sm pb-1 flex justify-between">
        <span>{label}</span>
        {rightLabel && (
          <span className="text-gray-400 font-mono text-xs">{rightLabel}</span>
        )}
      </div>
    </div>
  )
}

function EmptyLines({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 mb-2 opacity-50">
          <div className="w-5 h-5 border border-gray-400 rounded-sm flex-shrink-0"></div>
          <div className="flex-1 border-b border-gray-200 h-6"></div>
        </div>
      ))}
    </>
  )
}

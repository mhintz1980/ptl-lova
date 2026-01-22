import { X, Settings, RotateCcw, Save } from 'lucide-react'
import { Button } from './Button'
import { useApp } from '../../store'
import { toast } from 'sonner'
import { MilestoneManager } from './MilestoneManager'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const {
    capacityConfig,
    updateDepartmentStaffing,
    updatePowderCoatVendor,
    updateStagedForPowderBufferDays,
    resetCapacityDefaults,
  } = useApp()

  if (!isOpen) return null

  const handleReset = () => {
    if (
      confirm(
        'Are you sure you want to reset all capacity settings to default?'
      )
    ) {
      resetCapacityDefaults()
      toast.success('Capacity settings reset to defaults')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
      <div
        className="relative w-full max-w-2xl flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl outline-none max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 border-b border-border bg-card px-6 py-[5px]">
          <div className="flex items-center justify-between min-h-[50px]">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Settings className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  System Settings
                </h2>
                <p className="text-xs text-muted-foreground">
                  Configure capacity and production parameters
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-muted/5 p-6 space-y-8">
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                Department Staffing
              </h3>
              <p className="text-[10px] text-muted-foreground hidden sm:block">
                Adjust Employees, Efficiency, or Man-Hours
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {(['fabrication', 'assembly', 'ship'] as const).map((stage) => {
                const config = capacityConfig[stage] ?? {
                  employeeCount: 1,
                  efficiency: 0.875,
                  dailyManHours: 8,
                  workDayHours: {
                    monday: 8,
                    tuesday: 8,
                    wednesday: 8,
                    thursday: 8,
                    friday: 4,
                    saturday: 0,
                    sunday: 0,
                  },
                }
                const colorMap = {
                  fabrication: 'blue',
                  assembly: 'purple',
                  ship: 'emerald',
                }
                const color = colorMap[stage]
                const label =
                  stage === 'ship'
                    ? 'Ship (Test+Ship)'
                    : stage.charAt(0).toUpperCase() + stage.slice(1)

                return (
                  <div
                    key={stage}
                    className="rounded-md border border-border/50 bg-muted/30 p-3 space-y-3 transition-colors hover:border-border/80"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">
                        {label}
                      </span>
                      <span
                        className={`rounded-full bg-${color}-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-${color}-500`}
                      >
                        {stage === 'fabrication'
                          ? '~4'
                          : stage === 'assembly'
                            ? '~2'
                            : '~1'}{' '}
                        days/pump
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-muted-foreground">
                        Employees
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        max="50"
                        step="0.1"
                        className="h-7 w-16 rounded border border-border/50 bg-background px-2 text-right text-xs font-mono"
                        value={config.employeeCount}
                        onChange={(e) =>
                          updateDepartmentStaffing(stage, {
                            ...config,
                            employeeCount: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-muted-foreground">
                        Efficiency
                      </label>
                      <div className="relative w-16">
                        <input
                          type="number"
                          min="1"
                          max="200"
                          step="0.1"
                          className="h-7 w-full rounded border border-border/50 bg-background px-2 text-right text-xs font-mono pr-5"
                          value={Math.round(config.efficiency * 1000) / 10}
                          onChange={(e) =>
                            updateDepartmentStaffing(stage, {
                              ...config,
                              efficiency:
                                (parseFloat(e.target.value) || 0) / 100,
                            })
                          }
                        />
                        <span className="absolute right-1.5 top-1.5 text-[10px] text-muted-foreground">
                          %
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/20">
                      <label className="text-xs font-bold text-foreground">
                        Daily Hours
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="h-7 w-16 rounded border border-border/50 bg-background px-2 text-right text-xs font-mono font-medium"
                        value={Math.round(config.dailyManHours * 10) / 10}
                        onChange={(e) =>
                          updateDepartmentStaffing(stage, {
                            ...config,
                            dailyManHours: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                Staged for Powder
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-md border border-pink-500/20 bg-pink-500/5 p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-pink-500/10 text-pink-500 font-bold text-xs">
                  SP
                </div>
                <div className="flex-1">
                  <label className="text-sm font-semibold text-foreground">
                    Buffer Time
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Days before powder pickup
                  </p>
                </div>
                <div className="w-24">
                  <label className="block text-[10px] font-medium text-muted-foreground mb-1">
                    Buffer Days
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    step="1"
                    className="block w-full h-7 rounded border border-border/50 bg-background px-2 text-right text-xs font-mono"
                    value={capacityConfig.stagedForPowderBufferDays}
                    onChange={(e) =>
                      updateStagedForPowderBufferDays(
                        Math.max(0, parseInt(e.target.value) || 0)
                      )
                    }
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                Powder Coat Vendors
              </h3>
            </div>
            <div className="space-y-2">
              {capacityConfig.powderCoat.vendors.map((vendor) => (
                <div
                  key={vendor.id}
                  className="flex items-center gap-3 rounded-md border border-border/50 bg-muted/30 p-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-zinc-500/10 text-zinc-500 font-bold text-xs">
                    {vendor.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Vendor Name
                    </label>
                    <input
                      type="text"
                      className="mt-0.5 block w-full h-7 rounded border border-border/50 bg-background px-2 text-xs"
                      value={vendor.name}
                      onChange={(e) =>
                        updatePowderCoatVendor(vendor.id, {
                          ...vendor,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="w-24">
                    <label className="text-xs font-medium text-muted-foreground">
                      Wk Capacity
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      className="mt-0.5 block w-full h-7 rounded border border-border/50 bg-background px-2 text-right text-xs font-mono"
                      value={vendor.maxPumpsPerWeek}
                      onChange={(e) =>
                        updatePowderCoatVendor(vendor.id, {
                          ...vendor,
                          maxPumpsPerWeek: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                Production Sandbox
              </h3>
            </div>
            <div className="rounded-md border border-yellow-500/50 bg-yellow-500/10 p-4 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-yellow-700 dark:text-yellow-400">
                  Enter Simulation Mode
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Test capacity changes safely.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  useApp.getState().enterSandbox()
                  onClose()
                  toast.success('Entered Sandbox Mode')
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold h-8 text-xs"
              >
                Start Simulation
              </Button>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                Milestone Management
              </h3>
            </div>
            <MilestoneManager />
          </section>
        </div>

        <div className="flex-shrink-0 border-t border-border bg-muted/40 px-6 py-[5px]">
          <div className="flex items-center justify-between min-h-[50px]">
            <Button
              variant="outline"
              onClick={handleReset}
              className="gap-2 rounded-full border-border/50 bg-white/5 hover:bg-white/10 text-xs h-8"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Defaults
            </Button>

            <Button onClick={onClose} className="min-w-[100px]">
              <Save className="mr-2 h-4 w-4" />
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

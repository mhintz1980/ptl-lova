import type { ReactNode } from 'react'
import { Header } from './Header'

interface AppShellProps {
  onOpenAddPo: () => void
  onOpenSettings: () => void
  children: ReactNode
}

export function AppShell({
  onOpenAddPo,
  onOpenSettings,
  children,
}: AppShellProps) {
  return (
    <div className="app-ambient text-foreground">
      <div className="relative z-10 flex min-h-screen flex-col">
        <Header onOpenAddPo={onOpenAddPo} onOpenSettings={onOpenSettings} />
        <main className="flex-1 overflow-auto content-stage">{children}</main>
      </div>
    </div>
  )
}

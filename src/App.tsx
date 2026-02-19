import { useEffect, useState, useMemo } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './store'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { AddPoModal } from './components/toolbar/AddPoModal'
import { PumpDetailModal } from './components/ui/PumpDetailModal'
import { SettingsModal } from './components/ui/SettingsModal'
import { ShortcutsHelpModal } from './components/ui/ShortcutsHelpModal'
import { KanbanBoard } from './components/kanban/KanbanBoard'
import { ChartsDrawer } from './components/drawers/ChartsDrawer'
import { ScheduleModal } from './components/modals/ScheduleModal'
import { Toaster } from 'sonner'
import { Pump } from './types'
import { AppShell } from './components/layout/AppShell'
import { applyFilters } from './lib/utils'
import { sortPumps } from './lib/sort'
import { PrintLayout } from './components/print/PrintLayout'
import { MondayBrief } from './components/print/MondayBrief'
import { CapacityForecast } from './components/print/CapacityForecast'
import { KanbanPrintView } from './components/print/KanbanPrintView'
import { ChatAssistant } from './components/chat/ChatAssistant'

// Initialize infrastructure (ledger subscriber, etc.)
import './init-infrastructure'

import { SandboxToolbar } from './components/sandbox/SandboxToolbar'

// Kiosk Views
import { KioskLayout } from './components/kiosk/KioskLayout'
import { ShopFloorHUD } from './components/kiosk/ShopFloorHUD'

import { AuthProvider } from './context/AuthContext'
import { LoginPage } from './pages/LoginPage'
import { UpdatePasswordPage } from './pages/UpdatePasswordPage'
import { useAuth } from './hooks/useAuth'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  // DEV BYPASS: Skip auth in development mode for faster local testing
  if (import.meta.env.DEV) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading auth...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function MainApp() {
  const { load, pumps, filters, sortField, sortDirection, loading } = useApp()
  const collapsedCards = useApp((state) => state.collapsedCards)
  const chartsDrawerOpen = useApp((state) => state.chartsDrawerOpen)
  const scheduleModalOpen = useApp((state) => state.scheduleModalOpen)
  const toggleChartsDrawer = useApp((state) => state.toggleChartsDrawer)
  const toggleScheduleModal = useApp((state) => state.toggleScheduleModal)
  const { register } = useKeyboardShortcuts()
  const [isAddPoModalOpen, setIsAddPoModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false)
  const [selectedPump, setSelectedPump] = useState<Pump | null>(null)

  useEffect(() => {
    load()
  }, [load])

  // Register keyboard shortcuts
  useEffect(() => {
    // Ctrl+N: Open Add PO modal
    register({
      key: 'n',
      ctrlKey: true,
      handler: () => setIsAddPoModalOpen(true),
      description: 'Open Add PO modal',
    })

    // Ctrl+F: Focus search input
    register({
      key: 'f',
      ctrlKey: true,
      handler: () => {
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[type="search"], input[placeholder*="search" i]'
        )
        if (searchInput) {
          searchInput.focus()
        }
      },
      description: 'Focus search',
    })

    // Ctrl+/: Open shortcuts help
    register({
      key: '/',
      ctrlKey: true,
      handler: () => setIsShortcutsHelpOpen(true),
      description: 'Show keyboard shortcuts',
    })

    // Escape: Close any open modal/drawer
    register({
      key: 'Escape',
      handler: () => {
        if (scheduleModalOpen) {
          toggleScheduleModal()
        } else if (chartsDrawerOpen) {
          toggleChartsDrawer()
        } else if (isAddPoModalOpen) {
          setIsAddPoModalOpen(false)
        } else if (isSettingsModalOpen) {
          setIsSettingsModalOpen(false)
        } else if (isShortcutsHelpOpen) {
          setIsShortcutsHelpOpen(false)
        } else if (selectedPump) {
          setSelectedPump(null)
        }
      },
      description: 'Close any modal',
    })
  }, [
    register,
    isAddPoModalOpen,
    isSettingsModalOpen,
    isShortcutsHelpOpen,
    selectedPump,
    chartsDrawerOpen,
    scheduleModalOpen,
    toggleChartsDrawer,
    toggleScheduleModal,
  ])

  const filteredPumps = useMemo(() => {
    const filtered = applyFilters(pumps, filters)
    return sortPumps(filtered, sortField, sortDirection)
  }, [pumps, filters, sortField, sortDirection])

  return (
    <ProtectedRoute>
      <SandboxToolbar />
      <Toaster position="top-right" richColors />
      <AppShell
        onOpenAddPo={() => setIsAddPoModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      >
        <div className="w-full px-[12px] pb-[12px] pt-0">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : (
            <div
              className="flex h-[calc(100vh-95px)] flex-col"
              data-testid="kanban-view"
            >
              <div className="flex-1">
                <KanbanBoard
                  pumps={filteredPumps}
                  collapsed={collapsedCards}
                  onCardClick={setSelectedPump}
                />
              </div>
            </div>
          )}
        </div>
      </AppShell>

      {/* Charts Drawer — slides from right */}
      <ChartsDrawer
        isOpen={chartsDrawerOpen}
        onClose={toggleChartsDrawer}
        onSelectPump={setSelectedPump}
      />

      {/* Schedule Modal — full-screen overlay */}
      <ScheduleModal
        isOpen={scheduleModalOpen}
        onClose={toggleScheduleModal}
        pumps={filteredPumps}
      />

      <AddPoModal
        isOpen={isAddPoModalOpen}
        onClose={() => setIsAddPoModalOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      <PumpDetailModal
        pump={selectedPump}
        onClose={() => setSelectedPump(null)}
      />

      <ShortcutsHelpModal
        isOpen={isShortcutsHelpOpen}
        onClose={() => setIsShortcutsHelpOpen(false)}
      />

      <ChatAssistant />
    </ProtectedRoute>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/update-password" element={<UpdatePasswordPage />} />

          {/* Main Application — Kanban Hub (single page) */}
          <Route path="/*" element={<MainApp />} />

          {/* Print Views */}
          <Route
            path="/print"
            element={
              <ProtectedRoute>
                <PrintLayout />
              </ProtectedRoute>
            }
          >
            <Route path="brief" element={<MondayBrief />} />
            <Route path="forecast" element={<CapacityForecast />} />
            <Route path="kanban" element={<KanbanPrintView />} />
          </Route>

          {/* Kiosk Views */}
          <Route
            path="/kiosk"
            element={
              <ProtectedRoute>
                <KioskLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ShopFloorHUD />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

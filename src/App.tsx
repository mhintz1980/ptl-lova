import { useEffect, useState, useMemo } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { useApp } from './store'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { AddPoModal } from './components/toolbar/AddPoModal'
import { PumpDetailModal } from './components/ui/PumpDetailModal'
import { SettingsModal } from './components/ui/SettingsModal'
import { ShortcutsHelpModal } from './components/ui/ShortcutsHelpModal'
import { Dashboard } from './pages/Dashboard'
import { Kanban } from './pages/Kanban'
import { OrdersPage } from './pages/OrdersPage'
import { SchedulingView } from './components/scheduling/SchedulingView'
import { Toaster } from 'sonner'
import { Pump } from './types'
import { AppShell } from './components/layout/AppShell'
import type { AppView } from './components/layout/navigation'
import { applyFilters } from './lib/utils'
import { sortPumps } from './lib/sort'
import { PrintLayout } from './components/print/PrintLayout'
import { MondayBrief } from './components/print/MondayBrief'
import { CapacityForecast } from './components/print/CapacityForecast'
import { KanbanPrintView } from './components/print/KanbanPrintView'
// Debug import for development
import './debug-seed'

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
  const { register } = useKeyboardShortcuts()
  // ... existing code ...
  const [isAddPoModalOpen, setIsAddPoModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false)
  const [selectedPump, setSelectedPump] = useState<Pump | null>(null)

  const location = useLocation()
  const navigate = useNavigate()

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

    // Escape: Close any open modal
    register({
      key: 'Escape',
      handler: () => {
        if (isAddPoModalOpen) {
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
  ])

  const filteredPumps = useMemo(() => {
    const filtered = applyFilters(pumps, filters)
    return sortPumps(filtered, sortField, sortDirection)
  }, [pumps, filters, sortField, sortDirection])

  const currentView = useMemo((): AppView => {
    if (location.pathname.includes('/kanban')) return 'kanban'
    if (location.pathname.includes('/scheduling')) return 'scheduling'
    if (location.pathname.includes('/orders')) return 'orders'
    return 'dashboard'
  }, [location.pathname])

  return (
    <ProtectedRoute>
      <SandboxToolbar />
      <Toaster position="top-right" richColors />
      <AppShell
        currentView={currentView}
        onChangeView={(view) =>
          navigate(view === 'dashboard' ? '/' : `/${view}`)
        }
        onOpenAddPo={() => setIsAddPoModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      >
        <div className="w-full px-[12px] pb-[12px] pt-0">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : (
            <Routes>
              <Route
                path="/"
                element={
                  <Dashboard
                    pumps={filteredPumps}
                    onSelectPump={setSelectedPump}
                  />
                }
              />
              <Route path="dashboard" element={<Navigate to="/" replace />} />
              <Route
                path="kanban"
                element={
                  <Kanban
                    pumps={filteredPumps}
                    onSelectPump={setSelectedPump}
                  />
                }
              />
              <Route
                path="scheduling"
                element={<SchedulingView pumps={filteredPumps} />}
              />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </div>
      </AppShell>

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

          {/* Main Application */}
          <Route path="/*" element={<MainApp />} />

          {/* Print Views - Protected? Ideally yes, but keeping open for simplicity if needed, or protect them too. Let's protect them. */}
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

          {/* Kiosk Views - Protected? Maybe not, kiosk might be shared. But for now let's protect everything to be safe. */}
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

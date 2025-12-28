import type { ReactNode } from "react";
import { Header } from "./Header";
import { type AppView } from "./navigation";

interface AppShellProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  onOpenAddPo: () => void;
  onOpenSettings: () => void;
  filteredPumpsCount?: number;
  children: ReactNode;
}

export function AppShell({
  currentView,
  onChangeView,
  onOpenAddPo,
  onOpenSettings,
  filteredPumpsCount,
  children,
}: AppShellProps) {
  return (
    <div className="app-ambient text-foreground">
      <div className="relative z-10 flex min-h-screen flex-col">
        <Header
          currentView={currentView}
          onChangeView={onChangeView}
          onOpenAddPo={onOpenAddPo}
          onOpenSettings={onOpenSettings}
          filteredPumpsCount={filteredPumpsCount}
        />
        <main className="flex-1 overflow-auto content-stage">{children}</main>
      </div>
    </div>
  );
}

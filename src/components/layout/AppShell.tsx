import { useEffect } from "react"
import { Outlet } from "react-router-dom"
import { TopBar } from "./TopBar"
import { Sidebar } from "./Sidebar"
import { TelemetryBlade } from "@/components/telemetry/TelemetryBlade"
import { ChatPanel } from "@/components/chat/ChatPanel"
import { ErrorBoundary } from "@/components/shared/ErrorBoundary"
import { KeyboardShortcutsDialog } from "@/components/shared/KeyboardShortcutsDialog"
import { useUIStore } from "@/stores/ui-store"
import { useResponsiveLayout } from "@/hooks/use-responsive-layout"
import { cn } from "@/lib/utils"

export function AppShell() {
  const telemetryBladeOpen = useUIStore((s) => s.telemetryBladeOpen)
  const chatPanelOpen = useUIStore((s) => s.chatPanelOpen)
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const toggleTelemetryBlade = useUIStore((s) => s.toggleTelemetryBlade)
  const toggleChatPanel = useUIStore((s) => s.toggleChatPanel)
  const { isMobile, isCompact } = useResponsiveLayout()

  // Auto-close sidebar on mobile breakpoint crossing
  useEffect(() => {
    if (isMobile && sidebarOpen) toggleSidebar()
  }, [isMobile])

  // Auto-close telemetry blade on compact breakpoint crossing
  useEffect(() => {
    if (isCompact && telemetryBladeOpen) toggleTelemetryBlade()
  }, [isCompact])

  // Auto-close chat panel on compact breakpoint crossing
  useEffect(() => {
    if (isCompact && chatPanelOpen) toggleChatPanel()
  }, [isCompact])

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar with width transition */}
        <div
          className={cn(
            "shrink-0 overflow-hidden transition-all duration-300 ease-in-out",
            sidebarOpen
              ? sidebarCollapsed
                ? "w-14"
                : "w-56"
              : "w-0"
          )}
        >
          <Sidebar />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-4 min-w-0">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>

        {/* Chat panel with width transition */}
        <div
          className={cn(
            "shrink-0 overflow-hidden transition-all duration-300 ease-in-out",
            chatPanelOpen ? "w-80" : "w-0"
          )}
        >
          <ChatPanel />
        </div>

        {/* Telemetry blade with width transition */}
        <div
          className={cn(
            "shrink-0 overflow-hidden transition-all duration-300 ease-in-out",
            telemetryBladeOpen ? "w-80" : "w-0"
          )}
        >
          <TelemetryBlade />
        </div>
      </div>
      <KeyboardShortcutsDialog />
    </div>
  )
}

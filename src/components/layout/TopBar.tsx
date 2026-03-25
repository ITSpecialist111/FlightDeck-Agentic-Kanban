import {
  PanelRightOpen,
  PanelRightClose,
  PanelLeft,
  MessageSquare,
  Gauge,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { useUIStore } from "@/stores/ui-store"

export function TopBar() {
  const { telemetryBladeOpen, toggleTelemetryBlade, toggleChatPanel, toggleSidebar } = useUIStore()

  return (
    <header className="h-12 border-b bg-card/80 backdrop-blur-sm flex items-center px-4 gap-3 shrink-0" role="banner">
      {/* Sidebar toggle */}
      <Button variant="ghost" size="icon-sm" onClick={toggleSidebar} aria-label="Toggle sidebar">
        <PanelLeft className="size-4" />
      </Button>

      {/* Logo / Brand */}
      <div className="flex items-center gap-2">
        <Gauge className="size-5 text-primary" aria-hidden="true" />
        <h1 className="text-sm font-bold tracking-tight">FlightDeck</h1>
      </div>

      <div className="flex-1" />

      {/* Actions */}
      <Button variant="ghost" size="icon-sm" aria-label="Toggle AI assistant" onClick={toggleChatPanel}>
        <MessageSquare className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={toggleTelemetryBlade}
        aria-label={telemetryBladeOpen ? "Hide telemetry panel" : "Show telemetry panel"}
      >
        {telemetryBladeOpen ? (
          <PanelRightClose className="size-4" />
        ) : (
          <PanelRightOpen className="size-4" />
        )}
      </Button>
      <ModeToggle />
    </header>
  )
}

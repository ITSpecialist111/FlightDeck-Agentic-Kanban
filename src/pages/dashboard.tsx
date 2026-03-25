import { useMemo } from "react"
import { KanbanBoard } from "@/components/kanban/KanbanBoard"
import { TaskDetailPanel } from "@/components/kanban/TaskDetailPanel"
import { NewTaskDialog } from "@/components/kanban/NewTaskDialog"
import { SearchDialog } from "@/components/kanban/SearchDialog"
import { ApprovalBanner } from "@/components/kanban/ApprovalBanner"
import { CommandBar } from "@/components/layout/CommandBar"
import { useKeyboardShortcuts, type ShortcutDef } from "@/hooks/use-keyboard-shortcuts"
import { useUIStore } from "@/stores/ui-store"

export default function DashboardPage() {
  const toggleSearch = useUIStore((s) => s.toggleSearch)
  const openNewTaskDialog = useUIStore((s) => s.openNewTaskDialog)
  const toggleTelemetryBlade = useUIStore((s) => s.toggleTelemetryBlade)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const toggleShortcutsDialog = useUIStore((s) => s.toggleShortcutsDialog)

  const shortcuts = useMemo<ShortcutDef[]>(
    () => [
      { key: "k", ctrl: true, description: "Search tasks", action: toggleSearch },
      { key: "n", description: "New task", action: openNewTaskDialog },
      { key: "t", description: "Toggle telemetry blade", action: toggleTelemetryBlade },
      { key: "[", description: "Toggle sidebar", action: toggleSidebar },
      { key: "?", description: "Keyboard shortcuts", action: toggleShortcutsDialog },
    ],
    [toggleSearch, openNewTaskDialog, toggleTelemetryBlade, toggleSidebar, toggleShortcutsDialog]
  )

  useKeyboardShortcuts(shortcuts)

  return (
    <div className="flex flex-col h-full">
      <ApprovalBanner />
      <CommandBar />
      <div className="flex-1 min-h-0">
        <KanbanBoard />
      </div>
      <TaskDetailPanel />
      <NewTaskDialog />
      <SearchDialog />
    </div>
  )
}

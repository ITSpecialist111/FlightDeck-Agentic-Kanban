import { Keyboard } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useUIStore } from "@/stores/ui-store"

const SHORTCUTS = [
  { keys: ["Ctrl", "K"], description: "Search tasks" },
  { keys: ["N"], description: "New task" },
  { keys: ["T"], description: "Toggle telemetry blade" },
  { keys: ["["], description: "Toggle sidebar" },
  { keys: ["?"], description: "Show keyboard shortcuts" },
]

export function KeyboardShortcutsDialog() {
  const { shortcutsDialogOpen, toggleShortcutsDialog } = useUIStore()

  return (
    <Dialog open={shortcutsDialogOpen} onOpenChange={toggleShortcutsDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="size-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>Quick actions available throughout the app.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {SHORTCUTS.map((shortcut) => (
            <div key={shortcut.description} className="flex items-center justify-between py-1.5">
              <span className="text-sm">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key) => (
                  <kbd
                    key={key}
                    className="inline-flex items-center justify-center rounded border bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground min-w-[24px]"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

import { ShieldQuestion, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { usePendingApprovals, useAgentActions } from "@/hooks/use-agent-actions"
import { useBoardStore } from "@/stores/board-store"
import { toast } from "sonner"

export function ApprovalBanner() {
  const boardId = useBoardStore((s) => s.currentBoardId)
  const pendingApprovals = usePendingApprovals(boardId)
  const { updateAction } = useAgentActions(boardId)

  if (pendingApprovals.length === 0) return null

  function handleApprove(id: string) {
    updateAction.mutate(
      { id, changes: { status: "succeeded" } },
      { onSuccess: () => toast.success("Action approved") }
    )
  }

  function handleReject(id: string) {
    updateAction.mutate(
      { id, changes: { status: "failed" } },
      { onSuccess: () => toast.info("Action rejected") }
    )
  }

  return (
    <div className="border-b bg-amber-500/10 px-4 py-2 space-y-2">
      {pendingApprovals.map((action) => (
        <div key={action.id} className="flex items-center gap-3 text-sm">
          <ShieldQuestion className="size-4 text-amber-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-medium">{action.agentName}</span>
            <span className="text-muted-foreground mx-1.5">wants to</span>
            <span>{action.actionType.replace(/_/g, " ")}</span>
            <Badge variant="outline" className="ml-2 text-xs">
              {Math.round(action.confidence * 100)}% confidence
            </Badge>
            {action.mcpSource && (
              <span className="ml-1.5 text-xs text-muted-foreground">
                via {action.mcpSource}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
              onClick={() => handleApprove(action.id)}
            >
              <Check className="size-3.5 mr-1" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-destructive hover:bg-destructive/10"
              onClick={() => handleReject(action.id)}
            >
              <X className="size-3.5 mr-1" />
              Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

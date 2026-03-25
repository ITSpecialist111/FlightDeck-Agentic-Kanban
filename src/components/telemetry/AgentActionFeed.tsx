import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ShieldQuestion,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/date-utils"
import { useAgentActions } from "@/hooks/use-agent-actions"
import { useBoardStore } from "@/stores/board-store"
import type { AgentActionStatus } from "@/lib/types"

const STATUS_CONFIG: Record<
  AgentActionStatus,
  { icon: typeof CheckCircle2; label: string; className: string }
> = {
  pending: {
    icon: Clock,
    label: "Pending",
    className: "text-muted-foreground",
  },
  running: {
    icon: Loader2,
    label: "Running",
    className: "text-blue-500 animate-spin",
  },
  succeeded: {
    icon: CheckCircle2,
    label: "Done",
    className: "text-emerald-500",
  },
  failed: {
    icon: XCircle,
    label: "Failed",
    className: "text-destructive",
  },
  requires_approval: {
    icon: ShieldQuestion,
    label: "Approval",
    className: "text-amber-500",
  },
}

export function AgentActionFeed() {
  const boardId = useBoardStore((s) => s.currentBoardId)
  const { actions, isLoading } = useAgentActions(boardId)

  if (isLoading) {
    return (
      <div className="px-4 py-3 space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">Agent Actions</span>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  // Show most recent 10
  const recentActions = actions.slice(0, 10)

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-medium">Agent Actions</span>
        {actions.some((a) => a.status === "running") && (
          <span className="ml-auto size-1.5 rounded-full bg-blue-500 animate-pulse" />
        )}
      </div>

      <div className="space-y-2">
        {recentActions.map((action) => {
          const config = STATUS_CONFIG[action.status]
          const Icon = config.icon
          return (
            <div key={action.id} className="flex items-start gap-2 text-xs">
              <Icon
                className={cn("size-3.5 mt-0.5 shrink-0", config.className)}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium truncate">
                    {action.agentName}
                  </span>
                  {action.confidence > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1 py-0 h-4"
                    >
                      {Math.round(action.confidence * 100)}%
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground truncate">
                  {action.actionType.replace(/_/g, " ")}
                </p>
                <div className="flex items-center gap-2 text-muted-foreground/60">
                  {action.mcpSource && (
                    <span className="text-[10px] text-primary/70">
                      {action.mcpSource}
                    </span>
                  )}
                  <span>{formatRelativeTime(action.createdOn)}</span>
                  {action.durationMs > 0 && (
                    <span>{(action.durationMs / 1000).toFixed(1)}s</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        {recentActions.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No recent agent actions
          </p>
        )}
      </div>
    </div>
  )
}

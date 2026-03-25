import { Separator } from "@/components/ui/separator"
import { ErrorBoundary } from "@/components/shared/ErrorBoundary"
import { useBoardStore } from "@/stores/board-store"
import { AgentStatusPanel } from "./AgentStatusPanel"
import { AgentActionFeed } from "./AgentActionFeed"
import { BoardMetrics } from "./BoardMetrics"
import { ActivityTimeline } from "./ActivityTimeline"

export function TelemetryBlade() {
  const boardId = useBoardStore((s) => s.currentBoardId)

  return (
    <aside className="w-80 border-l bg-card/50 flex flex-col shrink-0 overflow-hidden">
      <div className="px-4 py-3 border-b">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Telemetry
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <ErrorBoundary>
          <AgentStatusPanel boardId={boardId} />
        </ErrorBoundary>

        <Separator />

        <ErrorBoundary>
          <AgentActionFeed />
        </ErrorBoundary>

        <Separator />

        <ErrorBoundary>
          <BoardMetrics boardId={boardId} />
        </ErrorBoundary>

        <Separator />

        <ErrorBoundary>
          <ActivityTimeline boardId={boardId} />
        </ErrorBoundary>
      </div>
    </aside>
  )
}

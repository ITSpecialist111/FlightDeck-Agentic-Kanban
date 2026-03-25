import { useMemo } from "react"
import { BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTasks } from "@/hooks/use-tasks"
import { useColumns } from "@/hooks/use-columns"
import { Progress } from "@/components/ui/progress"

type Trend = "up" | "down" | "flat"

const TREND_ICONS: Record<Trend, typeof TrendingUp> = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
}

interface MetricCardProps {
  label: string
  value: number
  trend: Trend
  variant?: "default" | "warning"
}

function MetricCard({ label, value, trend, variant = "default" }: MetricCardProps) {
  const TrendIcon = TREND_ICONS[trend]

  return (
    <div className="rounded-md border bg-background p-2">
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "text-lg font-bold tabular-nums",
            variant === "warning" && value > 0 && "text-amber-500"
          )}
        >
          {value}
        </div>
        <TrendIcon className="size-3 text-muted-foreground" />
      </div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  )
}

export function BoardMetrics({ boardId }: { boardId: string }) {
  const { tasks } = useTasks(boardId)
  const { columns } = useColumns(boardId)

  const metrics = useMemo(() => {
    const columnTypeMap = new Map<string, string>()
    for (const col of columns) {
      columnTypeMap.set(col.id, col.columnType)
    }
    const total = tasks.length
    const inProgress = tasks.filter((t) => columnTypeMap.get(t.columnId) === "in_progress").length
    const completed = tasks.filter((t) => columnTypeMap.get(t.columnId) === "done").length
    const blocked = tasks.filter((t) => t.isBlocked).length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, inProgress, completed, blocked, completionRate }
  }, [tasks, columns])

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-medium">Board Metrics</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MetricCard label="Total Tasks" value={metrics.total} trend="flat" />
        <MetricCard label="In Progress" value={metrics.inProgress} trend="flat" />
        <MetricCard label="Completed" value={metrics.completed} trend="flat" />
        <MetricCard
          label="Blocked"
          value={metrics.blocked}
          trend="flat"
          variant="warning"
        />
      </div>

      <div className="mt-3 space-y-1">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Completion</span>
          <span className="tabular-nums">{metrics.completionRate}%</span>
        </div>
        <Progress value={metrics.completionRate} className="h-1.5" />
      </div>
    </div>
  )
}

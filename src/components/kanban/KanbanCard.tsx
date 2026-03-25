import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
import type { KanbanTask } from "@/lib/types"
import { PriorityIcon } from "@/components/shared/PriorityIcon"
import { SourceBadge } from "@/components/shared/SourceBadge"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { useUIStore } from "@/stores/ui-store"
import { formatUKDateCompact, isOverdue } from "@/lib/date-utils"
import { Calendar, AlertTriangle } from "lucide-react"

export function KanbanCard({
  task,
  isDragOverlay = false,
}: {
  task: KanbanTask
  isDragOverlay?: boolean
}) {
  const openTaskDetail = useUIStore((s) => s.openTaskDetail)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const overdue = isOverdue(task.dueDate) && !task.completedDate

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      role="button"
      aria-label={`${task.title}, ${task.priority} priority${task.assigneeName ? `, assigned to ${task.assigneeName}` : ""}${overdue ? ", overdue" : ""}${task.isBlocked ? ", blocked" : ""}`}
      onClick={() => !isDragOverlay && openTaskDetail(task.id)}
      onKeyDown={(e) => { if (e.key === "Enter" && !isDragOverlay) openTaskDetail(task.id) }}
      className={cn(
        "rounded-lg border bg-card p-3 shadow-sm cursor-grab active:cursor-grabbing",
        "hover:border-ring/50 hover:shadow-md transition-all duration-150",
        isDragging && "opacity-40",
        isDragOverlay && "shadow-xl ring-2 ring-primary/20 rotate-1",
        overdue && "border-destructive/50",
        task.isBlocked && "border-amber-500/50"
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium leading-tight line-clamp-2 flex-1">
          {task.title}
        </h4>
        <PriorityIcon priority={task.priority} />
      </div>

      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.labels.map((label) => (
            <span
              key={label}
              className="inline-block rounded bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Footer row */}
      <div className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground">
        {task.assigneeName && (
          <UserAvatar name={task.assigneeName} size="xs" />
        )}
        {task.dueDate && (
          <span className={cn("flex items-center gap-0.5", overdue && "text-destructive font-medium")}>
            <Calendar className="size-2.5" />
            {formatUKDateCompact(task.dueDate)}
          </span>
        )}
        <div className="flex-1" />
        <SourceBadge source={task.source} />
      </div>

      {/* Blocked indicator */}
      {task.isBlocked && (
        <div className="mt-2 flex items-center gap-1 rounded bg-amber-500/10 px-2 py-1 text-[10px] text-amber-600 dark:text-amber-400">
          <AlertTriangle className="size-3" />
          <span className="truncate">{task.blockedReason || "Blocked"}</span>
        </div>
      )}
    </div>
  )
}

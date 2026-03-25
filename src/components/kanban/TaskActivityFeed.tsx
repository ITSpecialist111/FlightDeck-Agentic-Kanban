import { formatDistanceToNow } from "date-fns"
import { useTaskActivityLog } from "@/hooks/use-activity-log"
import { cn } from "@/lib/utils"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Plus,
  ArrowRight,
  Pencil,
  MessageSquare,
  UserCheck,
  CheckCircle2,
  Archive,
  Trash2,
  Bot,
  Activity,
} from "lucide-react"

const ACTION_ICONS: Record<string, typeof Plus> = {
  created: Plus,
  moved: ArrowRight,
  updated: Pencil,
  commented: MessageSquare,
  assigned: UserCheck,
  completed: CheckCircle2,
  archived: Archive,
  deleted: Trash2,
  agent_action: Bot,
}

export function TaskActivityFeed({ taskId }: { taskId: string }) {
  const { data: activities, isLoading } = useTaskActivityLog(taskId)

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="size-8 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Activity className="size-8 mb-3 opacity-50" />
        <p className="text-sm">No activity yet</p>
        <p className="text-xs mt-1">
          Changes to this task will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {activities.map((entry, index) => {
        const Icon = ACTION_ICONS[entry.action] ?? Pencil
        const isLast = index === activities.length - 1

        return (
          <div key={entry.id} className="flex gap-3 relative">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-4 top-9 bottom-0 w-px bg-border" />
            )}

            {/* Avatar */}
            <div className="relative shrink-0 z-10">
              <UserAvatar name={entry.actorName} size="md" />
              <div
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 size-4 rounded-full flex items-center justify-center",
                  entry.isAgent
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground border"
                )}
              >
                <Icon className="size-2.5" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pb-6">
              <p className="text-sm">
                <span className="font-medium">{entry.actorName}</span>{" "}
                <span className="text-muted-foreground">{entry.description}</span>
              </p>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(entry.createdOn), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

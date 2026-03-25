import {
  Activity,
  Plus,
  ArrowRight,
  Pencil,
  MessageSquare,
  UserPlus,
  CheckCircle,
  Archive,
  Bot,
  Trash2,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/date-utils"
import { useActivityLog } from "@/hooks/use-activity-log"
import type { ActivityAction } from "@/lib/types"

const ACTION_ICONS: Record<ActivityAction, LucideIcon> = {
  created: Plus,
  moved: ArrowRight,
  updated: Pencil,
  commented: MessageSquare,
  assigned: UserPlus,
  completed: CheckCircle,
  archived: Archive,
  agent_action: Bot,
  deleted: Trash2,
}

export function ActivityTimeline({ boardId }: { boardId: string }) {
  const { activities } = useActivityLog(boardId)
  const recentActivities = activities.slice(0, 8)

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-medium">Recent Activity</span>
      </div>

      <div className="relative">
        {/* Vertical connecting line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

        <div className="space-y-3">
          {recentActivities.map((entry) => {
            const Icon = ACTION_ICONS[entry.action]

            return (
              <div key={entry.id} className="relative flex gap-3 text-xs">
                {/* Icon circle on the timeline */}
                <div
                  className={cn(
                    "relative z-10 flex size-[15px] shrink-0 items-center justify-center rounded-full border",
                    entry.isAgent
                      ? "bg-primary border-primary"
                      : "bg-background border-border"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-2.5",
                      entry.isAgent
                        ? "text-primary-foreground"
                        : "text-muted-foreground"
                    )}
                  />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 pb-0.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "font-medium truncate",
                        entry.isAgent ? "text-primary" : "text-foreground"
                      )}
                    >
                      {entry.actorName}
                    </span>
                    {entry.isAgent && <Bot className="size-2.5 shrink-0 text-primary" />}
                  </div>
                  <p className="text-muted-foreground mt-0.5 line-clamp-2">
                    {entry.description}
                  </p>
                  <span className="text-muted-foreground/50 mt-0.5 block">
                    {formatRelativeTime(entry.createdOn)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

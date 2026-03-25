import {
  AlertTriangle,
  ArrowRightLeft,
  Info,
  ZapOff,
  Link2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/date-utils"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"

type AlertSeverity = "info" | "warning" | "critical"

interface CrossBoardAlert {
  id: string
  severity: AlertSeverity
  sourceAgent: string
  description: string
  affectedTaskCount: number
  createdOn: string
}

const SEVERITY_CONFIG: Record<
  AlertSeverity,
  { icon: typeof Info; label: string; dotClass: string; textClass: string }
> = {
  info: {
    icon: Info,
    label: "Info",
    dotClass: "bg-blue-500",
    textClass: "text-blue-500",
  },
  warning: {
    icon: AlertTriangle,
    label: "Warning",
    dotClass: "bg-amber-500",
    textClass: "text-amber-500",
  },
  critical: {
    icon: ZapOff,
    label: "Critical",
    dotClass: "bg-red-500",
    textClass: "text-red-500",
  },
}

const MOCK_ALERTS: CrossBoardAlert[] = [
  {
    id: "cba-1",
    severity: "critical",
    sourceAgent: "Signal Monitor",
    description:
      "Velocity drop detected on Sprint Board — correlates with 5 blocked tasks on Ops Board",
    affectedTaskCount: 5,
    createdOn: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  },
  {
    id: "cba-2",
    severity: "warning",
    sourceAgent: "Board Manager",
    description:
      'Task "Integrate Calendar MCP" on Sprint Board may be blocked by "MCP Auth Setup" on Infra Board',
    affectedTaskCount: 2,
    createdOn: new Date(Date.now() - 47 * 60 * 1000).toISOString(),
  },
  {
    id: "cba-3",
    severity: "warning",
    sourceAgent: "Transcript Analyst",
    description:
      "3 tasks depending on Calendar MCP integration across 2 boards",
    affectedTaskCount: 3,
    createdOn: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "cba-4",
    severity: "info",
    sourceAgent: "Summary Agent",
    description:
      "Sprint Board and Design Board share 4 overlapping assignees — potential resource contention",
    affectedTaskCount: 4,
    createdOn: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "cba-5",
    severity: "info",
    sourceAgent: "Signal Monitor",
    description:
      "Completed deployment task on Infra Board may unblock 2 review items on Sprint Board",
    affectedTaskCount: 2,
    createdOn: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
]

export function CrossBoardAlerts() {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-2 mb-3">
        <ArrowRightLeft className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-medium">Cross-Board Intelligence</span>
      </div>

      <div className="space-y-2">
        {MOCK_ALERTS.map((alert) => (
          <AlertRow key={alert.id} alert={alert} />
        ))}
      </div>
    </div>
  )
}

function AlertRow({ alert }: { alert: CrossBoardAlert }) {
  const config = SEVERITY_CONFIG[alert.severity]
  const Icon = config.icon

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-start gap-2 text-xs cursor-default">
          <Icon
            className={cn("size-3.5 mt-0.5 shrink-0", config.textClass)}
          />
          <div className="flex-1 min-w-0">
            <p className="text-muted-foreground leading-snug line-clamp-2">
              {alert.description}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1 py-0 h-4",
                  config.textClass
                )}
              >
                {config.label}
              </Badge>
              <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5">
                <Link2 className="size-2.5" />
                {alert.affectedTaskCount} tasks
              </span>
              <span className="text-[10px] text-muted-foreground/60 ml-auto">
                {formatRelativeTime(alert.createdOn)}
              </span>
            </div>
            <span className="text-[10px] text-primary/70">
              {alert.sourceAgent}
            </span>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-64">
        <p>{alert.description}</p>
      </TooltipContent>
    </Tooltip>
  )
}

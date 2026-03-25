import { Bot } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/date-utils"
import { useLatestAgentStatuses } from "@/hooks/use-agent-actions"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"

const STATUS_DOT_STYLES = {
  idle: "bg-muted-foreground/30",
  running: "bg-emerald-500 animate-pulse",
  error: "bg-destructive",
} as const

interface AgentStatusPanelProps {
  boardId: string
}

export function AgentStatusPanel({ boardId }: AgentStatusPanelProps) {
  const agentStatuses = useLatestAgentStatuses(boardId)

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-2 mb-3">
        <Bot className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-medium">Agent Status</span>
      </div>
      <div className="space-y-2">
        {agentStatuses.map((agent) => (
          <AgentStatusRow key={agent.name} agent={agent} />
        ))}
      </div>
    </div>
  )
}

interface AgentStatusRowProps {
  agent: {
    name: string
    status: "idle" | "running" | "error"
    lastRunTime: string
    lastAction: string
  }
}

function AgentStatusRow({ agent }: AgentStatusRowProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2 text-xs cursor-default">
          <div
            className={cn(
              "size-1.5 rounded-full transition-colors duration-300",
              STATUS_DOT_STYLES[agent.status]
            )}
          />
          <span className="text-muted-foreground">{agent.name}</span>
          {agent.lastRunTime && (
            <span className="ml-auto text-muted-foreground/60">
              {formatRelativeTime(agent.lastRunTime)}
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="left">
        <p>{agent.lastAction}</p>
      </TooltipContent>
    </Tooltip>
  )
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { AgentActionsService } from "@/services/agent-actions-service"
import type { AgentAction } from "@/lib/types"

interface AgentStatus {
  name: string
  status: "idle" | "running" | "error"
  lastRunTime: string
  lastAction: string
}

export function useAgentActions(boardId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["agent-actions", boardId],
    queryFn: () => AgentActionsService.getAll({ boardId }),
    enabled: !!boardId,
    refetchInterval: 15000,
  })

  const updateAction = useMutation({
    mutationFn: async ({ id, changes }: { id: string; changes: Partial<AgentAction> }) => {
      return AgentActionsService.update(id, changes)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agent-actions", boardId] }),
  })

  return {
    actions: query.data ?? [],
    isLoading: query.isLoading,
    updateAction,
  }
}

export function useLatestAgentStatuses(boardId: string): AgentStatus[] {
  const { actions } = useAgentActions(boardId)

  const agentNames = ["Transcript Analyst", "Board Manager", "Signal Monitor", "Summary Agent"]

  return agentNames.map((name) => {
    const agentActions = actions.filter((a) => a.agentName === name)
    const latest = agentActions[0] // already sorted by createdOn desc

    let status: "idle" | "running" | "error" = "idle"
    if (latest?.status === "running") status = "running"
    else if (latest?.status === "failed") status = "error"

    return {
      name,
      status,
      lastRunTime: latest?.createdOn ?? "",
      lastAction: latest
        ? `${latest.actionType.replace(/_/g, " ")} (${Math.round(latest.confidence * 100)}% confidence)`
        : "No recent activity",
    }
  })
}

export function usePendingApprovals(boardId: string) {
  const { actions } = useAgentActions(boardId)
  return actions.filter((a) => a.status === "requires_approval")
}

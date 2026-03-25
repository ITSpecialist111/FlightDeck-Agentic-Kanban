import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { ActivityLogEntry } from "@/lib/types"
import { ActivityLogService } from "@/services/activity-log-service"

export function useActivityLog(boardId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["activity", boardId],
    queryFn: () => ActivityLogService.getAll({ boardId }),
    enabled: !!boardId,
    refetchInterval: 15000,
  })

  const logActivity = useMutation({
    mutationFn: async (entry: Omit<ActivityLogEntry, "id" | "createdOn">) => {
      return ActivityLogService.create(entry)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["activity", boardId] }),
  })

  return {
    activities: query.data ?? [],
    isLoading: query.isLoading,
    logActivity,
  }
}

export function useTaskActivityLog(taskId: string | null) {
  return useQuery({
    queryKey: ["activity", "task", taskId],
    queryFn: () => ActivityLogService.getAll({ taskId: taskId! }),
    enabled: !!taskId,
  })
}

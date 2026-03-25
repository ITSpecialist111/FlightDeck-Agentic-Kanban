import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { KanbanTask } from "@/lib/types"
import { SORT_ORDER_GAP } from "@/lib/constants"
import { TasksService } from "@/services/tasks-service"

export function useTasks(boardId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["tasks", boardId],
    queryFn: () => TasksService.getAll({ boardId }),
    enabled: !!boardId,
    refetchInterval: 15000,
  })

  const createTask = useMutation({
    mutationFn: async (newTask: Partial<KanbanTask>) => {
      return TasksService.create({
        ...newTask,
        boardId,
        sortOrder: newTask.sortOrder ?? SORT_ORDER_GAP,
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", boardId] }),
  })

  const updateTask = useMutation({
    mutationFn: async ({ id, changes }: { id: string; changes: Partial<KanbanTask> }) => {
      return TasksService.update(id, changes)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", boardId] }),
  })

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      return TasksService.delete(id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", boardId] }),
  })

  return {
    tasks: query.data ?? [],
    isLoading: query.isLoading,
    createTask,
    updateTask,
    deleteTask,
  }
}

export function useTask(taskId: string | null) {
  return useQuery({
    queryKey: ["task", taskId],
    queryFn: () => TasksService.get(taskId!),
    enabled: !!taskId,
  })
}

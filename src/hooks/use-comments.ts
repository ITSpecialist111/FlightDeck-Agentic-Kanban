import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { CommentsService } from "@/services/comments-service"

export function useComments(taskId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["comments", taskId],
    queryFn: () => CommentsService.getAll({ taskId }),
    enabled: !!taskId,
  })

  const addComment = useMutation({
    mutationFn: async ({ taskId, content }: { taskId: string; content: string }) => {
      return CommentsService.create({ taskId, content })
    },
    onSuccess: () => {
      toast.success("Comment added")
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] })
    },
  })

  return {
    comments: query.data ?? [],
    isLoading: query.isLoading,
    addComment,
  }
}

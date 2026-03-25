import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { BoardMember, BoardMemberRole } from "@/lib/types"
import { BoardMembersService } from "@/services/board-members-service"

export function useBoardMembers(boardId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["board-members", boardId],
    queryFn: () => BoardMembersService.getAll({ boardId }),
    enabled: !!boardId,
  })

  const addMember = useMutation({
    mutationFn: async (member: Omit<BoardMember, "id">) => {
      return BoardMembersService.create(member)
    },
    onSuccess: () => {
      toast.success("Member added")
      queryClient.invalidateQueries({ queryKey: ["board-members", boardId] })
    },
  })

  const updateRole = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: BoardMemberRole }) => {
      return BoardMembersService.update(memberId, { role })
    },
    onSuccess: () => {
      toast.success("Role updated")
      queryClient.invalidateQueries({ queryKey: ["board-members", boardId] })
    },
  })

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      return BoardMembersService.delete(memberId)
    },
    onSuccess: () => {
      toast.success("Member removed")
      queryClient.invalidateQueries({ queryKey: ["board-members", boardId] })
    },
  })

  return {
    members: query.data ?? [],
    isLoading: query.isLoading,
    addMember,
    updateRole,
    removeMember,
  }
}

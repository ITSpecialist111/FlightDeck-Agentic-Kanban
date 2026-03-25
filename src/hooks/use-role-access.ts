import { useMemo } from "react"
import { useBoardMembers } from "./use-board-members"
import { useBoardStore } from "@/stores/board-store"
import type { BoardMemberRole } from "@/lib/types"

/** Permission levels for role-based access control */
const ROLE_LEVEL: Record<BoardMemberRole, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
}

/**
 * Returns current user's role and permission checks for the active board.
 *
 * In Power Apps, the logged-in user email comes from the host context.
 * For now, falls back to the first owner/admin in the board members list.
 */
export function useRoleAccess() {
  const boardId = useBoardStore((s) => s.currentBoardId)
  const { members, isLoading } = useBoardMembers(boardId)

  // TODO: Replace with actual Power Apps user context when deployed
  // const currentUserEmail = useHostContext().userEmail
  const currentMember = members[0] ?? null
  const role: BoardMemberRole = currentMember?.role ?? "viewer"

  const permissions = useMemo(() => {
    const level = ROLE_LEVEL[role]
    return {
      /** Can view board content */
      canView: level >= ROLE_LEVEL.viewer,
      /** Can create/edit/move tasks and add comments */
      canEdit: level >= ROLE_LEVEL.member,
      /** Can manage board members */
      canManageMembers: level >= ROLE_LEVEL.admin,
      /** Can change board/project settings and delete */
      canAdmin: level >= ROLE_LEVEL.owner,
    }
  }, [role])

  return {
    role,
    currentMember,
    isLoading,
    ...permissions,
  }
}

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { useBoardStore } from "@/stores/board-store"
import { BoardsService } from "@/services/boards-service"
import { ColumnsService } from "@/services/columns-service"
import { useBoardMembers } from "@/hooks/use-board-members"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  GripVertical,
  Settings,
  Users,
  Bot,
  AlertTriangle,
  Columns3,
} from "lucide-react"
import { UserAvatar } from "@/components/shared/UserAvatar"
import type { KanbanColumn, BoardMemberRole } from "@/lib/types"

// ---------------------------------------------------------------------------
// Columns Management Section
// ---------------------------------------------------------------------------

function ColumnsSection({ boardId }: { boardId: string }) {
  const queryClient = useQueryClient()
  const [newColumnName, setNewColumnName] = useState("")
  const [newColumnColour, setNewColumnColour] = useState("#6366f1")
  const [deleteTarget, setDeleteTarget] = useState<KanbanColumn | null>(null)

  const { data: columns = [], isLoading } = useQuery({
    queryKey: ["columns", boardId],
    queryFn: () => ColumnsService.getAll({ boardId }),
  })

  const sorted = [...columns].sort((a, b) => a.sortOrder - b.sortOrder)

  const updateColumn = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<KanbanColumn> }) =>
      ColumnsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["columns", boardId] })
      toast.success("Column updated")
    },
    onError: () => toast.error("Failed to update column"),
  })

  const addColumn = useMutation({
    mutationFn: (data: Partial<KanbanColumn>) => ColumnsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["columns", boardId] })
      setNewColumnName("")
      setNewColumnColour("#6366f1")
      toast.success("Column added")
    },
    onError: () => toast.error("Failed to add column"),
  })

  const deleteColumn = useMutation({
    mutationFn: (id: string) => ColumnsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["columns", boardId] })
      setDeleteTarget(null)
      toast.success("Column deleted")
    },
    onError: () => toast.error("Failed to delete column"),
  })

  function handleReorder(index: number, direction: "up" | "down") {
    const swapIndex = direction === "up" ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= sorted.length) return

    const current = sorted[index]
    const adjacent = sorted[swapIndex]

    updateColumn.mutate({
      id: current.id,
      data: { sortOrder: adjacent.sortOrder },
    })
    updateColumn.mutate({
      id: adjacent.id,
      data: { sortOrder: current.sortOrder },
    })
  }

  function handleAddColumn() {
    if (!newColumnName.trim()) return
    const maxSort = sorted.length > 0 ? sorted[sorted.length - 1].sortOrder : 0
    addColumn.mutate({
      boardId,
      name: newColumnName.trim(),
      color: newColumnColour,
      sortOrder: maxSort + 65536,
      columnType: "in_progress",
      wipLimit: 0,
    } as Partial<KanbanColumn>)
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading columns...</p>
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Columns3 className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Columns</h2>
      </div>

      <Card className="divide-y">
        {/* Header row */}
        <div className="grid grid-cols-[40px_1fr_80px_90px_110px_80px_40px] items-center gap-2 px-4 py-2 text-xs font-medium text-muted-foreground">
          <span />
          <span>Name</span>
          <span>Colour</span>
          <span>WIP Limit</span>
          <span>Type</span>
          <span>Reorder</span>
          <span />
        </div>

        {sorted.map((col, idx) => (
          <div
            key={col.id}
            className="grid grid-cols-[40px_1fr_80px_90px_110px_80px_40px] items-center gap-2 px-4 py-2"
          >
            {/* Drag handle (visual only) */}
            <GripVertical className="h-4 w-4 text-muted-foreground" />

            {/* Name */}
            <Input
              defaultValue={col.name}
              className="h-8"
              onBlur={(e) => {
                const val = e.target.value.trim()
                if (val && val !== col.name) {
                  updateColumn.mutate({ id: col.id, data: { name: val } })
                }
              }}
            />

            {/* Colour */}
            <input
              type="color"
              defaultValue={col.color ?? "#6366f1"}
              className="h-8 w-12 cursor-pointer rounded border border-border bg-transparent"
              onBlur={(e) => {
                if (e.target.value !== col.color) {
                  updateColumn.mutate({
                    id: col.id,
                    data: { color: e.target.value },
                  })
                }
              }}
            />

            {/* WIP limit */}
            <Input
              type="number"
              min={0}
              defaultValue={col.wipLimit ?? 0}
              className="h-8"
              onBlur={(e) => {
                const val = parseInt(e.target.value, 10)
                if (!isNaN(val) && val !== col.wipLimit) {
                  updateColumn.mutate({
                    id: col.id,
                    data: { wipLimit: val },
                  })
                }
              }}
            />

            {/* Column type badge */}
            <Badge variant="outline" className="justify-center text-xs">
              {col.columnType ?? "in_progress"}
            </Badge>

            {/* Reorder buttons */}
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={idx === 0}
                onClick={() => handleReorder(idx, "up")}
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={idx === sorted.length - 1}
                onClick={() => handleReorder(idx, "down")}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Delete */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => setDeleteTarget(col)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </Card>

      {/* Add column row */}
      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-1">
          <Label htmlFor="new-col-name">New column name</Label>
          <Input
            id="new-col-name"
            placeholder="e.g. Awaiting Review"
            value={newColumnName}
            onChange={(e) => setNewColumnName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddColumn()}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="new-col-colour">Colour</Label>
          <input
            id="new-col-colour"
            type="color"
            value={newColumnColour}
            onChange={(e) => setNewColumnColour(e.target.value)}
            className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent"
          />
        </div>
        <Button onClick={handleAddColumn} disabled={!newColumnName.trim()}>
          <Plus className="mr-1 h-4 w-4" />
          Add Column
        </Button>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete column?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <strong>{deleteTarget?.name}</strong>? Any tasks in this column will
            need to be moved first. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteColumn.mutate(deleteTarget.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Agent Configuration Section
// ---------------------------------------------------------------------------

function AgentConfigSection({
  boardId,
  agentsEnabled,
  pollInterval,
}: {
  boardId: string
  agentsEnabled: boolean
  pollInterval: number
}) {
  const queryClient = useQueryClient()
  const [enabled, setEnabled] = useState(agentsEnabled)
  const [interval, setInterval] = useState(pollInterval)

  const updateBoard = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      BoardsService.update(boardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", boardId] })
      toast.success("Agent configuration saved")
    },
    onError: () => toast.error("Failed to save agent configuration"),
  })

  function handleSave() {
    updateBoard.mutate({ agentsEnabled: enabled, pollInterval: interval })
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Bot className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Agent Configuration</h2>
      </div>

      <Card className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Agents Enabled</Label>
            <p className="text-xs text-muted-foreground">
              Allow AI agents to process tasks on this board
            </p>
          </div>
          <Button
            variant={enabled ? "default" : "outline"}
            size="sm"
            onClick={() => setEnabled(!enabled)}
          >
            {enabled ? "Enabled" : "Disabled"}
          </Button>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="poll-interval" className="text-sm font-medium">
              Poll Interval (seconds)
            </Label>
            <p className="text-xs text-muted-foreground">
              How often the board checks for agent updates
            </p>
          </div>
          <Input
            id="poll-interval"
            type="number"
            min={5}
            max={300}
            value={interval}
            onChange={(e) => setInterval(parseInt(e.target.value, 10) || 15)}
            className="h-8 w-24"
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={updateBoard.isPending}>
            Save Agent Settings
          </Button>
        </div>
      </Card>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Board Members Section
// ---------------------------------------------------------------------------

function MembersSection({ boardId }: { boardId: string }) {
  const { members, isLoading, addMember, updateRole, removeMember } =
    useBoardMembers(boardId)

  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newRole, setNewRole] = useState<BoardMemberRole>("member")
  const [removeTarget, setRemoveTarget] = useState<string | null>(null)

  function handleAdd() {
    if (!newName.trim() || !newEmail.trim()) return
    addMember.mutate(
      { name: newName.trim(), email: newEmail.trim(), role: newRole, boardId, avatarUrl: "" },
      {
        onSuccess: () => {
          setNewName("")
          setNewEmail("")
          setNewRole("member")
          toast.success("Member added")
        },
        onError: () => toast.error("Failed to add member"),
      }
    )
  }

  function handleRemove(id: string) {
    removeMember.mutate(id, {
      onSuccess: () => {
        setRemoveTarget(null)
        toast.success("Member removed")
      },
      onError: () => toast.error("Failed to remove member"),
    })
  }

  function handleRoleChange(id: string, role: BoardMemberRole) {
    updateRole.mutate(
      { memberId: id, role },
      {
        onSuccess: () => toast.success("Role updated"),
        onError: () => toast.error("Failed to update role"),
      }
    )
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading members...</p>
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Board Members</h2>
      </div>

      <Card className="divide-y">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-3 px-4 py-3"
          >
            <UserAvatar name={member.name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{member.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {member.email}
              </p>
            </div>

            <Select
              value={member.role}
              onValueChange={(val) =>
                handleRoleChange(member.id, val as BoardMemberRole)
              }
            >
              <SelectTrigger className="h-8 w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => setRemoveTarget(member.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {members.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            No members added yet
          </p>
        )}
      </Card>

      {/* Add member form */}
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-medium">Add Member</h3>
        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-1">
            <Label htmlFor="member-name">Name</Label>
            <Input
              id="member-name"
              placeholder="Full name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label htmlFor="member-email">Email</Label>
            <Input
              id="member-email"
              type="email"
              placeholder="name@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>
          <div className="w-28 space-y-1">
            <Label>Role</Label>
            <Select
              value={newRole}
              onValueChange={(val) => setNewRole(val as BoardMemberRole)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleAdd}
            disabled={!newName.trim() || !newEmail.trim()}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>
      </Card>

      {/* Remove confirmation dialog */}
      <Dialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove member?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove this member from the board? They
            will lose access immediately.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => removeTarget && handleRemove(removeTarget)}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Danger Zone Section
// ---------------------------------------------------------------------------

function DangerZone({ boardId }: { boardId: string }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const deleteBoard = useMutation({
    mutationFn: () => BoardsService.delete(boardId),
    onSuccess: () => {
      toast.success("Board deleted")
      navigate("/")
    },
    onError: () => toast.error("Failed to delete board"),
  })

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 text-destructive">
        <AlertTriangle className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Danger Zone</h2>
      </div>

      <Card className="border-destructive/30 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Delete this board</p>
            <p className="text-xs text-muted-foreground">
              Permanently delete this board, all its columns, tasks, and
              activity history. This cannot be undone.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">Delete Board</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete board permanently?</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                This will permanently delete the board and all associated data
                including columns, tasks, comments, and activity history. This
                action <strong>cannot be undone</strong>.
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteBoard.mutate()}
                  disabled={deleteBoard.isPending}
                >
                  {deleteBoard.isPending ? "Deleting..." : "Yes, delete board"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Card>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Board Settings Page
// ---------------------------------------------------------------------------

export default function BoardSettingsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { currentBoardId } = useBoardStore()

  const boardId = currentBoardId ?? ""

  const {
    data: board,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["board", boardId],
    queryFn: () => BoardsService.get(boardId),
    enabled: !!boardId,
  })

  const updateBoard = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      BoardsService.update(boardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", boardId] })
      toast.success("Board updated")
    },
    onError: () => toast.error("Failed to update board"),
  })

  if (!boardId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No board selected</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading board settings...</p>
      </div>
    )
  }

  if (isError || !board) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-destructive">Failed to load board</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      {/* Header */}
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to board
        </Button>

        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">
            {board.name ?? "Board Settings"}
          </h1>
        </div>

        <div className="space-y-1">
          <Label htmlFor="board-description">Description</Label>
          <Textarea
            id="board-description"
            defaultValue={board.description ?? ""}
            placeholder="Add a board description..."
            rows={3}
            onBlur={(e) => {
              const val = e.target.value.trim()
              if (val !== (board.description ?? "")) {
                updateBoard.mutate({ description: val })
              }
            }}
          />
        </div>
      </div>

      <Separator />

      {/* Columns Management */}
      <ColumnsSection boardId={boardId} />

      <Separator />

      {/* Agent Configuration */}
      <AgentConfigSection
        boardId={boardId}
        agentsEnabled={board.agentsEnabled ?? false}
        pollInterval={board.pollInterval ?? 15}
      />

      <Separator />

      {/* Board Members */}
      <MembersSection boardId={boardId} />

      <Separator />

      {/* Danger Zone */}
      <DangerZone boardId={boardId} />
    </div>
  )
}

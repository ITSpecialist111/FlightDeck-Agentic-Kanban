import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useBoardStore } from "@/stores/board-store"
import { ProjectsService } from "@/services/projects-service"
import { BoardsService } from "@/services/boards-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { ArrowLeft, Plus, Trash2, Settings, LayoutDashboard } from "lucide-react"

const PROJECT_COLOURS = [
  "#2563eb", // blue
  "#7c3aed", // violet
  "#db2777", // pink
  "#dc2626", // red
  "#ea580c", // orange
  "#d97706", // amber
  "#16a34a", // green
  "#0d9488", // teal
  "#0891b2", // cyan
  "#6366f1", // indigo
]

export default function ProjectSettingsPage() {
  const { projectId: paramProjectId } = useParams()
  const { currentProjectId } = useBoardStore()
  const projectId = paramProjectId ?? currentProjectId
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // --- Local state ---
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState("")
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [editDescription, setEditDescription] = useState("")

  const [showNewBoardForm, setShowNewBoardForm] = useState(false)
  const [newBoardName, setNewBoardName] = useState("")
  const [newBoardDescription, setNewBoardDescription] = useState("")

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteBoardDialogOpen, setDeleteBoardDialogOpen] = useState(false)
  const [boardToDelete, setBoardToDelete] = useState<string | null>(null)

  // --- Queries ---
  const {
    data: project,
    isLoading: projectLoading,
    error: projectError,
  } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => ProjectsService.get(projectId!),
    enabled: !!projectId,
  })

  const { data: boards = [], isLoading: boardsLoading } = useQuery({
    queryKey: ["boards", projectId],
    queryFn: () => BoardsService.getAll({ projectId: projectId! }),
    enabled: !!projectId,
  })

  // --- Mutations ---
  const updateProjectMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      ProjectsService.update(projectId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] })
      toast.success("Project updated successfully.")
    },
    onError: () => {
      toast.error("Failed to update project.")
    },
  })

  const deleteProjectMutation = useMutation({
    mutationFn: () => ProjectsService.delete(projectId!),
    onSuccess: () => {
      toast.success("Project deleted.")
      navigate("/")
    },
    onError: () => {
      toast.error("Failed to delete project.")
    },
  })

  const createBoardMutation = useMutation({
    mutationFn: (data: { name: string; description: string; projectId: string }) =>
      BoardsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards", projectId] })
      setShowNewBoardForm(false)
      setNewBoardName("")
      setNewBoardDescription("")
      toast.success("Board created successfully.")
    },
    onError: () => {
      toast.error("Failed to create board.")
    },
  })

  const deleteBoardMutation = useMutation({
    mutationFn: (boardId: string) => BoardsService.delete(boardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards", projectId] })
      setDeleteBoardDialogOpen(false)
      setBoardToDelete(null)
      toast.success("Board deleted.")
    },
    onError: () => {
      toast.error("Failed to delete board.")
    },
  })

  // --- Handlers ---
  function handleSaveName() {
    if (!editName.trim()) return
    updateProjectMutation.mutate({ name: editName.trim() })
    setIsEditingName(false)
  }

  function handleSaveDescription() {
    updateProjectMutation.mutate({ description: editDescription.trim() })
    setIsEditingDescription(false)
  }

  function handleColourSelect(colour: string) {
    updateProjectMutation.mutate({ color: colour })
  }

  function handleCreateBoard() {
    if (!newBoardName.trim()) {
      toast.error("Board name is required.")
      return
    }
    createBoardMutation.mutate({
      name: newBoardName.trim(),
      description: newBoardDescription.trim(),
      projectId: projectId!,
    })
  }

  function handleDeleteBoard(boardId: string) {
    const board = boards.find((b: { id: string }) => b.id === boardId)
    if (board?.isDefault) {
      toast.error("Cannot delete the default board.")
      return
    }
    setBoardToDelete(boardId)
    setDeleteBoardDialogOpen(true)
  }

  function confirmDeleteBoard() {
    if (boardToDelete) {
      deleteBoardMutation.mutate(boardToDelete)
    }
  }

  function handleDeleteProject() {
    setDeleteDialogOpen(true)
  }

  function confirmDeleteProject() {
    deleteProjectMutation.mutate()
    setDeleteDialogOpen(false)
  }

  // --- Render ---
  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-muted-foreground">No project selected.</p>
      </div>
    )
  }

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-muted-foreground">Loading project settings...</p>
      </div>
    )
  }

  if (projectError || !project) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-destructive">Failed to load project.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-8">
      {/* ---- Header ---- */}
      <div className="space-y-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <div className="flex items-start gap-3">
          <Settings className="h-6 w-6 mt-1 text-muted-foreground" />
          <div className="flex-1 space-y-1">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName()
                    if (e.key === "Escape") setIsEditingName(false)
                  }}
                  autoFocus
                  className="text-xl font-semibold h-auto py-1"
                />
                <Button size="sm" onClick={handleSaveName}>
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingName(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <h1
                className="text-2xl font-semibold tracking-tight cursor-pointer hover:text-muted-foreground transition-colors"
                onClick={() => {
                  setEditName(project.name ?? "")
                  setIsEditingName(true)
                }}
                title="Click to edit project name"
              >
                {project.name ?? "Untitled Project"}
              </h1>
            )}

            {isEditingDescription ? (
              <div className="space-y-2">
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveDescription}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingDescription(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p
                className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => {
                  setEditDescription(project.description ?? "")
                  setIsEditingDescription(true)
                }}
                title="Click to edit description"
              >
                {project.description || "No description. Click to add one."}
              </p>
            )}
          </div>
        </div>

        {/* Colour picker */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Project colour</Label>
          <div className="flex gap-2 flex-wrap">
            {PROJECT_COLOURS.map((colour) => (
              <button
                key={colour}
                type="button"
                className="h-8 w-8 rounded-full border-2 transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{
                  backgroundColor: colour,
                  borderColor:
                    project.color === colour
                      ? "var(--foreground)"
                      : "transparent",
                }}
                onClick={() => handleColourSelect(colour)}
                aria-label={`Select colour ${colour}`}
              />
            ))}
          </div>
        </div>
      </div>

      <Separator />

      {/* ---- Boards section ---- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Boards</h2>
            <p className="text-sm text-muted-foreground">
              Manage boards within this project.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowNewBoardForm(true)}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            New board
          </Button>
        </div>

        {/* New board inline form */}
        {showNewBoardForm && (
          <Card className="p-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-board-name">Board name</Label>
              <Input
                id="new-board-name"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="e.g. Sprint Board"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateBoard()
                  if (e.key === "Escape") {
                    setShowNewBoardForm(false)
                    setNewBoardName("")
                    setNewBoardDescription("")
                  }
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-board-desc">Description (optional)</Label>
              <Textarea
                id="new-board-desc"
                value={newBoardDescription}
                onChange={(e) => setNewBoardDescription(e.target.value)}
                placeholder="Brief description of this board"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleCreateBoard}
                disabled={createBoardMutation.isPending}
              >
                {createBoardMutation.isPending ? "Creating..." : "Create board"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowNewBoardForm(false)
                  setNewBoardName("")
                  setNewBoardDescription("")
                }}
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Board list */}
        {boardsLoading ? (
          <p className="text-sm text-muted-foreground">Loading boards...</p>
        ) : boards.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No boards yet. Create one to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {boards.map(
              (board: {
                id: string
                name: string
                description?: string
                isDefault?: boolean
                agentsEnabled?: boolean
              }) => (
                <Card
                  key={board.id}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <LayoutDashboard className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/settings/board/${board.id}`}
                          className="font-medium hover:underline truncate"
                        >
                          {board.name}
                        </Link>
                        {board.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            Default
                          </Badge>
                        )}
                        {board.agentsEnabled && (
                          <Badge variant="outline" className="text-xs">
                            Agents enabled
                          </Badge>
                        )}
                      </div>
                      {board.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {board.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteBoard(board.id)}
                    disabled={board.isDefault}
                    title={
                      board.isDefault
                        ? "Cannot delete the default board"
                        : "Delete board"
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </Card>
              )
            )}
          </div>
        )}
      </div>

      <Separator />

      {/* ---- Danger Zone ---- */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-destructive">
            Danger Zone
          </h2>
          <p className="text-sm text-muted-foreground">
            Irreversible actions. Proceed with caution.
          </p>
        </div>
        <Card className="border-destructive/50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">Delete this project</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete this project, all its boards, columns, and
                tasks. This action cannot be undone.
              </p>
            </div>
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm" onClick={handleDeleteProject}>
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Delete project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete project</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to permanently delete{" "}
                  <span className="font-semibold text-foreground">
                    {project.name}
                  </span>
                  ? This will remove all boards, columns, and tasks within it.
                  This action cannot be undone.
                </p>
                <DialogFooter>
                  <Button
                    variant="ghost"
                    onClick={() => setDeleteDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={confirmDeleteProject}
                    disabled={deleteProjectMutation.isPending}
                  >
                    {deleteProjectMutation.isPending
                      ? "Deleting..."
                      : "Yes, delete project"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </Card>
      </div>

      {/* ---- Delete board confirmation dialog ---- */}
      <Dialog
        open={deleteBoardDialogOpen}
        onOpenChange={setDeleteBoardDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete board</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this board? All columns and tasks
            within it will be permanently removed. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setDeleteBoardDialogOpen(false)
                setBoardToDelete(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteBoard}
              disabled={deleteBoardMutation.isPending}
            >
              {deleteBoardMutation.isPending
                ? "Deleting..."
                : "Yes, delete board"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

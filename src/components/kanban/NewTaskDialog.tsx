import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useUIStore } from "@/stores/ui-store"
import { useBoardStore } from "@/stores/board-store"
import { useTasks } from "@/hooks/use-tasks"
import { useBoardMembers } from "@/hooks/use-board-members"
import { PRIORITY_CONFIG, COLUMN_CONFIG } from "@/lib/constants"
import type { Priority, ColumnType } from "@/lib/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function NewTaskDialog() {
  const open = useUIStore((s) => s.newTaskDialogOpen)
  const closeNewTaskDialog = useUIStore((s) => s.closeNewTaskDialog)
  const boardId = useBoardStore((s) => s.currentBoardId)
  const { createTask } = useTasks(boardId)
  const { members } = useBoardMembers(boardId)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<Priority>("medium")
  const [columnType, setColumnType] = useState<ColumnType>("backlog")
  const [assigneeId, setAssigneeId] = useState("")
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [labelsInput, setLabelsInput] = useState("")

  function resetForm() {
    setTitle("")
    setDescription("")
    setPriority("medium")
    setColumnType("backlog")
    setAssigneeId("")
    setDueDate(undefined)
    setLabelsInput("")
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    const labels = labelsInput
      .split(",")
      .map((l) => l.trim())
      .filter(Boolean)

    const assignee = members.find((m) => m.id === assigneeId)

    createTask.mutate({
      title: title.trim(),
      description: description.trim(),
      priority,
      columnId: `col-${columnType}`,
      assigneeId: assigneeId || "",
      assigneeName: assignee?.name ?? "",
      dueDate: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
      labels,
      source: "manual",
    })

    toast.success("Task created")
    resetForm()
    closeNewTaskDialog()
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetForm()
      closeNewTaskDialog()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task to the board. Fill in the details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              placeholder="Task title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              placeholder="Describe the task..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-20"
            />
          </div>

          {/* Priority + Column row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(PRIORITY_CONFIG) as [Priority, (typeof PRIORITY_CONFIG)[Priority]][]).map(
                    ([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <span
                          className="inline-block size-2 rounded-full mr-1.5"
                          style={{ backgroundColor: config.color }}
                        />
                        {config.label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Column</Label>
              <Select value={columnType} onValueChange={(v) => setColumnType(v as ColumnType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(COLUMN_CONFIG) as [ColumnType, (typeof COLUMN_CONFIG)[ColumnType]][])
                    .filter(([key]) => key !== "archived")
                    .map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignee + Due Date row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-9",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 size-3.5" />
                    {dueDate ? format(dueDate, "dd/MM/yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Labels */}
          <div className="space-y-2">
            <Label htmlFor="task-labels">Labels</Label>
            <Input
              id="task-labels"
              placeholder="Enter labels, comma-separated..."
              value={labelsInput}
              onChange={(e) => setLabelsInput(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

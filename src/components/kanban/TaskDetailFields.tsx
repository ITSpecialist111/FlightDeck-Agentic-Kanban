import { useState, useRef, useMemo, type KeyboardEvent } from "react"
import type { KanbanTask, Priority, ColumnType } from "@/lib/types"
import { useTasks } from "@/hooks/use-tasks"
import { useColumns } from "@/hooks/use-columns"
import { useBoardMembers } from "@/hooks/use-board-members"
import { COLUMN_CONFIG, PRIORITY_CONFIG } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { formatUKDate, formatUKDateTime } from "@/lib/date-utils"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { PriorityIcon } from "@/components/shared/PriorityIcon"
import { SourceBadge } from "@/components/shared/SourceBadge"
import { CalendarDays, X, BrainCircuit, UserCheck, Sparkles } from "lucide-react"

export function TaskDetailFields({ task }: { task: KanbanTask }) {
  const { updateTask } = useTasks(task.boardId)
  const { columns } = useColumns(task.boardId)
  const { members } = useBoardMembers(task.boardId)

  // Build column ID ↔ type lookups from loaded columns
  const { columnTypeMap, typeToIdMap } = useMemo(() => {
    const ctm = new Map<string, ColumnType>()
    const ttm = new Map<ColumnType, string>()
    for (const col of columns) {
      ctm.set(col.id, col.columnType)
      ttm.set(col.columnType, col.id)
    }
    return { columnTypeMap: ctm, typeToIdMap: ttm }
  }, [columns])

  // Inline editing state
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(task.title)
  const [editingDesc, setEditingDesc] = useState(false)
  const [descValue, setDescValue] = useState(task.description)
  const [newLabel, setNewLabel] = useState("")
  const [blockedReason, setBlockedReason] = useState(task.blockedReason)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const titleRef = useRef<HTMLInputElement>(null)
  const descRef = useRef<HTMLTextAreaElement>(null)

  function saveField(field: string, value: unknown) {
    updateTask.mutate({ id: task.id, changes: { [field]: value } })
  }

  function handleTitleSave() {
    setEditingTitle(false)
    if (titleValue.trim() && titleValue !== task.title) {
      saveField("title", titleValue.trim())
    } else {
      setTitleValue(task.title)
    }
  }

  function handleTitleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleTitleSave()
    } else if (e.key === "Escape") {
      setTitleValue(task.title)
      setEditingTitle(false)
    }
  }

  function handleDescSave() {
    setEditingDesc(false)
    if (descValue !== task.description) {
      saveField("description", descValue)
    }
  }

  function handleAddLabel(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && newLabel.trim()) {
      const label = newLabel.trim().toLowerCase()
      if (!task.labels.includes(label)) {
        saveField("labels", [...task.labels, label])
      }
      setNewLabel("")
    }
  }

  function handleRemoveLabel(label: string) {
    saveField(
      "labels",
      task.labels.filter((l) => l !== label)
    )
  }

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Title</Label>
        {editingTitle ? (
          <Input
            ref={titleRef}
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={handleTitleKeyDown}
            autoFocus
            className="text-sm"
          />
        ) : (
          <p
            className="text-sm cursor-pointer rounded px-2 py-1.5 -mx-2 hover:bg-accent transition-colors"
            onClick={() => {
              setTitleValue(task.title)
              setEditingTitle(true)
            }}
          >
            {task.title}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Description</Label>
        {editingDesc ? (
          <Textarea
            ref={descRef}
            value={descValue}
            onChange={(e) => setDescValue(e.target.value)}
            onBlur={handleDescSave}
            autoFocus
            className="text-sm min-h-20"
          />
        ) : (
          <p
            className={cn(
              "text-sm cursor-pointer rounded px-2 py-1.5 -mx-2 hover:bg-accent transition-colors whitespace-pre-wrap",
              !task.description && "text-muted-foreground italic"
            )}
            onClick={() => {
              setDescValue(task.description)
              setEditingDesc(true)
            }}
          >
            {task.description || "Add a description..."}
          </p>
        )}
      </div>

      {/* Status / Column */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Status</Label>
        <Select
          value={columnTypeMap.get(task.columnId) ?? "backlog"}
          onValueChange={(value) => {
            const newColumnId = typeToIdMap.get(value as ColumnType)
            if (newColumnId) saveField("columnId", newColumnId)
          }}
        >
          <SelectTrigger className="w-full text-sm h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(COLUMN_CONFIG) as [ColumnType, { label: string; color: string }][]).map(
              ([type, config]) => (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center gap-2">
                    <div
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: config.color }}
                    />
                    {config.label}
                  </div>
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Priority */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Priority</Label>
        <Select
          value={task.priority}
          onValueChange={(value) => saveField("priority", value)}
        >
          <SelectTrigger className="w-full text-sm h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(PRIORITY_CONFIG) as [Priority, { label: string }][]).map(
              ([priority, config]) => (
                <SelectItem key={priority} value={priority}>
                  <div className="flex items-center gap-2">
                    <PriorityIcon priority={priority} />
                    {config.label}
                  </div>
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Assignee */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Assignee</Label>
        <Select
          value={task.assigneeId || "unassigned"}
          onValueChange={(value) => {
            if (value === "unassigned") {
              saveField("assigneeId", "")
              saveField("assigneeName", "")
            } else {
              const member = members.find((m) => m.id === value)
              if (member) {
                updateTask.mutate({
                  id: task.id,
                  changes: { assigneeId: member.id, assigneeName: member.name },
                })
              }
            }
          }}
        >
          <SelectTrigger className="w-full text-sm h-9">
            <SelectValue placeholder="Unassigned" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {members.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Due Date */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Due Date</Label>
        <div className="flex items-center gap-2">
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left text-sm font-normal h-9",
                  !task.dueDate && "text-muted-foreground"
                )}
              >
                <CalendarDays className="size-4 mr-2" />
                {task.dueDate ? formatUKDate(task.dueDate) : "Set due date..."}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={task.dueDate ? new Date(task.dueDate) : undefined}
                onSelect={(date) => {
                  saveField("dueDate", date ? date.toISOString().split("T")[0] : null)
                  setCalendarOpen(false)
                }}
              />
            </PopoverContent>
          </Popover>
          {task.dueDate && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => saveField("dueDate", null)}
              title="Clear due date"
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Labels */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Labels</Label>
        <div className="flex flex-wrap gap-1.5">
          {task.labels.map((label) => (
            <Badge key={label} variant="secondary" className="gap-1 text-xs">
              {label}
              <button
                onClick={() => handleRemoveLabel(label)}
                className="ml-0.5 hover:text-destructive transition-colors"
                aria-label={`Remove ${label} label`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
        <Input
          placeholder="Add label and press Enter..."
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={handleAddLabel}
          className="text-sm h-8 mt-1"
        />
      </div>

      {/* Source */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Source</Label>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <SourceBadge source={task.source} />
          {task.sourceReference && (
            <span className="text-xs text-muted-foreground truncate">
              {task.sourceReference}
            </span>
          )}
        </div>
      </div>

      {/* Blocked */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Checkbox
            id="blocked-checkbox"
            checked={task.isBlocked}
            onCheckedChange={(checked) => {
              saveField("isBlocked", !!checked)
              if (!checked) {
                saveField("blockedReason", "")
                setBlockedReason("")
              }
            }}
          />
          <Label htmlFor="blocked-checkbox" className="text-sm font-normal cursor-pointer">
            Blocked
          </Label>
        </div>
        {task.isBlocked && (
          <Textarea
            placeholder="Reason for being blocked..."
            value={blockedReason}
            onChange={(e) => setBlockedReason(e.target.value)}
            onBlur={() => {
              if (blockedReason !== task.blockedReason) {
                saveField("blockedReason", blockedReason)
              }
            }}
            className="text-sm min-h-16 mt-1"
          />
        )}
      </div>

      {/* Timestamps */}
      <div className="space-y-2 pt-2 border-t">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Created</span>
          <span>{formatUKDateTime(task.createdOn)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Modified</span>
          <span>{formatUKDateTime(task.modifiedOn)}</span>
        </div>
        {task.completedDate && (
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Completed</span>
            <span>{formatUKDateTime(task.completedDate)}</span>
          </div>
        )}
      </div>

      {/* AI Insights */}
      {(task.predictedCompletionDate || task.suggestedAssignee) && (
        <div className="space-y-3 pt-3 border-t">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-indigo-500" />
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              AI Insights
            </span>
          </div>

          <div className="rounded-lg border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/20 p-3 space-y-3">
            {/* Predicted Completion */}
            {task.predictedCompletionDate && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="size-3.5 text-indigo-500" />
                  <span className="text-xs font-medium text-foreground">Predicted Completion</span>
                </div>
                <p className="text-sm pl-5.5">
                  {formatUKDate(task.predictedCompletionDate)}
                </p>
                {task.predictionConfidence != null && (
                  <div className="flex items-center gap-2 pl-5.5">
                    <Progress
                      value={task.predictionConfidence}
                      className="h-1.5 flex-1 bg-indigo-200/50 dark:bg-indigo-800/40 [&>[data-slot=progress-indicator]]:bg-indigo-500"
                    />
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {task.predictionConfidence}%
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Suggested Assignee */}
            {task.suggestedAssignee && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <UserCheck className="size-3.5 text-indigo-500" />
                  <span className="text-xs font-medium text-foreground">Suggested Assignee</span>
                </div>
                <div className="flex items-center justify-between pl-5.5 gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{task.suggestedAssignee}</p>
                    {task.suggestedAssigneeReason && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {task.suggestedAssigneeReason}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 text-xs h-7 border-indigo-300 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
                    onClick={() => {
                      const member = members.find(
                        (m) => m.name === task.suggestedAssignee
                      )
                      if (member) {
                        updateTask.mutate({
                          id: task.id,
                          changes: {
                            assigneeId: member.id,
                            assigneeName: member.name,
                          },
                        })
                      }
                    }}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

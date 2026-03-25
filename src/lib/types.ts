export type ColumnType = "backlog" | "todo" | "in_progress" | "review" | "done" | "archived"

export type Priority = "critical" | "high" | "medium" | "low"

export type TaskSource = "manual" | "meeting_transcript" | "email" | "agent" | "import"

export type AgentActionStatus = "pending" | "running" | "succeeded" | "failed" | "requires_approval"

export type BoardMemberRole = "owner" | "admin" | "member" | "viewer"

export type ActivityAction =
  | "created"
  | "moved"
  | "updated"
  | "commented"
  | "assigned"
  | "completed"
  | "archived"
  | "deleted"
  | "agent_action"

export interface KanbanColumn {
  id: string
  name: string
  boardId: string
  sortOrder: number
  color: string
  wipLimit: number
  columnType: ColumnType
}

export interface KanbanTask {
  id: string
  title: string
  description: string
  columnId: string
  boardId: string
  assigneeId: string
  assigneeName: string
  priority: Priority
  sortOrder: number
  dueDate: string | null
  source: TaskSource
  sourceReference: string
  labels: string[]
  meetingDate: string | null
  completedDate: string | null
  archivedDate: string | null
  isBlocked: boolean
  blockedReason: string
  createdOn: string
  modifiedOn: string
  predictedCompletionDate?: string
  predictionConfidence?: number
  suggestedAssignee?: string
  suggestedAssigneeReason?: string
}

export interface KanbanBoard {
  id: string
  name: string
  description: string
  projectId: string
  isDefault: boolean
  agentsEnabled: boolean
  pollInterval: number
}

export interface ActivityLogEntry {
  id: string
  boardId: string
  taskId: string | null
  action: ActivityAction
  description: string
  actorId: string
  actorName: string
  isAgent: boolean
  previousValue: string
  newValue: string
  createdOn: string
}

export interface AgentAction {
  id: string
  agentName: string
  actionType: string
  boardId: string
  taskId: string | null
  status: AgentActionStatus
  confidence: number
  durationMs: number
  mcpSource: string
  createdOn: string
}

export interface Organization {
  id: string
  name: string
  logoUrl: string
}

export interface Project {
  id: string
  organizationId: string
  name: string
  description: string
  color: string
}

export interface BoardMember {
  id: string
  boardId: string
  name: string
  email: string
  role: BoardMemberRole
  avatarUrl: string
}

export interface Comment {
  id: string
  taskId: string
  authorId: string
  authorName: string
  isAgent: boolean
  content: string
  createdOn: string
  modifiedOn: string
}

export interface FilterState {
  search: string
  assigneeIds: string[]
  priorities: Priority[]
  sources: TaskSource[]
}

export type ChatMessageRole = "user" | "assistant"

export interface ChatMessage {
  id: string
  role: ChatMessageRole
  content: string
  agentName: string | null
  createdOn: string
}

export interface ChatConversation {
  id: string
  messages: ChatMessage[]
  createdOn: string
}

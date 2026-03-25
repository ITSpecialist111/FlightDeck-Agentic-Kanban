/**
 * Dataverse choice column value mappings.
 * Maps between TypeScript string unions and Dataverse integer values (100000000+).
 */
import type {
  ColumnType,
  Priority,
  TaskSource,
  AgentActionStatus,
  BoardMemberRole,
  ActivityAction,
} from "@/lib/types"

// --- Column Type ---
const COLUMN_TYPE_TO_DV: Record<ColumnType, number> = {
  backlog: 100000000,
  todo: 100000001,
  in_progress: 100000002,
  review: 100000003,
  done: 100000004,
  archived: 100000005,
}
const COLUMN_TYPE_FROM_DV: Record<number, ColumnType> = Object.fromEntries(
  Object.entries(COLUMN_TYPE_TO_DV).map(([k, v]) => [v, k as ColumnType]),
) as Record<number, ColumnType>

// --- Priority ---
const PRIORITY_TO_DV: Record<Priority, number> = {
  critical: 100000000,
  high: 100000001,
  medium: 100000002,
  low: 100000003,
}
const PRIORITY_FROM_DV: Record<number, Priority> = Object.fromEntries(
  Object.entries(PRIORITY_TO_DV).map(([k, v]) => [v, k as Priority]),
) as Record<number, Priority>

// --- Task Source ---
const SOURCE_TO_DV: Record<TaskSource, number> = {
  manual: 100000000,
  meeting_transcript: 100000001,
  email: 100000002,
  agent: 100000003,
  import: 100000004,
}
const SOURCE_FROM_DV: Record<number, TaskSource> = Object.fromEntries(
  Object.entries(SOURCE_TO_DV).map(([k, v]) => [v, k as TaskSource]),
) as Record<number, TaskSource>

// --- Agent Action Status ---
const AGENT_STATUS_TO_DV: Record<AgentActionStatus, number> = {
  pending: 100000000,
  running: 100000001,
  succeeded: 100000002,
  failed: 100000003,
  requires_approval: 100000004,
}
const AGENT_STATUS_FROM_DV: Record<number, AgentActionStatus> = Object.fromEntries(
  Object.entries(AGENT_STATUS_TO_DV).map(([k, v]) => [v, k as AgentActionStatus]),
) as Record<number, AgentActionStatus>

// --- Board Member Role ---
const ROLE_TO_DV: Record<BoardMemberRole, number> = {
  owner: 100000000,
  admin: 100000001,
  member: 100000002,
  viewer: 100000003,
}
const ROLE_FROM_DV: Record<number, BoardMemberRole> = Object.fromEntries(
  Object.entries(ROLE_TO_DV).map(([k, v]) => [v, k as BoardMemberRole]),
) as Record<number, BoardMemberRole>

// --- Activity Action ---
const ACTION_TO_DV: Record<ActivityAction, number> = {
  created: 100000000,
  moved: 100000001,
  updated: 100000002,
  commented: 100000003,
  assigned: 100000004,
  completed: 100000005,
  archived: 100000006,
  deleted: 100000007,
  agent_action: 100000008,
}
const ACTION_FROM_DV: Record<number, ActivityAction> = Object.fromEntries(
  Object.entries(ACTION_TO_DV).map(([k, v]) => [v, k as ActivityAction]),
) as Record<number, ActivityAction>

// --- Public API ---
export const choiceMap = {
  columnType: { toDv: COLUMN_TYPE_TO_DV, fromDv: COLUMN_TYPE_FROM_DV },
  priority: { toDv: PRIORITY_TO_DV, fromDv: PRIORITY_FROM_DV },
  source: { toDv: SOURCE_TO_DV, fromDv: SOURCE_FROM_DV },
  agentStatus: { toDv: AGENT_STATUS_TO_DV, fromDv: AGENT_STATUS_FROM_DV },
  role: { toDv: ROLE_TO_DV, fromDv: ROLE_FROM_DV },
  action: { toDv: ACTION_TO_DV, fromDv: ACTION_FROM_DV },
} as const

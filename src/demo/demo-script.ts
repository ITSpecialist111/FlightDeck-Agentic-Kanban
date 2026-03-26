/**
 * Demo script — defines the 5-act auto-animation sequence.
 * Each act is a series of DemoAction steps executed in order by the orchestrator.
 */
import {
  COL, BOARD_ID, TASK,
  PRI, SRC, AGENT_STATUS, ACTION,
} from "./demo-seed-data"

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------

export type DemoAction =
  | { type: "wait"; ms: number }
  | { type: "create_task"; id: string; data: Record<string, unknown> }
  | { type: "move_task"; taskId: string; toColumn: string }
  | { type: "update_task"; taskId: string; changes: Record<string, unknown> }
  | { type: "create_agent_action"; id: string; data: Record<string, unknown> }
  | { type: "update_agent_action"; id: string; changes: Record<string, unknown> }
  | { type: "create_activity"; id: string; data: Record<string, unknown> }
  | { type: "inject_chat"; role: "user" | "assistant"; content: string; agentName?: string }
  | { type: "open_chat" }
  | { type: "close_chat" }
  | { type: "open_task_detail"; taskId: string }
  | { type: "close_task_detail" }

// ---------------------------------------------------------------------------
// Helper: ISO timestamp for "now"
// ---------------------------------------------------------------------------
function now(): string {
  return new Date().toISOString()
}

// New task IDs created during the script
const NEW_TASK = {
  oauthCalendar: "d2000001-demo-0000-0000-000000000001",
  mcpErrorHandling: "d2000002-demo-0000-0000-000000000002",
  loadTesting: "d2000003-demo-0000-0000-000000000003",
}

// Agent action IDs created during the script
let aaCounter = 100

function nextAA(): string {
  return `aa-demo-${++aaCounter}`
}

// Activity log IDs created during the script
let alCounter = 100

function nextAL(): string {
  return `al-demo-${++alCounter}`
}

// ---------------------------------------------------------------------------
// Act 1: "The Meeting" — Transcript ingestion creates 3 new tasks
// ---------------------------------------------------------------------------

const ACT_1: DemoAction[] = [
  // Transcript Analyst starts processing
  {
    type: "create_agent_action",
    id: nextAA(),
    data: {
      mc_agentname: "transcript-analyst",
      mc_actiontype: "extract_action_items",
      mc_status: AGENT_STATUS.running,
      mc_confidence: 0,
      mc_durationms: 0,
      mc_name: "transcript-webhook",
      _mc_boardlookup_value: BOARD_ID,
      _mc_tasklookup_value: null,
    },
  },
  { type: "wait", ms: 2500 },

  // Transcript Analyst succeeds
  {
    type: "create_agent_action",
    id: nextAA(),
    data: {
      mc_agentname: "transcript-analyst",
      mc_actiontype: "extract_action_items",
      mc_status: AGENT_STATUS.succeeded,
      mc_confidence: 0.94,
      mc_durationms: 3200,
      mc_name: "transcript-webhook",
      _mc_boardlookup_value: BOARD_ID,
      _mc_tasklookup_value: null,
    },
  },
  {
    type: "create_activity",
    id: nextAL(),
    data: {
      mc_action: ACTION.agent_action,
      mc_description: "Transcript Analyst extracted 3 action items from Sprint Planning meeting",
      mc_actorid: "transcript-analyst",
      mc_actorname: "transcript-analyst",
      mc_isagent: true,
      _mc_boardlookup_value: BOARD_ID,
      _mc_tasklookup_value: null,
    },
  },
  { type: "wait", ms: 1500 },

  // Task 1: OAuth Calendar MCP
  {
    type: "create_task",
    id: NEW_TASK.oauthCalendar,
    data: {
      mc_taskid: NEW_TASK.oauthCalendar,
      mc_title: "Implement OAuth 2.0 flow for Calendar MCP",
      mc_description: "Add OAuth 2.0 authorization code flow to the Calendar MCP server for delegated user access to Microsoft Graph calendar endpoints.",
      mc_priority: PRI.high,
      mc_sortorder: 196608,
      mc_source: SRC.meeting_transcript,
      mc_sourcereference: "Sprint Planning — Week 14",
      mc_labels: '["auth","mcp"]',
      mc_meetingdate: now(),
      mc_assigneeid: "user-sarah",
      mc_assigneename: "Sarah Chen",
      mc_isblocked: false,
      mc_blockedreason: "",
      _mc_columnlookup_value: COL.backlog,
      _mc_taskboardlookup_value: BOARD_ID,
    },
  },
  {
    type: "create_activity",
    id: nextAL(),
    data: {
      mc_action: ACTION.created,
      mc_description: "Task created from Sprint Planning transcript",
      mc_actorid: "transcript-analyst",
      mc_actorname: "transcript-analyst",
      mc_isagent: true,
      _mc_boardlookup_value: BOARD_ID,
      _mc_tasklookup_value: NEW_TASK.oauthCalendar,
    },
  },
  { type: "wait", ms: 1500 },

  // Task 2: MCP error handling
  {
    type: "create_task",
    id: NEW_TASK.mcpErrorHandling,
    data: {
      mc_taskid: NEW_TASK.mcpErrorHandling,
      mc_title: "Review MCP server error handling patterns",
      mc_description: "Audit all MCP server endpoints for consistent error handling. Ensure proper HTTP status codes, structured error responses, and retry guidance.",
      mc_priority: PRI.medium,
      mc_sortorder: 262144,
      mc_source: SRC.meeting_transcript,
      mc_sourcereference: "Sprint Planning — Week 14",
      mc_labels: '["mcp","quality"]',
      mc_meetingdate: now(),
      mc_assigneeid: "user-james",
      mc_assigneename: "James Walsh",
      mc_isblocked: false,
      mc_blockedreason: "",
      _mc_columnlookup_value: COL.backlog,
      _mc_taskboardlookup_value: BOARD_ID,
    },
  },
  { type: "wait", ms: 1500 },

  // Task 3: Load testing
  {
    type: "create_task",
    id: NEW_TASK.loadTesting,
    data: {
      mc_taskid: NEW_TASK.loadTesting,
      mc_title: "Schedule load testing for webhook endpoint",
      mc_description: "Set up k6 load testing suite for the webhook MCP endpoint. Target 500 concurrent connections with 150ms p95 latency.",
      mc_priority: PRI.low,
      mc_sortorder: 327680,
      mc_source: SRC.meeting_transcript,
      mc_sourcereference: "Sprint Planning — Week 14",
      mc_labels: '["testing","performance"]',
      mc_meetingdate: now(),
      mc_assigneeid: "user-tom",
      mc_assigneename: "Tom Richards",
      mc_isblocked: false,
      mc_blockedreason: "",
      _mc_columnlookup_value: COL.backlog,
      _mc_taskboardlookup_value: BOARD_ID,
    },
  },
]

// ---------------------------------------------------------------------------
// Act 2: "The Triage" — Board Manager moves and re-prioritises tasks
// ---------------------------------------------------------------------------

const ACT_2: DemoAction[] = [
  { type: "wait", ms: 2000 },

  // Board Manager starts triaging
  {
    type: "create_agent_action",
    id: nextAA(),
    data: {
      mc_agentname: "board-manager",
      mc_actiontype: "triage_tasks",
      mc_status: AGENT_STATUS.running,
      mc_confidence: 0,
      mc_durationms: 0,
      mc_name: "dataverse-api",
      _mc_boardlookup_value: BOARD_ID,
      _mc_tasklookup_value: null,
    },
  },
  { type: "wait", ms: 2500 },

  // Move OAuth task: Backlog → To Do
  { type: "move_task", taskId: NEW_TASK.oauthCalendar, toColumn: COL.todo },
  {
    type: "create_activity",
    id: nextAL(),
    data: {
      mc_action: ACTION.moved,
      mc_description: "Board Manager moved to To Do — high priority, auth dependency",
      mc_actorid: "board-manager",
      mc_actorname: "board-manager",
      mc_isagent: true,
      _mc_boardlookup_value: BOARD_ID,
      _mc_tasklookup_value: NEW_TASK.oauthCalendar,
    },
  },
  { type: "wait", ms: 1500 },

  // Move MCP error handling: Backlog → To Do
  { type: "move_task", taskId: NEW_TASK.mcpErrorHandling, toColumn: COL.todo },
  { type: "wait", ms: 2000 },

  // Board Manager succeeds
  {
    type: "create_agent_action",
    id: nextAA(),
    data: {
      mc_agentname: "board-manager",
      mc_actiontype: "triage_tasks",
      mc_status: AGENT_STATUS.succeeded,
      mc_confidence: 0.88,
      mc_durationms: 4200,
      mc_name: "dataverse-api",
      _mc_boardlookup_value: BOARD_ID,
      _mc_tasklookup_value: null,
    },
  },
  { type: "wait", ms: 1500 },

  // Move OAuth task: To Do → In Progress
  { type: "move_task", taskId: NEW_TASK.oauthCalendar, toColumn: COL.in_progress },
  {
    type: "create_activity",
    id: nextAL(),
    data: {
      mc_action: ACTION.moved,
      mc_description: "Board Manager moved to In Progress — assignee has capacity",
      mc_actorid: "board-manager",
      mc_actorname: "board-manager",
      mc_isagent: true,
      _mc_boardlookup_value: BOARD_ID,
      _mc_tasklookup_value: NEW_TASK.oauthCalendar,
    },
  },
  { type: "wait", ms: 1500 },

  // Elevate priority of infraUpgrade to high
  {
    type: "update_task",
    taskId: TASK.infraUpgrade,
    changes: { mc_priority: PRI.high },
  },
  {
    type: "create_activity",
    id: nextAL(),
    data: {
      mc_action: ACTION.updated,
      mc_description: "Board Manager elevated priority to High — dependency detected",
      mc_actorid: "board-manager",
      mc_actorname: "board-manager",
      mc_isagent: true,
      _mc_boardlookup_value: BOARD_ID,
      _mc_tasklookup_value: TASK.infraUpgrade,
    },
  },
]

// ---------------------------------------------------------------------------
// Act 3: "The AI Chat" — Simulated conversation
// ---------------------------------------------------------------------------

const ACT_3: DemoAction[] = [
  { type: "wait", ms: 2000 },
  { type: "open_chat" },
  { type: "wait", ms: 1500 },

  // User asks about sprint status
  { type: "inject_chat", role: "user", content: "What's the current sprint status?" },
  { type: "wait", ms: 2500 },

  // Bot responds with summary
  {
    type: "inject_chat",
    role: "assistant",
    content:
      `**Board Summary — Sprint 14**\n\n` +
      `| Column | Tasks |\n` +
      `|--------|-------|\n` +
      `| Backlog | 3 |\n` +
      `| To Do | 4 |\n` +
      `| In Progress | 3 |\n` +
      `| Review | 1 |\n` +
      `| Done | 1 |\n\n` +
      `**Key Highlights:**\n` +
      `- **1 blocked** task: *Database schema migration* (awaiting DevOps approval)\n` +
      `- **1 overdue**: *Database schema migration* (1 day past due)\n` +
      `- Sprint velocity: **4.2 tasks/day** (up 8% from last sprint)\n` +
      `- 3 new tasks ingested from today's Sprint Planning transcript`,
    agentName: "summary-agent",
  },
  { type: "wait", ms: 3500 },

  // User asks about assignment
  { type: "inject_chat", role: "user", content: "Who should work on the OAuth Calendar task?" },
  { type: "wait", ms: 2000 },

  // Bot recommends
  {
    type: "inject_chat",
    role: "assistant",
    content:
      `I'd recommend **Sarah Chen** for the OAuth Calendar MCP task based on:\n\n` +
      `- **Expertise match**: Sarah has completed 4 auth-related tasks in the past 2 sprints\n` +
      `- **Current capacity**: 2 active tasks (within WIP limit)\n` +
      `- **Calendar availability**: No conflicting meetings this week\n\n` +
      `She's already been assigned automatically. Would you like me to adjust?`,
    agentName: "board-manager",
  },
]

// ---------------------------------------------------------------------------
// Act 4: "The Signals" — Signal monitoring, blocking, approval
// ---------------------------------------------------------------------------

const approvalAA = nextAA()

const ACT_4: DemoAction[] = [
  { type: "wait", ms: 3000 },
  { type: "close_chat" },
  { type: "wait", ms: 1500 },

  // Signal Monitor scans
  {
    type: "create_agent_action",
    id: nextAA(),
    data: {
      mc_agentname: "signal-monitor",
      mc_actiontype: "dependency_scan",
      mc_status: AGENT_STATUS.running,
      mc_confidence: 0,
      mc_durationms: 0,
      mc_name: "graph-mail",
      _mc_boardlookup_value: BOARD_ID,
      _mc_tasklookup_value: null,
    },
  },
  { type: "wait", ms: 2500 },

  // Signal Monitor succeeds
  {
    type: "create_agent_action",
    id: nextAA(),
    data: {
      mc_agentname: "signal-monitor",
      mc_actiontype: "dependency_scan",
      mc_status: AGENT_STATUS.succeeded,
      mc_confidence: 0.91,
      mc_durationms: 4300,
      mc_name: "graph-mail",
      _mc_boardlookup_value: BOARD_ID,
      _mc_tasklookup_value: null,
    },
  },
  { type: "wait", ms: 1500 },

  // Block the auth refactor task
  {
    type: "update_task",
    taskId: TASK.authRefactor,
    changes: {
      mc_isblocked: true,
      mc_blockedreason: "Upstream MSAL v3 library has breaking change in RC2 — waiting on patch",
    },
  },
  {
    type: "create_activity",
    id: nextAL(),
    data: {
      mc_action: ACTION.updated,
      mc_description: "Signal Monitor detected blocking dependency — MSAL v3 RC2 breaking change",
      mc_actorid: "signal-monitor",
      mc_actorname: "signal-monitor",
      mc_isagent: true,
      _mc_boardlookup_value: BOARD_ID,
      _mc_tasklookup_value: TASK.authRefactor,
    },
  },
  { type: "wait", ms: 2500 },

  // Board Manager wants to reassign — requires approval
  {
    type: "create_agent_action",
    id: approvalAA,
    data: {
      mc_agentname: "board-manager",
      mc_actiontype: "reassign_task",
      mc_status: AGENT_STATUS.requires_approval,
      mc_confidence: 0.87,
      mc_durationms: 600,
      mc_name: "dataverse-api",
      _mc_boardlookup_value: BOARD_ID,
      _mc_tasklookup_value: TASK.authRefactor,
    },
  },
  { type: "wait", ms: 5000 },

  // Auto-approve
  {
    type: "update_agent_action",
    id: approvalAA,
    changes: { mc_status: AGENT_STATUS.succeeded },
  },
  {
    type: "create_activity",
    id: nextAL(),
    data: {
      mc_action: ACTION.assigned,
      mc_description: "Board Manager reassigned task (approved) — moved to James Walsh",
      mc_actorid: "board-manager",
      mc_actorname: "board-manager",
      mc_isagent: true,
      _mc_boardlookup_value: BOARD_ID,
      _mc_tasklookup_value: TASK.authRefactor,
    },
  },
  { type: "wait", ms: 2000 },

  // Unblock the auth refactor
  {
    type: "update_task",
    taskId: TASK.authRefactor,
    changes: { mc_isblocked: false, mc_blockedreason: "" },
  },
]

// ---------------------------------------------------------------------------
// Act 5: "The Wrap-up" — Task completion and daily summary
// ---------------------------------------------------------------------------

const ACT_5: DemoAction[] = [
  { type: "wait", ms: 2000 },

  // Move dashboard redesign: Review → Done
  { type: "move_task", taskId: TASK.dashboardRedesign, toColumn: COL.done },
  {
    type: "update_task",
    taskId: TASK.dashboardRedesign,
    changes: { mc_completeddate: now() },
  },
  {
    type: "create_activity",
    id: nextAL(),
    data: {
      mc_action: ACTION.completed,
      mc_description: "Dashboard redesign completed and merged",
      mc_actorid: "Sarah Chen",
      mc_actorname: "Sarah Chen",
      mc_isagent: false,
      _mc_boardlookup_value: BOARD_ID,
      _mc_tasklookup_value: TASK.dashboardRedesign,
    },
  },
  { type: "wait", ms: 2000 },

  // Summary Agent generates daily summary
  {
    type: "create_agent_action",
    id: nextAA(),
    data: {
      mc_agentname: "summary-agent",
      mc_actiontype: "generate_daily_summary",
      mc_status: AGENT_STATUS.running,
      mc_confidence: 0,
      mc_durationms: 0,
      mc_name: "dataverse-api",
      _mc_boardlookup_value: BOARD_ID,
      _mc_tasklookup_value: null,
    },
  },
  { type: "wait", ms: 2500 },

  // Move API rate limiting: In Progress → Review
  { type: "move_task", taskId: TASK.apiRateLimiting, toColumn: COL.review },
  {
    type: "create_activity",
    id: nextAL(),
    data: {
      mc_action: ACTION.moved,
      mc_description: "API rate limiting moved to Review — PR submitted",
      mc_actorid: "Sarah Chen",
      mc_actorname: "Sarah Chen",
      mc_isagent: false,
      _mc_boardlookup_value: BOARD_ID,
      _mc_tasklookup_value: TASK.apiRateLimiting,
    },
  },
  { type: "wait", ms: 2000 },

  // Summary Agent succeeds
  {
    type: "create_agent_action",
    id: nextAA(),
    data: {
      mc_agentname: "summary-agent",
      mc_actiontype: "generate_daily_summary",
      mc_status: AGENT_STATUS.succeeded,
      mc_confidence: 0.96,
      mc_durationms: 5200,
      mc_name: "dataverse-api",
      _mc_boardlookup_value: BOARD_ID,
      _mc_tasklookup_value: null,
    },
  },
]

// ---------------------------------------------------------------------------
// Full script — all 5 acts concatenated
// ---------------------------------------------------------------------------

export const DEMO_SCRIPT: DemoAction[] = [
  ...ACT_1,
  ...ACT_2,
  ...ACT_3,
  ...ACT_4,
  ...ACT_5,
]

// Export new task IDs for cleanup tracking
export { NEW_TASK }

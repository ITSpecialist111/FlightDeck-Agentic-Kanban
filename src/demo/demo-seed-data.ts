/**
 * Demo seed data constants and seedDemoData for the lazy-loaded demo script.
 *
 * These constants are intentionally DUPLICATED from mock-dataverse-client.ts.
 * The CRUD file keeps its copies local (non-exported) so Rollup cannot extract
 * them into a shared chunk. This file provides the same values for the demo
 * script and demo provider which run in the lazy chunk.
 */
import { seedRecord, clearAllTables } from "./mock-dataverse-client"

// ---------------------------------------------------------------------------
// Stable GUIDs (must match mock-dataverse-client.ts)
// ---------------------------------------------------------------------------

export const ORG_ID = "93ea2089-1928-f111-8341-000d3a3b1746"
export const PROJECT_ID = "b3ec2089-1928-f111-8341-000d3a3b1746"
export const BOARD_ID = "4908e091-1928-f111-8341-000d3a3b1746"

export const COL = {
  backlog: "4a08e091-1928-f111-8341-000d3a3b1746",
  todo: "10827e99-1928-f111-8341-000d3a3b1746",
  in_progress: "2a847e99-1928-f111-8341-000d3a3b1746",
  review: "068b04a2-1928-f111-8341-000d3a3b1746",
  done: "0c8b04a2-1928-f111-8341-000d3a3b1746",
} as const

export const COL_TYPE = { backlog: 100000000, todo: 100000001, in_progress: 100000002, review: 100000003, done: 100000004 }
export const PRI = { critical: 100000000, high: 100000001, medium: 100000002, low: 100000003 }
export const SRC = { manual: 100000000, meeting_transcript: 100000001, email: 100000002, agent: 100000003 }
export const AGENT_STATUS = { pending: 100000000, running: 100000001, succeeded: 100000002, failed: 100000003, requires_approval: 100000004 }
export const ACTION = { created: 100000000, moved: 100000001, updated: 100000002, commented: 100000003, assigned: 100000004, completed: 100000005, agent_action: 100000008 }

export const TASK = {
  apiRateLimiting: "d1000001-demo-0000-0000-000000000001",
  databaseMigration: "d1000002-demo-0000-0000-000000000002",
  dashboardRedesign: "d1000003-demo-0000-0000-000000000003",
  authRefactor: "d1000004-demo-0000-0000-000000000004",
  infraUpgrade: "d1000005-demo-0000-0000-000000000005",
  ciPipeline: "d1000006-demo-0000-0000-000000000006",
  dataExportApi: "d1000007-demo-0000-0000-000000000007",
  securityAudit: "d1000008-demo-0000-0000-000000000008",
}

// ---------------------------------------------------------------------------
// seedDemoData — can be called by the demo provider to reset the board
// ---------------------------------------------------------------------------

function daysAgo(n: number): string {
  const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString()
}
function daysFromNow(n: number): string {
  const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString()
}

export function seedDemoData(): void {
  clearAllTables()

  seedRecord("mc_organizations", ORG_ID, { mc_organizationid: ORG_ID, mc_name: "FlightDeck Demo", mc_logourl: "" })

  seedRecord("mc_projects", PROJECT_ID, {
    mc_projectid: PROJECT_ID, mc_name: "Project Phoenix",
    mc_description: "Next-generation platform modernisation initiative",
    _mc_organizationlookup_value: ORG_ID, createdon: daysAgo(30), modifiedon: daysAgo(0),
  })

  seedRecord("mc_boards", BOARD_ID, {
    mc_boardid: BOARD_ID, mc_name: "Sprint Board",
    mc_description: "Active sprint for Project Phoenix",
    _mc_projectlookup_value: PROJECT_ID, createdon: daysAgo(14), modifiedon: daysAgo(0),
  })

  const columns = [
    { id: COL.backlog, name: "Backlog", type: COL_TYPE.backlog, order: 0, color: "#6b7280", wip: 0 },
    { id: COL.todo, name: "To Do", type: COL_TYPE.todo, order: 1, color: "#3b82f6", wip: 5 },
    { id: COL.in_progress, name: "In Progress", type: COL_TYPE.in_progress, order: 2, color: "#f59e0b", wip: 3 },
    { id: COL.review, name: "Review", type: COL_TYPE.review, order: 3, color: "#8b5cf6", wip: 3 },
    { id: COL.done, name: "Done", type: COL_TYPE.done, order: 4, color: "#10b981", wip: 0 },
  ]
  for (const c of columns) {
    seedRecord("mc_columns", c.id, {
      mc_columnid: c.id, mc_name: c.name, mc_columntype: c.type,
      mc_sortorder: c.order, mc_color: c.color, mc_wiplimit: c.wip,
      _mc_boardlookup_value: BOARD_ID,
    })
  }

  const tasks = [
    { id: TASK.apiRateLimiting, title: "Implement API rate limiting middleware", description: "Add configurable rate limiting to all public API endpoints using token bucket algorithm. Must support per-tenant and per-endpoint limits.", column: COL.in_progress, priority: PRI.high, source: SRC.meeting_transcript, assigneeId: "user-sarah", assigneeName: "Sarah Chen", sortOrder: 65536, labels: '["backend","security"]', dueDate: daysFromNow(3), isBlocked: false, blockedReason: "" },
    { id: TASK.databaseMigration, title: "Database schema migration to v3", description: "Migrate PostgreSQL schema from v2 to v3. Includes new indexes, partitioning for audit tables, and backward-compatible column additions.", column: COL.in_progress, priority: PRI.critical, source: SRC.manual, assigneeId: "user-james", assigneeName: "James Walsh", sortOrder: 131072, labels: '["database","infrastructure"]', dueDate: daysFromNow(-1), isBlocked: true, blockedReason: "Waiting on DevOps PR approval for migration scripts" },
    { id: TASK.dashboardRedesign, title: "Redesign analytics dashboard layout", description: "Update the analytics dashboard with new chart components, improved responsive layout, and dark mode support for all visualisations.", column: COL.review, priority: PRI.medium, source: SRC.manual, assigneeId: "user-sarah", assigneeName: "Sarah Chen", sortOrder: 65536, labels: '["frontend","design"]', dueDate: daysFromNow(5), isBlocked: false, blockedReason: "" },
    { id: TASK.authRefactor, title: "Refactor authentication flow to MSAL v3", description: "Upgrade from MSAL v2 to v3, implement silent token refresh, add session persistence, and improve error handling for token acquisition failures.", column: COL.todo, priority: PRI.high, source: SRC.email, assigneeId: "user-priya", assigneeName: "Priya Sharma", sortOrder: 65536, labels: '["security","auth"]', dueDate: daysFromNow(7), isBlocked: false, blockedReason: "" },
    { id: TASK.infraUpgrade, title: "Upgrade Container Apps to multi-revision mode", description: "Enable multi-revision mode for blue-green deployments. Configure traffic splitting, health probes, and automatic rollback on failure.", column: COL.backlog, priority: PRI.medium, source: SRC.agent, assigneeId: "user-tom", assigneeName: "Tom Richards", sortOrder: 65536, labels: '["infrastructure","devops"]', dueDate: null, isBlocked: false, blockedReason: "" },
    { id: TASK.ciPipeline, title: "Set up end-to-end test pipeline", description: "Create GitHub Actions workflow for automated E2E testing using Playwright. Include visual regression tests and accessibility checks.", column: COL.todo, priority: PRI.low, source: SRC.meeting_transcript, assigneeId: "user-tom", assigneeName: "Tom Richards", sortOrder: 131072, labels: '["testing","ci-cd"]', dueDate: daysFromNow(14), isBlocked: false, blockedReason: "" },
    { id: TASK.dataExportApi, title: "Build data export API for compliance reports", description: "Create RESTful API endpoints for exporting board data in CSV, JSON, and PDF formats. Must comply with GDPR data portability requirements.", column: COL.backlog, priority: PRI.medium, source: SRC.email, assigneeId: "user-james", assigneeName: "James Walsh", sortOrder: 131072, labels: '["backend","compliance"]', dueDate: null, isBlocked: false, blockedReason: "" },
    { id: TASK.securityAudit, title: "Conduct security audit of MCP server endpoints", description: "Full security audit including OWASP top 10 checks, dependency vulnerability scanning, and penetration testing of all MCP server HTTP endpoints.", column: COL.done, priority: PRI.high, source: SRC.agent, assigneeId: "user-priya", assigneeName: "Priya Sharma", sortOrder: 65536, labels: '["security","audit"]', dueDate: daysAgo(2), completedDate: daysAgo(1), isBlocked: false, blockedReason: "" },
  ]
  for (const t of tasks) {
    seedRecord("mc_tasks", t.id, {
      mc_taskid: t.id, mc_title: t.title, mc_description: t.description,
      mc_priority: t.priority, mc_sortorder: t.sortOrder, mc_duedate: t.dueDate,
      mc_source: t.source, mc_sourcereference: "", mc_labels: t.labels,
      mc_meetingdate: t.source === SRC.meeting_transcript ? daysAgo(2) : null,
      mc_completeddate: (t as Record<string, unknown>).completedDate ?? null,
      mc_archiveddate: null, mc_isblocked: t.isBlocked, mc_blockedreason: t.blockedReason,
      mc_assigneeid: t.assigneeId, mc_assigneename: t.assigneeName,
      _mc_columnlookup_value: t.column, _mc_taskboardlookup_value: BOARD_ID,
      createdon: daysAgo(Math.floor(Math.random() * 10) + 1), modifiedon: daysAgo(0),
    })
  }

  const members = [
    { id: "bm-001", userId: "user-sarah", name: "Sarah Chen", role: 100000001 },
    { id: "bm-002", userId: "user-james", name: "James Walsh", role: 100000002 },
    { id: "bm-003", userId: "user-priya", name: "Priya Sharma", role: 100000002 },
    { id: "bm-004", userId: "user-tom", name: "Tom Richards", role: 100000002 },
  ]
  for (const m of members) {
    seedRecord("mc_boardmembers", m.id, {
      mc_boardmemberid: m.id, mc_userid: m.userId, mc_displayname: m.name,
      mc_role: m.role, _mc_boardlookup_value: BOARD_ID, createdon: daysAgo(14),
    })
  }

  const agentActions = [
    { id: "aa-001", agent: "transcript-analyst", action: "extract_action_items", status: AGENT_STATUS.succeeded, confidence: 0.94, duration: 3200, mcp: "transcript-webhook", taskId: TASK.apiRateLimiting, created: daysAgo(2) },
    { id: "aa-002", agent: "board-manager", action: "triage_tasks", status: AGENT_STATUS.succeeded, confidence: 0.88, duration: 1500, mcp: "dataverse-api", taskId: TASK.apiRateLimiting, created: daysAgo(2) },
    { id: "aa-003", agent: "signal-monitor", action: "email_scan", status: AGENT_STATUS.succeeded, confidence: 0.91, duration: 4100, mcp: "graph-mail", taskId: null, created: daysAgo(1) },
    { id: "aa-004", agent: "summary-agent", action: "generate_daily_summary", status: AGENT_STATUS.succeeded, confidence: 0.96, duration: 5800, mcp: "dataverse-api", taskId: null, created: daysAgo(1) },
    { id: "aa-005", agent: "board-manager", action: "update_priority", status: AGENT_STATUS.succeeded, confidence: 0.72, duration: 800, mcp: "dataverse-api", taskId: TASK.databaseMigration, created: daysAgo(0) },
  ]
  for (const a of agentActions) {
    seedRecord("mc_agentactions", a.id, {
      mc_agentactionid: a.id, mc_agentname: a.agent, mc_actiontype: a.action,
      mc_status: a.status, mc_confidence: a.confidence, mc_durationms: a.duration,
      mc_name: a.mcp, _mc_tasklookup_value: a.taskId, _mc_boardlookup_value: BOARD_ID,
      createdon: a.created,
    })
  }

  const activities = [
    { id: "al-001", action: ACTION.created, desc: "Task created from meeting transcript", taskId: TASK.apiRateLimiting, actor: "transcript-analyst", isAgent: true, created: daysAgo(2) },
    { id: "al-002", action: ACTION.moved, desc: "Moved from Backlog to In Progress", taskId: TASK.apiRateLimiting, actor: "board-manager", isAgent: true, created: daysAgo(2) },
    { id: "al-003", action: ACTION.updated, desc: "Priority elevated to Critical", taskId: TASK.databaseMigration, actor: "signal-monitor", isAgent: true, created: daysAgo(1) },
    { id: "al-004", action: ACTION.completed, desc: "Security audit completed", taskId: TASK.securityAudit, actor: "Priya Sharma", isAgent: false, created: daysAgo(1) },
    { id: "al-005", action: ACTION.assigned, desc: "Assigned to Tom Richards", taskId: TASK.ciPipeline, actor: "board-manager", isAgent: true, created: daysAgo(0) },
    { id: "al-006", action: ACTION.agent_action, desc: "Daily summary generated", taskId: null, actor: "summary-agent", isAgent: true, created: daysAgo(0) },
  ]
  for (const a of activities) {
    seedRecord("mc_activitylogs", a.id, {
      mc_activitylogid: a.id, mc_action: a.action, mc_description: a.desc,
      mc_actorid: a.actor, mc_actorname: a.actor, mc_isagent: a.isAgent,
      _mc_tasklookup_value: a.taskId, _mc_boardlookup_value: BOARD_ID, createdon: a.created,
    })
  }

  seedRecord("mc_comments", "cmt-001", {
    mc_commentid: "cmt-001", mc_content: "Token bucket implementation looks good. Consider adding Redis-backed distributed counting for multi-instance deployments.",
    mc_authorid: "user-james", mc_authorname: "James Walsh", mc_isagent: false,
    _mc_tasklookup_value: TASK.apiRateLimiting, createdon: daysAgo(1), modifiedon: daysAgo(1),
  })

  seedRecord("mc_comments", "cmt-002", {
    mc_commentid: "cmt-002", mc_content: "Automated analysis: This task has 3 dependencies that are currently in progress. Estimated completion risk: LOW. Recommend monitoring the auth-service PR merge timeline.",
    mc_authorid: "signal-monitor", mc_authorname: "Signal Monitor", mc_isagent: true,
    _mc_tasklookup_value: TASK.authRefactor, createdon: daysAgo(0), modifiedon: daysAgo(0),
  })
}

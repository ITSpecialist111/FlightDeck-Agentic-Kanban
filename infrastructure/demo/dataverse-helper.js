/**
 * FlightDeck Demo — Dataverse helper
 *
 * Writes directly to Dataverse Web API v9.2 using Azure CLI tokens.
 * Follows the same patterns as infrastructure/scripts/seed-demo-data.sh.
 */

const DV_URL = "https://orged45fd63.crm.dynamics.com";
const API = `${DV_URL}/api/data/v9.2`;

// Known GUIDs from seed data
export const BOARD_ID = "4908e091-1928-f111-8341-000d3a3b1746";
export const ORG_ID = "93ea2089-1928-f111-8341-000d3a3b1746";
export const PROJECT_ID = "b3ec2089-1928-f111-8341-000d3a3b1746";

// Column IDs
export const COLUMNS = {
  backlog: "4a08e091-1928-f111-8341-000d3a3b1746",
  todo: "10827e99-1928-f111-8341-000d3a3b1746",
  in_progress: "2a847e99-1928-f111-8341-000d3a3b1746",
  review: "068b04a2-1928-f111-8341-000d3a3b1746",
  done: "0c8b04a2-1928-f111-8341-000d3a3b1746",
};

// Picklist values
export const PRIORITY = { critical: 100000000, high: 100000001, medium: 100000002, low: 100000003 };
export const SOURCE = { manual: 100000000, meeting_transcript: 100000001, email: 100000002, agent: 100000003, import: 100000004 };
export const ACTION = { created: 100000000, moved: 100000001, updated: 100000002, commented: 100000003, assigned: 100000004, completed: 100000005, archived: 100000006, deleted: 100000007, agent_action: 100000008 };
export const AGENT_STATUS = { pending: 100000000, running: 100000001, succeeded: 100000002, failed: 100000003, requires_approval: 100000004 };

let _token = null;
let _tokenExpiry = 0;

/**
 * Get a Dataverse access token via Azure CLI.
 */
async function getToken() {
  if (_token && Date.now() < _tokenExpiry) return _token;

  const { execSync } = await import("child_process");
  const result = execSync(
    `az account get-access-token --resource "${DV_URL}" --query accessToken -o tsv`,
    { encoding: "utf8", timeout: 30000 }
  ).trim();

  _token = result;
  _tokenExpiry = Date.now() + 45 * 60 * 1000; // 45 min
  return _token;
}

/**
 * Make a Dataverse API request.
 */
async function dvRequest(method, path, body = null) {
  const token = await getToken();
  const url = `${API}/${path}`;

  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "OData-MaxVersion": "4.0",
      "OData-Version": "4.0",
      Prefer: "return=representation",
    },
  };

  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Dataverse ${method} ${path} failed (${res.status}): ${err}`);
  }

  if (res.status === 204) return null;

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ── CRUD Operations ──────────────────────────────────────────────────────────

/**
 * Create a task on the board. Returns the created record with mc_taskid.
 */
export async function createTask({
  title,
  description = "",
  columnId,
  priority = PRIORITY.medium,
  source = SOURCE.meeting_transcript,
  assigneeName = "",
  sortOrder = 65536,
  labels = "[]",
  dueDate = null,
  meetingDate = null,
  sourceReference = "",
}) {
  const body = {
    mc_title: title,
    mc_description: description,
    mc_priority: priority,
    mc_source: source,
    mc_assigneename: assigneeName,
    mc_sortorder: sortOrder,
    mc_labels: labels,
    mc_sourcereference: sourceReference,
    "mc_columnlookup@odata.bind": `/mc_columns(${columnId})`,
    "mc_taskboardlookup@odata.bind": `/mc_boards(${BOARD_ID})`,
  };

  if (dueDate) body.mc_duedate = dueDate;
  if (meetingDate) body.mc_meetingdate = meetingDate;

  return dvRequest("POST", "mc_tasks", body);
}

/**
 * Move a task to a different column.
 */
export async function moveTask(taskId, newColumnId) {
  return dvRequest("PATCH", `mc_tasks(${taskId})`, {
    "mc_columnlookup@odata.bind": `/mc_columns(${newColumnId})`,
  });
}

/**
 * Update a task's fields.
 */
export async function updateTask(taskId, fields) {
  return dvRequest("PATCH", `mc_tasks(${taskId})`, fields);
}

/**
 * Log an activity entry.
 */
export async function logActivity({
  action,
  description,
  actorName,
  isAgent = false,
  taskId = null,
  previousValue = null,
  newValue = null,
}) {
  const body = {
    mc_action: action,
    mc_description: description,
    mc_actorname: actorName,
    mc_isagent: isAgent,
    "mc_boardlookup@odata.bind": `/mc_boards(${BOARD_ID})`,
  };

  if (taskId) body["mc_tasklookup@odata.bind"] = `/mc_tasks(${taskId})`;
  if (previousValue) body.mc_previousvalue = previousValue;
  if (newValue) body.mc_newvalue = newValue;

  return dvRequest("POST", "mc_activitylogs", body);
}

/**
 * Record an agent action.
 */
export async function recordAgentAction({
  agentName,
  actionType,
  status = AGENT_STATUS.succeeded,
  confidence = 0.85,
  durationMs = null,
  taskId = null,
}) {
  const body = {
    mc_agentname: agentName,
    mc_actiontype: actionType,
    mc_status: status,
    mc_confidence: confidence,
    "mc_boardlookup@odata.bind": `/mc_boards(${BOARD_ID})`,
  };

  if (durationMs != null) body.mc_durationms = durationMs;
  if (taskId) body["mc_tasklookup@odata.bind"] = `/mc_tasks(${taskId})`;

  return dvRequest("POST", "mc_agentactions", body);
}

/**
 * Add a comment to a task.
 */
export async function addComment({ taskId, content, authorName, isAgent = false }) {
  return dvRequest("POST", "mc_comments", {
    mc_content: content,
    mc_authorname: authorName,
    mc_isagent: isAgent,
    "mc_tasklookup@odata.bind": `/mc_tasks(${taskId})`,
  });
}

/**
 * Query tasks by filter.
 */
export async function queryTasks(filter = "") {
  const path = filter
    ? `mc_tasks?$filter=${encodeURIComponent(filter)}&$select=mc_taskid,mc_title,mc_assigneename,_mc_columnlookup_value`
    : `mc_tasks?$filter=_mc_taskboardlookup_value eq '${BOARD_ID}'&$select=mc_taskid,mc_title,mc_assigneename,_mc_columnlookup_value&$orderby=mc_sortorder`;

  const result = await dvRequest("GET", path);
  return result?.value || [];
}

/**
 * Delete a task (for cleanup).
 */
export async function deleteTask(taskId) {
  const token = await getToken();
  const res = await fetch(`${API}/mc_tasks(${taskId})`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`Delete task failed: ${res.status}`);
  }
}

/**
 * Delete agent actions by filter (for cleanup).
 */
export async function deleteAgentAction(actionId) {
  const token = await getToken();
  const res = await fetch(`${API}/mc_agentactions(${actionId})`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`Delete agent action failed: ${res.status}`);
  }
}

/**
 * Query agent actions.
 */
export async function queryAgentActions(filter = "") {
  const f = filter || `_mc_boardlookup_value eq '${BOARD_ID}'`;
  const result = await dvRequest("GET", `mc_agentactions?$filter=${encodeURIComponent(f)}&$select=mc_agentactionid,mc_agentname,mc_actiontype`);
  return result?.value || [];
}

/**
 * Query activity logs.
 */
export async function queryActivityLogs(filter = "") {
  const f = filter || `_mc_boardlookup_value eq '${BOARD_ID}'`;
  const result = await dvRequest("GET", `mc_activitylogs?$filter=${encodeURIComponent(f)}&$select=mc_activitylogid,mc_description`);
  return result?.value || [];
}

/**
 * Delete an activity log entry (for cleanup).
 */
export async function deleteActivityLog(logId) {
  const token = await getToken();
  const res = await fetch(`${API}/mc_activitylogs(${logId})`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`Delete activity log failed: ${res.status}`);
  }
}

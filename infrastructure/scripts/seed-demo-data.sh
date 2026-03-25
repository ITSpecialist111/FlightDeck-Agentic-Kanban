#!/usr/bin/env bash
# FlightDeck — Seed realistic demo data: tasks, members, comments, activity
set -uo pipefail
DV="https://orged45fd63.crm.dynamics.com"
API="${DV}/api/data/v9.2"

# Known GUIDs from initial seed
BOARD_ID="4908e091-1928-f111-8341-000d3a3b1746"

echo "=== Fetching column IDs ==="
COLS=$(az rest --method get \
  --url "${API}/mc_columns?\$filter=_mc_boardlookup_value eq '${BOARD_ID}'&\$select=mc_columnid,mc_name&\$orderby=mc_sortorder" \
  --resource "${DV}" 2>&1)

# Parse column IDs
BACKLOG_ID=$(echo "${COLS}" | python3 -c "import sys,json; cols=json.load(sys.stdin)['value']; print(next(c['mc_columnid'] for c in cols if c['mc_name']=='Backlog'))")
TODO_ID=$(echo "${COLS}" | python3 -c "import sys,json; cols=json.load(sys.stdin)['value']; print(next(c['mc_columnid'] for c in cols if c['mc_name']=='To Do'))")
INPROG_ID=$(echo "${COLS}" | python3 -c "import sys,json; cols=json.load(sys.stdin)['value']; print(next(c['mc_columnid'] for c in cols if c['mc_name']=='In Progress'))")
REVIEW_ID=$(echo "${COLS}" | python3 -c "import sys,json; cols=json.load(sys.stdin)['value']; print(next(c['mc_columnid'] for c in cols if c['mc_name']=='Review'))")
DONE_ID=$(echo "${COLS}" | python3 -c "import sys,json; cols=json.load(sys.stdin)['value']; print(next(c['mc_columnid'] for c in cols if c['mc_name']=='Done'))")

echo "Backlog: ${BACKLOG_ID}"
echo "To Do:   ${TODO_ID}"
echo "In Prog: ${INPROG_ID}"
echo "Review:  ${REVIEW_ID}"
echo "Done:    ${DONE_ID}"

echo ""
echo "=== Creating Board Members ==="

create_member() {
  local name=$1 email=$2 role=$3
  echo -n "  ${name}... "
  az rest --method post --url "${API}/mc_boardmembers" --resource "${DV}" \
    --headers "Content-Type=application/json" \
    --body "{\"mc_name\":\"${name}\",\"mc_email\":\"${email}\",\"mc_role\":${role},\"mc_boardlookup@odata.bind\":\"/mc_boards(${BOARD_ID})\"}" \
    -o none 2>&1 && echo "OK" || echo "SKIP"
  sleep 2
}

# Roles: 100000000=owner, 100000001=admin, 100000002=member, 100000003=viewer
create_member "Graham Hosking" "admin@ABSx02771022.onmicrosoft.com" 100000000
create_member "Sarah Chen" "sarah.chen@contoso.com" 100000001
create_member "Marcus Johnson" "marcus.j@contoso.com" 100000002
create_member "Priya Patel" "priya.patel@contoso.com" 100000002
create_member "Alex Wright" "alex.wright@contoso.com" 100000003

echo ""
echo "=== Creating Tasks ==="

create_task() {
  local title=$1 desc=$2 col=$3 priority=$4 source=$5 assignee=$6 sort=$7 labels=$8 due=$9
  echo -n "  ${title:0:50}... "
  local body="{\"mc_title\":\"${title}\",\"mc_description\":\"${desc}\",\"mc_priority\":${priority},\"mc_source\":${source},\"mc_assigneename\":\"${assignee}\",\"mc_sortorder\":${sort},\"mc_labels\":\"${labels}\",\"mc_columnlookup@odata.bind\":\"/mc_columns(${col})\",\"mc_taskboardlookup@odata.bind\":\"/mc_boards(${BOARD_ID})\"}"
  if [ -n "${due}" ]; then
    body="${body%\}},\"mc_duedate\":\"${due}\"}"
  fi
  TASK_RESPONSE=$(az rest --method post --url "${API}/mc_tasks" --resource "${DV}" \
    --headers "Content-Type=application/json" "Prefer=return=representation" \
    --body "${body}" 2>&1)
  TASK_ID=$(echo "${TASK_RESPONSE}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('mc_taskid',''))" 2>/dev/null)
  echo "OK (${TASK_ID:0:8})"
  sleep 2
  echo "${TASK_ID}"
}

# Priority: 100000000=critical, 100000001=high, 100000002=medium, 100000003=low
# Source: 100000000=manual, 100000001=transcript, 100000002=email-signal, 100000003=agent-created

# === BACKLOG (3 tasks) ===
create_task "Investigate SSO token refresh failures" \
  "Users reporting intermittent 401 errors after 30 min of inactivity. Need to check token refresh logic in the auth middleware." \
  "${BACKLOG_ID}" 100000001 100000000 "Priya Patel" 65536 '["auth","bug"]' "2026-04-15"

create_task "Design dark mode colour palette for analytics charts" \
  "Current Recharts colours don't have enough contrast in dark mode. Need OKLCH-based palette that works in both themes." \
  "${BACKLOG_ID}" 100000003 100000000 "" 131072 '["design","analytics"]' ""

create_task "Add webhook retry logic with exponential backoff" \
  "Transcript webhook currently fails silently on 5xx. Need retry with backoff and dead-letter queue." \
  "${BACKLOG_ID}" 100000002 100000001 "Alex Wright" 196608 '["infrastructure","reliability"]' "2026-04-20"

# === TO DO (4 tasks) ===
create_task "Implement board-level notification preferences" \
  "Each board member should be able to set their notification preferences: email digest frequency, Teams channel alerts, @mention only mode." \
  "${TODO_ID}" 100000002 100000000 "Sarah Chen" 65536 '["governance","notifications"]' "2026-04-10"

create_task "Set up Dataverse row-level security policies" \
  "Configure RLS so users only see data for their organisation. Critical for multi-tenant deployment." \
  "${TODO_ID}" 100000000 100000000 "Graham Hosking" 131072 '["security","dataverse"]' "2026-04-05"

create_task "Wire Signal Monitor to scan email for project updates" \
  "Signal Monitor agent needs to use Work IQ Mail MCP to detect project-related emails and surface as signals in the telemetry blade." \
  "${TODO_ID}" 100000001 100000002 "Marcus Johnson" 196608 '["agent","signal-monitor"]' "2026-04-08"

create_task "Create onboarding flow for new board members" \
  "When a new member is added to a board, send them a welcome email via Work IQ Mail with board summary from Summary Agent." \
  "${TODO_ID}" 100000003 100000001 "Priya Patel" 262144 '["onboarding","agent"]' "2026-04-18"

# === IN PROGRESS (3 tasks) ===
create_task "Build meeting-to-sprint automation pipeline" \
  "End-to-end flow: Teams meeting transcript detected by Webhook MCP → Transcript Analyst extracts action items → Board Manager creates tasks with priorities and assignments → Teams notification sent to team." \
  "${INPROG_ID}" 100000000 100000001 "Graham Hosking" 65536 '["agent","pipeline","flagship"]' "2026-04-03"

create_task "Integrate Calendar MCP for availability-aware assignment" \
  "Board Manager agent should check assignee availability via Work IQ Calendar before suggesting task assignments. Block assignment if person is OOO." \
  "${INPROG_ID}" 100000001 100000002 "Sarah Chen" 131072 '["agent","calendar","smart-assign"]' "2026-04-07"

create_task "Add agent action approval workflow to frontend" \
  "When an agent creates or moves a task, show approval banner. User can approve, reject, or modify the action before it's committed to Dataverse." \
  "${INPROG_ID}" 100000001 100000000 "Marcus Johnson" 196608 '["frontend","approval"]' "2026-04-06"

# === REVIEW (2 tasks) ===
create_task "Implement predictive task completion estimates" \
  "Summary Agent analyses historical velocity data and task complexity to predict completion dates. Show predicted date in TaskDetailPanel with confidence indicator." \
  "${REVIEW_ID}" 100000002 100000003 "Priya Patel" 65536 '["agent","prediction","analytics"]' "2026-04-02"

create_task "Add cross-board dependency visualisation" \
  "When a task on one board blocks tasks on another board, show cross-board dependency links in the telemetry blade with affected task count." \
  "${REVIEW_ID}" 100000002 100000003 "Sarah Chen" 131072 '["frontend","cross-board"]' "2026-04-04"

# === DONE (3 tasks) ===
create_task "Deploy Container Apps for orchestrator and MCP servers" \
  "Deployed 3 Container Apps to Azure: orchestrator (Express + node-cron), MCP delegated (OBO transcripts), MCP webhook (tenant-wide). All healthy on yellowmeadow environment." \
  "${DONE_ID}" 100000001 100000000 "Graham Hosking" 65536 '["infrastructure","deployment"]' "2026-03-20"

create_task "Create Dataverse schema and seed initial data" \
  "Created 9 mc_ tables with all columns, 11 lookup relationships, and seed data (org, project, board, 5 columns). All verified via Azure CLI." \
  "${DONE_ID}" 100000001 100000000 "Graham Hosking" 131072 '["dataverse","schema"]' "2026-03-22"

create_task "Swap all frontend services from mock to Dataverse" \
  "Replaced all 10 service files with Dataverse CRUD wrappers using @microsoft/power-apps/data DataClient. Removed MOCK_USERS. Build passes clean." \
  "${DONE_ID}" 100000002 100000000 "Graham Hosking" 196608 '["frontend","dataverse"]' "2026-03-24"

echo ""
echo "=== Creating Activity Log Entries ==="

create_activity() {
  local action=$1 desc=$2 user=$3
  echo -n "  ${desc:0:50}... "
  az rest --method post --url "${API}/mc_activitylogs" --resource "${DV}" \
    --headers "Content-Type=application/json" \
    --body "{\"mc_action\":${action},\"mc_description\":\"${desc}\",\"mc_actorname\":\"${user}\",\"mc_boardlookup@odata.bind\":\"/mc_boards(${BOARD_ID})\"}" \
    -o none 2>&1 && echo "OK" || echo "SKIP"
  sleep 1
}

# Action: 100000000=created, 100000001=moved, 100000002=updated, 100000003=deleted, 100000004=commented, 100000005=assigned
create_activity 100000000 "Created task: Deploy Container Apps for orchestrator" "Graham Hosking"
create_activity 100000001 "Moved Deploy Container Apps to Done" "Graham Hosking"
create_activity 100000000 "Created task: Create Dataverse schema and seed data" "Graham Hosking"
create_activity 100000001 "Moved Create Dataverse schema to Done" "Graham Hosking"
create_activity 100000000 "Created task: Build meeting-to-sprint pipeline" "Graham Hosking"
create_activity 100000005 "Assigned meeting-to-sprint pipeline to Graham Hosking" "Sarah Chen"
create_activity 100000000 "Created task: Integrate Calendar MCP" "Sarah Chen"
create_activity 100000002 "Updated priority of Dataverse RLS to Critical" "Graham Hosking"
create_activity 100000000 "Created task: Predictive completion estimates" "Priya Patel"
create_activity 100000001 "Moved Predictive completion to Review" "Priya Patel"

echo ""
echo "=== Creating Agent Actions ==="

create_agent_action() {
  local agent=$1 action=$2 status=$3 confidence=$4
  echo -n "  ${agent}: ${action:0:40}... "
  az rest --method post --url "${API}/mc_agentactions" --resource "${DV}" \
    --headers "Content-Type=application/json" \
    --body "{\"mc_agentname\":\"${agent}\",\"mc_actiontype\":\"${action}\",\"mc_status\":${status},\"mc_confidence\":${confidence},\"mc_boardlookup@odata.bind\":\"/mc_boards(${BOARD_ID})\"}" \
    -o none 2>&1 && echo "OK" || echo "SKIP"
  sleep 1
}

# Status: 100000000=pending, 100000001=approved, 100000002=rejected, 100000003=auto-applied
create_agent_action "transcript-analyst" "Extracted 3 action items from Sprint Planning meeting" 100000001 0.92
create_agent_action "board-manager" "Created task: Implement board-level notification preferences" 100000003 0.88
create_agent_action "signal-monitor" "Detected priority escalation in email from stakeholder" 100000000 0.76
create_agent_action "summary-agent" "Generated daily board summary for 25 Mar 2026" 100000003 0.95
create_agent_action "board-manager" "Suggested reassignment of Calendar MCP task to Sarah Chen" 100000001 0.82
create_agent_action "transcript-analyst" "Extracted 5 action items from Client Onboarding call" 100000001 0.89
create_agent_action "signal-monitor" "Detected blocker mention in Teams channel #project-phoenix" 100000000 0.71
create_agent_action "summary-agent" "Predicted completion: meeting-to-sprint pipeline by 3 Apr" 100000003 0.78

echo ""
echo "=== Demo data seeded successfully! ==="
echo "  5 board members"
echo "  15 tasks across 5 columns"
echo "  10 activity log entries"
echo "  8 agent actions"

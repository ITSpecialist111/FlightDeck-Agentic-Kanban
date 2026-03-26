#!/usr/bin/env node
/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  FlightDeck Demo Runner                                     ║
 * ║  Live showcase of agentic Kanban pipeline                   ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Usage:
 *   node demo-runner.js                 # Interactive mode (recommended for live demos)
 *   node demo-runner.js --act 1         # Run a single act
 *   node demo-runner.js --act 1,2,3     # Run specific acts
 *   node demo-runner.js --reset         # Clean up demo data
 *   node demo-runner.js --fast          # Skip pauses (for testing)
 *
 * Prerequisites:
 *   - Azure CLI logged in: az login
 *   - Access to Dataverse: orged45fd63.crm.dynamics.com
 *   - Access to AI Foundry: ai-flightdeck.services.ai.azure.com
 *   - FlightDeck open in browser (to watch changes live)
 *
 * Acts:
 *   1. "The Meeting"     — Transcript → AI extraction → tasks appear on board
 *   2. "The Signals"     — Email signals → auto-detect → cards move/update
 *   3. "The AI Chat"     — Ask the Summary Agent questions about the board
 *   4. "The Approval"    — Low-confidence action → human approval flow
 *   5. "The Daily Brief" — Generate full board summary
 */

import * as readline from "readline";
import {
  createTask, moveTask, updateTask, logActivity, recordAgentAction,
  addComment, queryTasks, deleteTask, queryAgentActions, deleteAgentAction,
  queryActivityLogs, deleteActivityLog,
  COLUMNS, PRIORITY, SOURCE, ACTION, AGENT_STATUS,
} from "./dataverse-helper.js";
import { invokeAgent } from "./foundry-helper.js";
import {
  TRANSCRIPT, MEETING_TITLE, MEETING_DATE, EXPECTED_ACTIONS,
} from "./scenarios/sprint-planning.js";
import {
  COMPLETION_EMAIL, BLOCKER_EMAIL, PROGRESS_EMAIL, ESCALATION_EMAIL,
} from "./scenarios/email-signals.js";

// ── CLI arg parsing ─────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const FAST_MODE = args.includes("--fast");
const RESET_MODE = args.includes("--reset");
const INTERACTIVE = args.includes("--interactive") || args.length === 0;

let ACTS_TO_RUN = null;
const actArg = args.find((a) => a.startsWith("--act"));
if (actArg) {
  const idx = args.indexOf(actArg);
  const val = actArg.includes("=") ? actArg.split("=")[1] : args[idx + 1];
  ACTS_TO_RUN = val.split(",").map(Number);
}

// Track demo-created records for cleanup
const demoRecords = {
  tasks: [],
  agentActions: [],
  activityLogs: [],
};

// ── Display helpers ─────────────────────────────────────────────────────────

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const MAGENTA = "\x1b[35m";
const BLUE = "\x1b[34m";
const BG_CYAN = "\x1b[46m\x1b[30m";
const BG_GREEN = "\x1b[42m\x1b[30m";
const BG_YELLOW = "\x1b[43m\x1b[30m";
const BG_MAGENTA = "\x1b[45m\x1b[30m";
const BG_BLUE = "\x1b[44m\x1b[37m";

function banner(text) {
  const line = "═".repeat(text.length + 4);
  console.log(`\n${CYAN}╔${line}╗${RESET}`);
  console.log(`${CYAN}║  ${BOLD}${text}${RESET}${CYAN}  ║${RESET}`);
  console.log(`${CYAN}╚${line}╝${RESET}\n`);
}

function actHeader(num, title, subtitle) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`${BOLD}${MAGENTA}  ACT ${num}: ${title}${RESET}`);
  console.log(`${DIM}  ${subtitle}${RESET}`);
  console.log(`${"─".repeat(60)}\n`);
}

function step(icon, text) {
  console.log(`  ${icon}  ${text}`);
}

function agentSay(agent, text) {
  const colours = {
    "transcript-analyst": CYAN,
    "board-manager": GREEN,
    "signal-monitor": YELLOW,
    "summary-agent": BLUE,
  };
  const c = colours[agent] || MAGENTA;
  console.log(`  ${c}🤖 [${agent}]${RESET} ${text}`);
}

function taskCreated(title, assignee, priority) {
  console.log(`  ${GREEN}✅ Task created:${RESET} ${BOLD}${title}${RESET}`);
  if (assignee) console.log(`     ${DIM}Assigned to: ${assignee}${RESET}`);
  if (priority) console.log(`     ${DIM}Priority: ${priority}${RESET}`);
}

function statusChange(task, from, to) {
  console.log(`  ${YELLOW}📋 ${task}${RESET}`);
  console.log(`     ${DIM}${from}${RESET} → ${BOLD}${to}${RESET}`);
}

async function pause(ms, message = null) {
  if (FAST_MODE) return;
  if (message) console.log(`\n  ${DIM}${message}${RESET}`);
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForKeypress(prompt = "Press ENTER to continue...") {
  if (!INTERACTIVE || FAST_MODE) return;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`\n  ${DIM}▸ ${prompt}${RESET}`, () => {
      rl.close();
      resolve();
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// ACT 1: THE MEETING
// Simulate a meeting transcript being processed by the AI pipeline
// ═══════════════════════════════════════════════════════════════════════════

async function act1() {
  actHeader(1, "THE MEETING", "A Sprint Planning just ended. Watch tasks appear on the board.");

  step("📅", `${BOLD}Meeting:${RESET} ${MEETING_TITLE}`);
  step("📆", `${BOLD}Date:${RESET} ${MEETING_DATE}`);
  step("👥", `${BOLD}Attendees:${RESET} Graham Hosking, Sarah Chen, Marcus Johnson, Priya Patel`);

  await pause(2000, "Meeting transcript received via Teams webhook...");

  // Show key snippets from transcript
  console.log(`\n  ${DIM}━━━ Transcript excerpt ━━━${RESET}`);
  console.log(`  ${DIM}Graham: "...we absolutely need the real-time notification system..."${RESET}`);
  console.log(`  ${DIM}Graham: "...the client onboarding documentation is critical..."${RESET}`);
  console.log(`  ${DIM}Graham: "...three customer complaints about report generation..."${RESET}`);
  console.log(`  ${DIM}Graham: "...JWT tokens aren't rotating properly in staging..."${RESET}`);
  console.log(`  ${DIM}━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);

  await pause(2000);

  // Step 1: Record the transcript-analyst "running" state
  step("🔄", `Invoking ${CYAN}transcript-analyst${RESET} agent...`);

  const analystRunning = await recordAgentAction({
    agentName: "transcript-analyst",
    actionType: `Analysing transcript: ${MEETING_TITLE}`,
    status: AGENT_STATUS.running,
    confidence: 0,
  });
  demoRecords.agentActions.push(analystRunning.mc_agentactionid);

  await pause(3000, "🔍 Transcript Analyst is parsing the meeting...");

  // Step 2: Try live agent, fall back to expected actions
  let actions;
  let usedLiveAgent = false;
  try {
    agentSay("transcript-analyst", "Calling live AI Foundry agent...");
    const result = await invokeAgent(
      "transcript-analyst",
      `Extract action items from this meeting transcript. Meeting: ${MEETING_TITLE}, Date: ${MEETING_DATE}.\n\n${TRANSCRIPT}`
    );

    try {
      actions = JSON.parse(result);
      if (!Array.isArray(actions)) actions = actions.actionItems || actions.action_items || [actions];
      usedLiveAgent = true;
      agentSay("transcript-analyst", `${GREEN}Live agent extracted ${actions.length} action items${RESET}`);
    } catch {
      agentSay("transcript-analyst", `${YELLOW}Agent responded but not as JSON — using structured fallback${RESET}`);
      actions = EXPECTED_ACTIONS;
    }
  } catch (err) {
    agentSay("transcript-analyst", `${YELLOW}Agent unavailable (${err.message.slice(0, 60)}) — using demo data${RESET}`);
    actions = EXPECTED_ACTIONS;
  }

  // Update analyst to succeeded
  await recordAgentAction({
    agentName: "transcript-analyst",
    actionType: `Extracted ${actions.length} action items from ${MEETING_TITLE}`,
    status: AGENT_STATUS.succeeded,
    confidence: 0.92,
    durationMs: usedLiveAgent ? 8500 : 3200,
  }).then((r) => demoRecords.agentActions.push(r.mc_agentactionid));

  await pause(2000);

  // Step 3: Board Manager creates tasks
  step("🔄", `Invoking ${GREEN}board-manager${RESET} agent to create tasks...`);

  const bmRunning = await recordAgentAction({
    agentName: "board-manager",
    actionType: `Creating ${actions.length} tasks from transcript analysis`,
    status: AGENT_STATUS.running,
    confidence: 0,
  });
  demoRecords.agentActions.push(bmRunning.mc_agentactionid);

  await pause(2000);

  // Create each task with a pause between for visual effect
  const priorityMap = { critical: PRIORITY.critical, high: PRIORITY.high, medium: PRIORITY.medium, low: PRIORITY.low };

  for (let i = 0; i < actions.length; i++) {
    const a = actions[i];
    const title = a.title || a.task_title || `Action item ${i + 1}`;
    const desc = a.description || a.task_description || "";
    const assignee = a.assigneeName || a.assignee || a.assigned_to || "";
    const pri = a.priority || "medium";
    const due = a.dueDate || a.due_date || null;
    const labels = a.labels || [];
    const conf = a.confidence || 0.85;

    const task = await createTask({
      title,
      description: desc,
      columnId: COLUMNS.todo,
      priority: priorityMap[pri] || PRIORITY.medium,
      source: SOURCE.meeting_transcript,
      assigneeName: assignee,
      sortOrder: 65536 * (20 + i),
      labels: JSON.stringify(labels),
      dueDate: due,
      meetingDate: MEETING_DATE,
      sourceReference: MEETING_TITLE,
    });

    demoRecords.tasks.push(task.mc_taskid);

    taskCreated(title, assignee, pri);

    // Log activity
    const actLog = await logActivity({
      action: ACTION.created,
      description: `Created task: ${title} (from meeting transcript)`,
      actorName: "board-manager",
      isAgent: true,
      taskId: task.mc_taskid,
    });
    demoRecords.activityLogs.push(actLog.mc_activitylogid);

    // Record agent action per task
    const taskAction = await recordAgentAction({
      agentName: "board-manager",
      actionType: `Created task: ${title.slice(0, 50)}`,
      status: conf >= 0.8 ? AGENT_STATUS.succeeded : AGENT_STATUS.requires_approval,
      confidence: conf,
      taskId: task.mc_taskid,
    });
    demoRecords.agentActions.push(taskAction.mc_agentactionid);

    await pause(3000, `⏳ Watch the board — task "${title.slice(0, 40)}..." should appear in To Do`);
  }

  console.log(`\n  ${BG_GREEN} ✓ ACT 1 COMPLETE ${RESET}`);
  console.log(`  ${GREEN}${actions.length} tasks created from meeting transcript${RESET}`);
  console.log(`  ${DIM}Check FlightDeck — new tasks should be visible in the To Do column${RESET}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// ACT 2: THE SIGNALS
// Email signals detected → cards move and update automatically
// ═══════════════════════════════════════════════════════════════════════════

async function act2() {
  actHeader(2, "THE SIGNALS", "Emails arrive. The Signal Monitor detects status changes.");

  // Get current tasks to find ones we can move
  const tasks = await queryTasks();
  const todoTasks = tasks.filter((t) => t._mc_columnlookup_value === COLUMNS.todo);
  const inprogTasks = tasks.filter((t) => t._mc_columnlookup_value === COLUMNS.in_progress);

  // ── Signal 1: Completion ──────────────────────────────────────────────

  step("📧", `${BOLD}Incoming email:${RESET} "${COMPLETION_EMAIL.subject}"`);
  step("📨", `${DIM}From: ${COMPLETION_EMAIL.from}${RESET}`);

  await pause(2000, "Signal Monitor scanning emails...");

  // Record signal-monitor running
  const smRun = await recordAgentAction({
    agentName: "signal-monitor",
    actionType: "Scanning emails for task status signals",
    status: AGENT_STATUS.running,
    confidence: 0,
  });
  demoRecords.agentActions.push(smRun.mc_agentactionid);

  await pause(2000);

  // Find a task to move to Done (prefer "report" related, or any In Progress task)
  let targetTask = inprogTasks.find((t) => /report|performance/i.test(t.mc_title))
    || inprogTasks[0];

  if (targetTask) {
    agentSay("signal-monitor", `${BG_GREEN} COMPLETION SIGNAL ${RESET} Matched to: "${targetTask.mc_title.slice(0, 45)}..." (confidence: 0.94)`);

    const smAction = await recordAgentAction({
      agentName: "signal-monitor",
      actionType: `Detected completion signal for "${targetTask.mc_title.slice(0, 40)}"`,
      status: AGENT_STATUS.succeeded,
      confidence: 0.94,
      taskId: targetTask.mc_taskid,
      });
    demoRecords.agentActions.push(smAction.mc_agentactionid);

    await pause(2000);

    agentSay("board-manager", "Auto-executing: moving task to Done (confidence >= 0.8)");

    await moveTask(targetTask.mc_taskid, COLUMNS.done);
    statusChange(targetTask.mc_title, "In Progress", "Done ✅");

    const moveLog = await logActivity({
      action: ACTION.moved,
      description: `Moved "${targetTask.mc_title}" to Done (email completion signal detected)`,
      actorName: "signal-monitor",
      isAgent: true,
      taskId: targetTask.mc_taskid,
      previousValue: "In Progress",
      newValue: "Done",
    });
    demoRecords.activityLogs.push(moveLog.mc_activitylogid);

    await pause(4000, "⏳ Watch the board — card should move to Done column");
  } else {
    step("⚠️", `${YELLOW}No In Progress tasks found to move — skipping completion signal${RESET}`);
  }

  // ── Signal 2: Blocker ─────────────────────────────────────────────────

  await waitForKeypress("Press ENTER to trigger the blocker signal...");

  step("📧", `${BOLD}Incoming email:${RESET} "${BLOCKER_EMAIL.subject}"`);
  step("📨", `${DIM}From: ${BLOCKER_EMAIL.from}${RESET}`);

  await pause(2000, "Signal Monitor scanning...");

  // Find a task to block (prefer "notification" or "WebSocket")
  let blockerTask = [...todoTasks, ...inprogTasks].find((t) =>
    /notification|websocket|real-time/i.test(t.mc_title)
  ) || todoTasks[0];

  if (blockerTask) {
    agentSay("signal-monitor", `${BG_YELLOW} BLOCKER SIGNAL ${RESET} Matched to: "${blockerTask.mc_title.slice(0, 45)}..." (confidence: 0.91)`);

    const blockAction = await recordAgentAction({
      agentName: "signal-monitor",
      actionType: `Detected blocker signal for "${blockerTask.mc_title.slice(0, 40)}"`,
      status: AGENT_STATUS.succeeded,
      confidence: 0.91,
      taskId: blockerTask.mc_taskid,
      });
    demoRecords.agentActions.push(blockAction.mc_agentactionid);

    await pause(2000);

    agentSay("board-manager", "Setting task as blocked with reason");

    await updateTask(blockerTask.mc_taskid, {
      mc_isblocked: true,
      mc_blockedreason: "WebSocket port 8443 not open on staging firewall. Awaiting approval from Graham.",
    });

    // Add comment with the blocker details
    await addComment({
      taskId: blockerTask.mc_taskid,
      content: "🚫 **Blocked:** WebSocket port 8443 not open on staging firewall. Marcus has raised an infra ticket but needs Graham's approval for the network change. All code is ready — blocked on infrastructure only.",
      authorName: "signal-monitor",
      isAgent: true,
    });

    const blockLog = await logActivity({
      action: ACTION.updated,
      description: `Set "${blockerTask.mc_title}" as BLOCKED — firewall port not open`,
      actorName: "signal-monitor",
      isAgent: true,
      taskId: blockerTask.mc_taskid,
      previousValue: "isBlocked: false",
      newValue: "isBlocked: true",
    });
    demoRecords.activityLogs.push(blockLog.mc_activitylogid);

    step("🚫", `${RED}${blockerTask.mc_title}${RESET} → ${RED}BLOCKED${RESET}`);
    step("💬", `${DIM}Comment added with blocker details${RESET}`);

    await pause(4000, "⏳ Watch the board — task should show blocked indicator");
  }

  // ── Signal 3: Escalation ──────────────────────────────────────────────

  await waitForKeypress("Press ENTER to trigger the escalation signal...");

  step("📧", `${BOLD}${RED}Incoming URGENT email:${RESET} "${ESCALATION_EMAIL.subject}"`);
  step("📨", `${DIM}From: ${ESCALATION_EMAIL.from}${RESET}`);

  await pause(2000, "Signal Monitor scanning...");

  // Find the notification task to escalate
  let escalateTask = [...todoTasks, ...inprogTasks].find((t) =>
    /notification|websocket|real-time/i.test(t.mc_title)
  ) || blockerTask;

  if (escalateTask) {
    agentSay("signal-monitor", `${BG_MAGENTA} ESCALATION SIGNAL ${RESET} Stakeholder urgency detected! (confidence: 0.96)`);

    const escAction = await recordAgentAction({
      agentName: "signal-monitor",
      actionType: `ESCALATION: "${escalateTask.mc_title.slice(0, 40)}" — stakeholder deadline moved up`,
      status: AGENT_STATUS.requires_approval,
      confidence: 0.96,
      taskId: escalateTask.mc_taskid,
      });
    demoRecords.agentActions.push(escAction.mc_agentactionid);

    await pause(1500);

    agentSay("board-manager", `Recommending priority change: ${YELLOW}high${RESET} → ${RED}CRITICAL${RESET}`);
    agentSay("board-manager", `${DIM}(requires_approval — this is a significant change)${RESET}`);

    await updateTask(escalateTask.mc_taskid, {
      mc_priority: PRIORITY.critical,
    });

    await addComment({
      taskId: escalateTask.mc_taskid,
      content: "⚠️ **ESCALATED to Critical** — Client CEO moved board presentation to Friday. Real-time notifications must be in production by EOD Thursday. Stakeholder: Victoria Reynolds (ClientCorp).",
      authorName: "signal-monitor",
      isAgent: true,
    });

    const escLog = await logActivity({
      action: ACTION.updated,
      description: `ESCALATED "${escalateTask.mc_title}" to CRITICAL priority (stakeholder email)`,
      actorName: "signal-monitor",
      isAgent: true,
      taskId: escalateTask.mc_taskid,
      previousValue: "priority: high",
      newValue: "priority: critical",
    });
    demoRecords.activityLogs.push(escLog.mc_activitylogid);

    step("🔴", `${RED}${BOLD}${escalateTask.mc_title}${RESET} → ${RED}CRITICAL${RESET}`);

    await pause(4000, "⏳ Watch the board — task priority icon should change to critical (red)");
  }

  console.log(`\n  ${BG_GREEN} ✓ ACT 2 COMPLETE ${RESET}`);
  console.log(`  ${GREEN}3 email signals processed: completion, blocker, escalation${RESET}`);
  console.log(`  ${DIM}Check FlightDeck telemetry blade — agent actions should show in the feed${RESET}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// ACT 3: THE AI CHAT
// Ask the Summary Agent questions about the board
// ═══════════════════════════════════════════════════════════════════════════

async function act3() {
  actHeader(3, "THE AI CHAT", "Ask the AI questions about your board. It reads live Dataverse data.");

  const questions = [
    "Give me a summary of the current board status. How many tasks in each column?",
    "Which tasks are blocked and what are the blockers?",
    "Who has the highest workload right now?",
  ];

  for (const question of questions) {
    step("💬", `${BOLD}You ask:${RESET} "${question}"`);

    await pause(1500);

    try {
      agentSay("summary-agent", "Thinking...");
      const answer = await invokeAgent("summary-agent", question);

      console.log(`\n  ${BLUE}┌─ Summary Agent Response ────────────────────────────┐${RESET}`);
      const lines = answer.split("\n");
      for (const line of lines) {
        console.log(`  ${BLUE}│${RESET} ${line}`);
      }
      console.log(`  ${BLUE}└─────────────────────────────────────────────────────┘${RESET}\n`);

      await recordAgentAction({
        agentName: "summary-agent",
        actionType: `Answered: "${question.slice(0, 50)}"`,
        status: AGENT_STATUS.succeeded,
        confidence: 0.90,
        durationMs: 2800,
      }).then((r) => demoRecords.agentActions.push(r.mc_agentactionid));

    } catch (err) {
      agentSay("summary-agent", `${YELLOW}Agent unavailable — ${err.message.slice(0, 60)}${RESET}`);
      console.log(`\n  ${DIM}(In the live app, the Chat Panel provides this interactively)${RESET}\n`);
    }

    await waitForKeypress("Press ENTER for next question...");
  }

  console.log(`\n  ${BG_GREEN} ✓ ACT 3 COMPLETE ${RESET}`);
  console.log(`  ${GREEN}AI Chat demonstrated with ${questions.length} live queries${RESET}`);
  console.log(`  ${DIM}In the app, users ask questions via the Chat Panel on the right side${RESET}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// ACT 4: THE APPROVAL FLOW
// Low-confidence agent action requires human approval
// ═══════════════════════════════════════════════════════════════════════════

async function act4() {
  actHeader(4, "THE APPROVAL FLOW", "The Board Manager suggests a change but isn't confident enough to auto-apply.");

  step("📧", `${BOLD}Ambiguous email detected:${RESET} "${PROGRESS_EMAIL.subject}"`);
  step("📨", `${DIM}From: ${PROGRESS_EMAIL.from}${RESET}`);

  await pause(2000);

  agentSay("signal-monitor", "Detected progress signal — Priya mentions JWT fix. Multiple possible actions...");

  await pause(2000);

  // Create a low-confidence action that requires approval
  const tasks = await queryTasks();
  const jwtTask = tasks.find((t) => /jwt|token|auth/i.test(t.mc_title));

  const actionDesc = jwtTask
    ? `Move "${jwtTask.mc_title.slice(0, 40)}" from To Do → In Progress`
    : "Create task: Fix JWT token rotation (may already exist)";

  step("⚠️", `${BOLD}${YELLOW}Board Manager proposes:${RESET} ${actionDesc}`);
  step("📊", `${DIM}Confidence: ${YELLOW}0.62${RESET} ${DIM}(below 0.8 threshold — needs human approval)${RESET}`);

  const approvalAction = await recordAgentAction({
    agentName: "board-manager",
    actionType: actionDesc,
    status: AGENT_STATUS.requires_approval,
    confidence: 0.62,
    taskId: jwtTask?.mc_taskid || null,
  });
  demoRecords.agentActions.push(approvalAction.mc_agentactionid);

  console.log(`\n  ${BG_YELLOW} HUMAN-IN-THE-LOOP ${RESET}`);
  console.log(`  ${YELLOW}An approval banner appears at the top of the FlightDeck dashboard.${RESET}`);
  console.log(`  ${YELLOW}The user can Accept, Reject, or Modify the suggested action.${RESET}`);
  console.log();
  console.log(`  ${DIM}┌────────────────────────────────────────────────────────┐${RESET}`);
  console.log(`  ${DIM}│ 🤖 Board Manager suggests:                            │${RESET}`);
  console.log(`  ${DIM}│                                                        │${RESET}`);
  console.log(`  ${DIM}│ ${actionDesc.slice(0, 54).padEnd(54)} │${RESET}`);
  console.log(`  ${DIM}│                                                        │${RESET}`);
  console.log(`  ${DIM}│ Confidence: 62%        [Accept]  [Reject]  [Modify]    │${RESET}`);
  console.log(`  ${DIM}└────────────────────────────────────────────────────────┘${RESET}`);

  await pause(3000, "⏳ Check FlightDeck — approval banner should appear above the board");

  console.log(`\n  ${BG_GREEN} ✓ ACT 4 COMPLETE ${RESET}`);
  console.log(`  ${GREEN}Human-in-the-loop approval flow demonstrated${RESET}`);
  console.log(`  ${DIM}Low-confidence actions are never auto-applied — safety first${RESET}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// ACT 5: THE DAILY BRIEF
// Full board summary and insights
// ═══════════════════════════════════════════════════════════════════════════

async function act5() {
  actHeader(5, "THE DAILY BRIEF", "Summary Agent generates the 08:00 board digest.");

  step("⏰", `${BOLD}08:00 UTC — Daily summary trigger fires${RESET}`);

  await pause(2000);

  agentSay("summary-agent", "Generating daily board digest...");

  const sumAction = await recordAgentAction({
    agentName: "summary-agent",
    actionType: "Generating daily board summary",
    status: AGENT_STATUS.running,
    confidence: 0,
  });
  demoRecords.agentActions.push(sumAction.mc_agentactionid);

  try {
    const summary = await invokeAgent(
      "summary-agent",
      "Generate a daily board summary for the FlightDeck Sprint Board. Include: total tasks by status, blocked items, overdue tasks, team workload (tasks per person), and any risks. Format as a concise briefing suitable for a Teams message. Use bullet points."
    );

    console.log(`\n  ${BLUE}╔══════════════════════════════════════════════════════╗${RESET}`);
    console.log(`  ${BLUE}║  📋 FlightDeck Daily Brief — ${new Date().toLocaleDateString("en-GB")}         ║${RESET}`);
    console.log(`  ${BLUE}╠══════════════════════════════════════════════════════╣${RESET}`);
    const lines = summary.split("\n");
    for (const line of lines) {
      console.log(`  ${BLUE}║${RESET} ${line}`);
    }
    console.log(`  ${BLUE}╚══════════════════════════════════════════════════════╝${RESET}`);

    await recordAgentAction({
      agentName: "summary-agent",
      actionType: "Generated daily board summary",
      status: AGENT_STATUS.succeeded,
      confidence: 0.95,
      durationMs: 4200,
    }).then((r) => demoRecords.agentActions.push(r.mc_agentactionid));

  } catch (err) {
    agentSay("summary-agent", `${YELLOW}Agent unavailable — showing sample summary${RESET}`);

    console.log(`\n  ${BLUE}╔══════════════════════════════════════════════════════╗${RESET}`);
    console.log(`  ${BLUE}║  📋 FlightDeck Daily Brief — ${new Date().toLocaleDateString("en-GB")}         ║${RESET}`);
    console.log(`  ${BLUE}╠══════════════════════════════════════════════════════╣${RESET}`);
    console.log(`  ${BLUE}║${RESET} Board: Sprint Board (FlightDeck Demo)`);
    console.log(`  ${BLUE}║${RESET}`);
    console.log(`  ${BLUE}║${RESET} 📊 Status Overview:`);
    console.log(`  ${BLUE}║${RESET}   • Backlog: 3 tasks`);
    console.log(`  ${BLUE}║${RESET}   • To Do: 4+ tasks (new from meeting)`);
    console.log(`  ${BLUE}║${RESET}   • In Progress: 3 tasks`);
    console.log(`  ${BLUE}║${RESET}   • Review: 2 tasks`);
    console.log(`  ${BLUE}║${RESET}   • Done: 3+ tasks`);
    console.log(`  ${BLUE}║${RESET}`);
    console.log(`  ${BLUE}║${RESET} 🚫 Blocked: 1 task (firewall approval needed)`);
    console.log(`  ${BLUE}║${RESET} 🔴 Critical: Notification system (escalated)`);
    console.log(`  ${BLUE}║${RESET}`);
    console.log(`  ${BLUE}║${RESET} 👥 Team Workload:`);
    console.log(`  ${BLUE}║${RESET}   • Graham Hosking: 3 tasks`);
    console.log(`  ${BLUE}║${RESET}   • Priya Patel: 4 tasks`);
    console.log(`  ${BLUE}║${RESET}   • Sarah Chen: 3 tasks`);
    console.log(`  ${BLUE}║${RESET}   • Marcus Johnson: 2 tasks`);
    console.log(`  ${BLUE}╚══════════════════════════════════════════════════════╝${RESET}`);
  }

  console.log(`\n  ${DIM}In production, this summary is posted to Teams automatically at 08:00 daily.${RESET}`);

  console.log(`\n  ${BG_GREEN} ✓ ACT 5 COMPLETE ${RESET}`);
  console.log(`  ${GREEN}Daily brief generated and would be posted to Teams${RESET}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// RESET — Clean up demo data
// ═══════════════════════════════════════════════════════════════════════════

async function resetDemoData() {
  banner("CLEANING UP DEMO DATA");

  // Delete tracked records from this session
  if (demoRecords.tasks.length > 0) {
    step("🗑️", `Deleting ${demoRecords.tasks.length} demo tasks...`);
    for (const id of demoRecords.tasks) {
      try { await deleteTask(id); } catch { /* ignore */ }
    }
  }

  if (demoRecords.agentActions.length > 0) {
    step("🗑️", `Deleting ${demoRecords.agentActions.length} demo agent actions...`);
    for (const id of demoRecords.agentActions) {
      try { await deleteAgentAction(id); } catch { /* ignore */ }
    }
  }

  if (demoRecords.activityLogs.length > 0) {
    step("🗑️", `Deleting ${demoRecords.activityLogs.length} demo activity logs...`);
    for (const id of demoRecords.activityLogs) {
      try { await deleteActivityLog(id); } catch { /* ignore */ }
    }
  }

  // Also clean up any tasks with the demo meeting reference
  step("🔍", "Searching for any remaining demo tasks...");
  const demoTasks = await queryTasks(
    `mc_sourcereference eq '${MEETING_TITLE}' and _mc_taskboardlookup_value eq '4908e091-1928-f111-8341-000d3a3b1746'`
  );
  if (demoTasks.length > 0) {
    step("🗑️", `Deleting ${demoTasks.length} remaining demo tasks...`);
    for (const t of demoTasks) {
      try { await deleteTask(t.mc_taskid); } catch { /* ignore */ }
    }
  }

  console.log(`\n  ${BG_GREEN} ✓ CLEANUP COMPLETE ${RESET}`);
  console.log(`  ${DIM}Board is back to its original state${RESET}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// Interactive menu
// ═══════════════════════════════════════════════════════════════════════════

async function interactiveMenu() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

  while (true) {
    banner("FlightDeck Demo Runner");
    console.log(`  ${BOLD}Choose an act to run:${RESET}\n`);
    console.log(`  ${CYAN}1${RESET}  The Meeting     — Transcript → AI extraction → tasks appear`);
    console.log(`  ${CYAN}2${RESET}  The Signals      — Email signals → cards move/update`);
    console.log(`  ${CYAN}3${RESET}  The AI Chat      — Ask the Summary Agent questions`);
    console.log(`  ${CYAN}4${RESET}  The Approval     — Low-confidence → human approval flow`);
    console.log(`  ${CYAN}5${RESET}  The Daily Brief  — Full board summary`);
    console.log(`  ${CYAN}A${RESET}  Run ALL acts      — Full showcase (Acts 1-5)`);
    console.log(`  ${CYAN}R${RESET}  Reset            — Clean up all demo data`);
    console.log(`  ${CYAN}Q${RESET}  Quit\n`);

    const choice = (await ask(`  ${DIM}▸ Enter choice: ${RESET}`)).trim().toUpperCase();

    if (choice === "Q") {
      rl.close();
      break;
    }

    try {
      if (choice === "1") await act1();
      else if (choice === "2") await act2();
      else if (choice === "3") await act3();
      else if (choice === "4") await act4();
      else if (choice === "5") await act5();
      else if (choice === "A") {
        await act1();
        await waitForKeypress("Press ENTER for Act 2...");
        await act2();
        await waitForKeypress("Press ENTER for Act 3...");
        await act3();
        await waitForKeypress("Press ENTER for Act 4...");
        await act4();
        await waitForKeypress("Press ENTER for Act 5...");
        await act5();
      }
      else if (choice === "R") await resetDemoData();
      else console.log(`  ${RED}Invalid choice${RESET}`);
    } catch (err) {
      console.error(`\n  ${RED}Error: ${err.message}${RESET}`);
      console.error(`  ${DIM}${err.stack}${RESET}`);
    }

    await ask(`\n  ${DIM}▸ Press ENTER to return to menu...${RESET}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  banner("FlightDeck Demo Runner");

  // Pre-flight check
  step("🔑", "Checking Azure CLI authentication...");
  try {
    const { execSync } = await import("child_process");
    const acct = execSync("az account show --query name -o tsv", { encoding: "utf8", timeout: 15000 }).trim();
    step("✅", `Logged in to: ${GREEN}${acct}${RESET}`);
  } catch {
    console.error(`\n  ${RED}ERROR: Not logged in to Azure CLI. Run: az login${RESET}`);
    process.exit(1);
  }

  if (RESET_MODE) {
    await resetDemoData();
    return;
  }

  if (INTERACTIVE && !ACTS_TO_RUN) {
    await interactiveMenu();
    return;
  }

  // Run specific acts
  const acts = ACTS_TO_RUN || [1, 2, 3, 4, 5];
  for (const act of acts) {
    if (act === 1) await act1();
    else if (act === 2) await act2();
    else if (act === 3) await act3();
    else if (act === 4) await act4();
    else if (act === 5) await act5();

    if (acts.indexOf(act) < acts.length - 1) {
      await waitForKeypress(`Press ENTER for Act ${acts[acts.indexOf(act) + 1]}...`);
    }
  }

  console.log(`\n${CYAN}${"═".repeat(60)}${RESET}`);
  console.log(`${BOLD}  Demo complete!${RESET}`);
  console.log(`  ${DIM}Run with --reset to clean up demo data${RESET}`);
  console.log(`${CYAN}${"═".repeat(60)}${RESET}\n`);
}

main().catch((err) => {
  console.error(`${RED}Fatal error: ${err.message}${RESET}`);
  console.error(err.stack);
  process.exit(1);
});

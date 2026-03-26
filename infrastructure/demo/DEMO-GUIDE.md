# FlightDeck Demo — Presenter Guide

## Quick Start

```bash
cd infrastructure/demo
npm install
node demo-runner.js          # Interactive menu (recommended)
```

## Prerequisites

1. **Azure CLI** — logged in with access to the Dataverse environment and AI Foundry
   ```bash
   az login
   az account set --subscription "260948a4-1d5e-42c8-b095-33a6641ad189"
   ```

2. **FlightDeck open in browser** — the board polls every 15 seconds, so changes appear automatically. Use Ctrl+Shift+R to hard refresh if needed.

3. **Two screens** (recommended) — terminal on one, FlightDeck board on the other.

---

## The Five Acts

### Act 1: "The Meeting" (3-4 min)

**What happens:** A Teams Sprint Planning meeting just ended. The transcript is captured, fed to the Transcript Analyst AI agent, which extracts action items. The Board Manager agent then creates tasks on the board.

**What to say:**
> "A Sprint Planning meeting just ended on Teams. FlightDeck automatically captures the transcript and feeds it to our Transcript Analyst agent. Watch the board — you'll see tasks start appearing in the To Do column in real time."

**What to watch for:**
- Agent Action Feed in the telemetry blade shows "transcript-analyst: Analysing..."
- Tasks appear one by one in the To Do column
- Each task has the correct assignee, priority, labels, and due date — all extracted by AI
- The meeting title is tracked as the source reference

**Talking points:**
- "No one had to manually create a single task"
- "The AI understood who committed to what, and assigned priorities based on the language used"
- "Every task links back to the source meeting for full traceability"

---

### Act 2: "The Signals" (4-5 min)

**What happens:** Three emails arrive. The Signal Monitor agent scans them and detects status changes, then automatically updates the board.

**Three signals demonstrated:**

1. **Completion** — Sarah sends an email saying the report fix is done → card moves to Done
2. **Blocker** — Marcus reports a firewall issue blocking WebSockets → card gets blocked indicator
3. **Escalation** — Client sends urgent email → task priority escalated to Critical

**What to say:**
> "Now let's see what happens when people communicate via email. Marcus sends an email saying he's blocked on a firewall issue. Watch the board — FlightDeck detects the blocker signal and automatically flags the task."

**What to watch for:**
- Cards physically moving between columns on the board
- Blocked tasks showing the blocked indicator (red border)
- Priority icons changing colour when escalated
- Agent Action Feed updating in real time
- Comments auto-added to tasks with signal details

**Talking points:**
- "The Signal Monitor reads email context — not just keywords, but intent"
- "High confidence signals (>80%) are auto-applied, low confidence ones go to the approval queue"
- "Every automated action is logged with full audit trail"

---

### Act 3: "The AI Chat" (2-3 min)

**What happens:** We ask the Summary Agent questions about the board and it responds with live data from Dataverse.

**What to say:**
> "Need a quick status check? Just ask the AI. It reads the live board data and gives you an instant answer."

**Demo questions:**
1. "Give me a summary of the current board status"
2. "Which tasks are blocked and what are the blockers?"
3. "Who has the highest workload right now?"

**Talking points:**
- "Natural language queries — no dashboards to navigate, no filters to set"
- "The AI reads live Dataverse data, not cached summaries"
- "In the app, this is available via the Chat Panel on the right side"

---

### Act 4: "The Approval Flow" (1-2 min)

**What happens:** The Board Manager proposes an action but with low confidence (62%). Instead of auto-applying, it creates an approval banner.

**What to say:**
> "Not all AI decisions are created equal. When the confidence score is below 80%, FlightDeck won't auto-apply the change. Instead, it puts it in front of a human for approval."

**What to watch for:**
- Approval banner appears at the top of the dashboard
- Shows the proposed action, confidence score, and Accept/Reject/Modify buttons

**Talking points:**
- "Human-in-the-loop is fundamental to responsible AI"
- "The 80% threshold is configurable per board"
- "Every approval and rejection is logged for audit trail"

---

### Act 5: "The Daily Brief" (2-3 min)

**What happens:** The Summary Agent generates a full board digest — the same report that's automatically posted to Teams at 08:00 daily.

**What to say:**
> "Every morning at 8am, FlightDeck generates a board digest and posts it to your Teams channel. Let me trigger one now so you can see what it looks like."

**What to watch for:**
- Structured summary with task counts by status
- Blocked items highlighted
- Team workload breakdown
- Risk assessment

**Talking points:**
- "No one has to ask 'what's the status?' — the AI tells you proactively"
- "Sprint velocity, overdue tasks, and risk flags — all automated"
- "In production this goes straight to Teams via the Work IQ MCP"

---

## Command Reference

```bash
# Interactive menu (best for live demos)
node demo-runner.js

# Run specific acts
node demo-runner.js --act 1
node demo-runner.js --act 1,2
node demo-runner.js --act 3,5

# Run all acts sequentially
node demo-runner.js --act 1,2,3,4,5

# Skip pauses (for testing)
node demo-runner.js --fast

# Clean up all demo data
node demo-runner.js --reset
```

## Cleanup

After the demo, run reset to remove all demo-created tasks, agent actions, and activity logs:

```bash
node demo-runner.js --reset
```

This restores the board to its pre-demo state.

## Troubleshooting

| Issue | Fix |
|---|---|
| "Not logged in to Azure CLI" | Run `az login` and set subscription |
| Agent calls fail | Agents may not be deployed yet — demo uses fallback data |
| Tasks don't appear on board | Hard refresh FlightDeck (Ctrl+Shift+R); check polling (15s) |
| "No In Progress tasks found" | Run Act 1 first to create tasks, or the board needs seed data |
| Permission errors on Dataverse | Check az login is using correct account (`admin@ABSx02771022...`) |

## Architecture During Demo

```
Terminal (demo-runner.js)
    │
    ├── az CLI → Dataverse Web API  (creates tasks, logs activities)
    │                                    │
    │                                    ▼
    │                           FlightDeck UI polls ──→ Board updates live
    │
    └── az CLI → AI Foundry REST   (invokes agents for live responses)
```

The demo runner writes directly to Dataverse using the same Web API that the agents use in production. The FlightDeck UI picks up changes via its standard 15-second TanStack Query polling cycle.

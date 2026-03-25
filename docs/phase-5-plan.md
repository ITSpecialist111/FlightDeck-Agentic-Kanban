# FlightDeck — Phase 5 Plan: AI Chat + Governance + Production

## Vision

Phase 5 transforms FlightDeck from a visual Kanban board with background agents into a **fully conversational, self-evolving work intelligence system**. The board doesn't just display tasks — it actively reasons about work, monitors signals across the entire M365 ecosystem via Work IQ MCP servers, and dynamically adapts its own structure based on what it learns.

This is what makes FlightDeck one-of-a-kind: **the plan itself is agentic**. It builds itself from meetings, evolves from email signals, and reshapes dynamically as the Signal Monitor detects changes in priorities, blockers, and completions. No other tool does this.

---

## Architecture: The Complete Agent Mesh

```
┌──────────────────────────────────────────────────────────────────────┐
│  FlightDeck React SPA (Power Apps Code App)                          │
│  ┌──────┬──────────────────┬──────────┬──────────────────────┐      │
│  │ Side │  Kanban Board    │ AI Chat  │  Telemetry           │      │
│  │ bar  │  + Approval      │ Panel    │  Blade               │      │
│  │      │  Banner          │ (direct  │                      │      │
│  │      │                  │  Foundry)│                      │      │
│  └──────┴──────────────────┴──────────┴──────────────────────┘      │
├──────────────────────────────────────────────────────────────────────┤
│  Service Layer → Dataverse (9 mc_ tables)                            │
└────────────────────────┬──────────────────┬─────────────────────────┘
                         │                  │
        ┌────────────────┼──────────────────┤
        ▼                ▼                  ▼
┌───────────────┐ ┌─────────────────────┐ ┌──────────────────────────┐
│ Azure Function│ │ Work IQ MCP Servers │ │ Custom MCP Servers       │
│ App (triggers)│ │ ┌─────┐ ┌────────┐ │ │ ┌────────────┐           │
│ transcript-wh │ │ │Mail │ │Calendar│ │ │ │Delegated   │ (OBO)     │
│ signal-scanner│ │ │Teams│ │User    │ │ │ │Webhook     │ (App)     │
│ daily-summary │ │ │SPO  │ │OneDrive│ │ │ └────────────┘           │
│ sub-renewal   │ │ │Word │ │Copilot │ │ │                          │
│               │ │ │DV   │ └────────┘ │ │                          │
└───┬───┬───┬───┘ └─────────────────────┘ └──────────────────────────┘
    │   │   │   (Direct Foundry REST API)
    ▼   ▼   ▼
┌──────────────────────────────────────────────────────────┐
│  AI Foundry Agents                                        │
│  Transcript Analyst │ Board Manager │ Signal Monitor      │
│  Summary Agent      │                                     │
└──────────────────────────────────────────────────────────┘
```

---

## Phase 5 Stages

### Stage 5A: AI Chat Panel (Direct Foundry API) — COMPLETE

**Goal:** Conversational interface embedded in FlightDeck for natural language board interaction.

**Built components:**
1. `src/components/chat/ChatPanel.tsx` — Side panel (right side, 320px) with:
   - Chat message list (scrollable, auto-scroll on new messages)
   - Chat input with send button and Enter shortcut (Shift+Enter for newline)
   - Message bubbles: user (right-aligned, primary) vs agent (left-aligned, muted)
   - Typing indicator with animated dots when agent is processing
   - Agent identity badge (which Foundry agent responded)
   - Clear conversation button

2. `src/hooks/use-chat.ts` — TanStack Query hook managing:
   - Conversation query (messages array)
   - Send message mutation
   - Clear conversation mutation
   - Loading/sending state

3. `src/services/chat-service.ts` — Service layer:
   - Mock implementation for local development (simulated agent responses)
   - `// Swap:` comment for production Foundry API integration
   - Calls `summary-agent` via Foundry REST API when deployed

4. `src/lib/types.ts` — Added `ChatMessage`, `ChatConversation`, `ChatMessageRole` types

**Wiring:**
- `AppShell.tsx` includes ChatPanel with CSS width transition (w-0/w-80)
- `ui-store.ts` already had `chatPanelOpen` and `toggleChatPanel`
- TopBar chat toggle button already wired
- Auto-closes on compact breakpoint

**Direct Foundry integration (production):**
- Frontend calls Foundry agents REST API directly (no Copilot Studio middleware)
- Token acquired via managed identity or user OBO flow
- Chat messages routed to `summary-agent` for queries or `board-manager` for actions
- No Direct Line dependency, no WebSocket, no `botframework-*` packages needed

### Stage 5B: Governance & Board Settings

**Goal:** Multi-team governance, role-based access, and board configuration.

**Components to build:**
1. `src/pages/board-settings.tsx` — Board configuration page:
   - Column management (add/remove/reorder, WIP limits, colours)
   - Agent configuration (enable/disable per board, confidence thresholds)
   - Notification settings (Teams channel, email recipients)
   - Poll interval configuration
   - Archive policy (auto-archive after N days)

2. `src/pages/project-settings.tsx` — Project-level settings:
   - Board creation/deletion
   - Default column templates
   - Team member management

3. Enhanced `Sidebar.tsx` — Settings gear icon per board/project

4. `src/hooks/use-board-settings.ts` — Hook for board configuration CRUD

5. Security model enforcement:
   - Owner: full CRUD + settings + member management
   - Admin: full CRUD + member management
   - Member: task CRUD + comments
   - Viewer: read-only

### Stage 5C: Production Hardening

**Goal:** Performance, security, and deployment readiness.

1. **Code splitting** — Dynamic imports for:
   - Analytics page (`React.lazy`)
   - Chat panel
   - Board settings
   - Reduces initial bundle from ~1.2MB to <500KB

2. **Virtual scrolling** — `@tanstack/react-virtual` for:
   - Large boards (100+ tasks per column)
   - Activity timeline
   - Chat message history

3. **Security audit:**
   - No secrets in client code (all via Key Vault + managed identity)
   - Row-level security in Dataverse (users see only their org's data)
   - DLP policies in Power Platform admin centre
   - CORS restricted to `*.powerapps.com`
   - CSP headers configured

4. **Error handling:**
   - Global error boundary with recovery
   - Network failure retry (TanStack Query built-in)
   - Stale-while-revalidate for offline resilience
   - Agent action failure notifications

5. **Accessibility:**
   - WCAG 2.1 AA compliance
   - Keyboard DnD navigation (@dnd-kit built-in)
   - ARIA labels on all interactive elements
   - Focus management for panels/dialogs
   - Screen reader announcements for agent actions

6. **Deployment pipeline:**
   - GitHub Actions: lint → type-check → build → `power-apps push`
   - Environment promotion: dev → staging → prod
   - Bicep deployment in CI/CD
   - Agent definition deployment via AI Foundry CLI
   - Function App deployment via `func azure functionapp publish`

### Stage 5D: Advanced Intelligence (Stretch Goals)

**Goal:** Push beyond standard Kanban into predictive work intelligence.

1. **Predictive task completion** — Summary Agent analyses velocity data + historical patterns to predict when tasks will complete. Surface in TaskDetailPanel.

2. **Smart assignment** — Board Manager suggests assignees based on workload, expertise (from past task history), and availability (from Work IQ Calendar).

3. **Meeting-to-sprint pipeline** — Full automation: Webhook MCP detects new transcript → Transcript Analyst extracts items → Board Manager creates sprint, assigns tasks, sets priorities → Work IQ Teams notifies team → Work IQ Calendar schedules stand-up.

4. **Cross-board intelligence** — Summary Agent correlates across multiple boards (e.g., "the Platform Engineering blocker is blocking 3 tasks on the Client Onboarding board").

5. **Natural language board creation** — Chat command: "Create a new board for Project Phoenix with standard sprint columns" → Board Manager creates board, columns, invites team from Work IQ User directory.

6. **Weekly intelligence digest** — Scheduled summary: auto-generated board report saved to Work IQ Word document, emailed via Work IQ Mail, posted to Work IQ Teams channel.

---

## Route Updates

```
/ → AppShell
  index → DashboardPage (Kanban board)
  /analytics → AnalyticsPage (charts + data table)
  /settings/board/:boardId → BoardSettingsPage
  /settings/project/:projectId → ProjectSettingsPage
```

---

## New Dependencies

| Package | Purpose |
|---------|---------|
| `react-markdown` + `remark-gfm` | Markdown rendering in chat messages (stretch) |
| `@tanstack/react-virtual` | Virtual scrolling for large lists |

---

## Success Criteria

- [ ] User can chat with FlightDeck and get board summaries, create tasks, move cards
- [ ] Chat shows which agent responded and which MCP tools were used
- [ ] Board settings allow column/WIP/agent configuration changes
- [ ] Role-based access enforced (viewer cannot edit)
- [ ] Initial load under 500KB after code splitting
- [ ] 100+ task board renders smoothly
- [ ] All agent actions visible in telemetry with MCP source tracking
- [ ] Full deployment pipeline: push to GitHub → auto-deploy to Power Apps
- [ ] Zero secrets in client code
- [ ] WCAG 2.1 AA compliant

# FlightDeck -- Architecture & Build Documentation

## Executive Summary

FlightDeck is an enterprise agentic Kanban board built as a Power Apps Code App (React + TypeScript + Vite). It automatically ingests meeting transcripts via custom MCP servers, extracts action items with AI agents, populates and dynamically updates a Kanban board, and monitors email/chat signals to move cards in real-time. The board includes a telemetry blade showing agent activity, analytics dashboards, and human-in-the-loop approval for low-confidence agent actions.

Target: UK technology companies, consultancies, and MSPs needing automated meeting-to-action pipelines.

The project was originally named "Mission Control" and was renamed to "FlightDeck" in Phase 2 to avoid trademark issues.

---

## Technology Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 19.1.1 | UI framework |
| TypeScript | ~5.9.3 | Type safety |
| Vite | 7.1.7 | Build tool and dev server |
| Tailwind CSS | 4.1.16 | Utility-first styling |
| shadcn/ui (Radix primitives) | Various | UI component library |
| OKLCH colour system | -- | Perceptually uniform colour space for themes |
| TanStack Query | 5.90.5 | Server state management (15s polling) |
| TanStack Table | 8.21.3 | Data table with sorting and filtering |
| Zustand | 5.0.10 | Client state management (2 stores) |
| @dnd-kit/core | 6.3.1 | Drag-and-drop framework |
| @dnd-kit/sortable | 10.0.0 | Sortable DnD primitives |
| @dnd-kit/utilities | 3.2.2 | DnD utility helpers |
| Recharts | 2.15.4 | Analytics chart library |
| React Router | 7.9.4 | SPA routing with Power Apps BASENAME normalisation |
| date-fns | 4.1.0 | UK date formatting (en-GB locale) |
| lucide-react | 0.546.0 | Icon library |
| cmdk | 1.1.1 | Command palette (Ctrl+K) |
| sonner | 2.0.7 | Toast notifications |
| react-day-picker | 9.11.1 | Date picker component |
| class-variance-authority | 0.7.1 | Component variant management |
| clsx | 2.1.1 | Conditional class name utility |
| tailwind-merge | 3.3.1 | Tailwind class deduplication |
| @microsoft/power-apps | 1.0.3 | Power Apps SDK |
| @microsoft/power-apps-vite | 1.0.2 | Power Apps Vite plugin |
| tw-animate-css | 1.4.0 | Tailwind animation utilities |
| ESLint | 9.36.0 | Linting |
| typescript-eslint | 8.45.0 | TypeScript ESLint rules |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  Power Apps Host (Entra ID Auth, DLP, Governance)               │
├─────────────────────────────────────────────────────────────────┤
│  FlightDeck React SPA (Code App)                                │
│  ┌────────┬────────────────────────────┬──────────┬──────────┐  │
│  │Sidebar │     Kanban Board           │ AI Chat  │Telemetry │  │
│  │Org/Proj│  [Backlog][ToDo][InProg]   │ Panel    │ Blade    │  │
│  │Board   │  [Review][Done]            │ (direct  │ Agent    │  │
│  │Nav     │     DnD Cards              │  Foundry)│ Status   │  │
│  │        │                            │          │ Actions  │  │
│  │Analytics│ ┌──────────────────────┐  │          │ Metrics  │  │
│  │        │  │ Approval Banner      │  │          │ Activity │  │
│  └────────┴──┴──────────────────────┴──┴──────────┴──────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  Service Layer (src/services/) — mock → Dataverse swap           │
├─────────────────────────────────────────────────────────────────┤
│  TanStack Query + Zustand State Management                       │
└────────────────┬──────────────────────┬─────────────────────────┘
                 │ @microsoft/power-apps│ Direct Foundry API
                 │ SDK                  │ (chat panel)
                 ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  Dataverse Tables (9 tables, mc_ prefix)                        │
│  organization│project│board│column│task│comment│activitylog      │
│  agentaction │ boardmember                                       │
└────────┬─────────────────────────────┬──────────────────────────┘
         │ writes results              │ reads/queries
┌────────┴────────────┐     ┌──────────┴──────────────────────────┐
│ Azure Function App  │     │ Work IQ MCP Servers                  │
│ (Orchestrator)      │     │ Mail│Calendar│Teams│User│SharePoint  │
├─────────────────────┤     │ Copilot│OneDrive│Word│Dataverse      │
│ Triggers:           │     └─────────────────────────────────────┘
│ • transcript-webhook│
│ • signal-scanner    │     ┌─────────────────────────────────────┐
│ • daily-summary     │     │ Custom Transcript MCP Servers        │
│ • subscription-renew│◄────┤ Delegated (OBO) — per-user transcripts│
└───┬───┬───┬───┬─────┘     │ Webhook (App) — tenant-wide events    │
    │   │   │   │           └─────────────────────────────────────┘
    ▼   ▼   ▼   ▼
┌──────────────────────────────────────────────────────┐
│ AI Foundry Agents (called via REST API)               │
│ ┌─────────────┐ ┌──────────────┐ ┌───────────────┐  │
│ │ Transcript  │ │ Board        │ │ Signal        │  │
│ │ Analyst     │ │ Manager      │ │ Monitor       │  │
│ │ (gpt-5)     │ │ (gpt-5-mini) │ │ (gpt-5-mini)  │  │
│ └─────────────┘ └──────────────┘ └───────────────┘  │
│ ┌─────────────┐                                      │
│ │ Summary     │                                      │
│ │ Agent       │                                      │
│ │ (gpt-5)     │                                      │
│ └─────────────┘                                      │
└──────────────────────────────────────────────────────┘
```

---

## Three-Layer Architecture

FlightDeck follows a strict three-layer separation to maximise testability and enable a clean swap from mock data to Dataverse.

```
Components (presentation) → Hooks (business logic + TanStack Query) → Services (CRUD)
```

### Layer 1: Components (Presentation)

React components handle rendering and user interaction only. They call hooks for data and mutations. No direct data fetching or business logic lives in components.

### Layer 2: Hooks (Business Logic + TanStack Query)

Custom hooks encapsulate all business logic, TanStack Query configuration (query keys, refetch intervals, optimistic updates), and mutation wiring. Each hook imports from the corresponding service.

Example pattern:
```typescript
// src/hooks/use-tasks.ts
import { TasksService } from "@/services/tasks-service"

export function useTasks(boardId: string) {
  const query = useQuery({
    queryKey: ["tasks", boardId],
    queryFn: () => TasksService.getAll({ boardId }),
    refetchInterval: 15000,
  })
  // ... mutations
}
```

### Layer 3: Services (CRUD, mock to Dataverse swap)

Each service file contains a module-level mock data store and 5 async CRUD functions (`getAll`, `get`, `create`, `update`, `delete`). Every service has a `// Swap:` comment at the top showing the one-line import change needed to switch from mock data to Dataverse-generated services:

```typescript
// src/services/tasks-service.ts
// Swap: import { McTasksService } from '@/generated/services/McTasksService'

const MOCK_TASKS: KanbanTask[] = [...]
let mockTaskStore = [...MOCK_TASKS]

export const TasksService = {
  async getAll(options?: { boardId?: string }): Promise<KanbanTask[]> { ... },
  async get(id: string): Promise<KanbanTask | null> { ... },
  async create(task: Partial<KanbanTask>): Promise<KanbanTask> { ... },
  async update(id: string, changes: Partial<KanbanTask>): Promise<KanbanTask | null> { ... },
  async delete(id: string): Promise<void> { ... },
}
```

The mock service API is designed to match the generated Dataverse service pattern, so the swap requires only changing the import line.

---

## File Structure

```
AI_Kanban/
├── docs/
│   ├── architecture.md                    # This file — project documentation
│   └── dataverse-setup.md                 # Complete Dataverse schema guide (390 lines)
│
├── infrastructure/
│   ├── agents/
│   │   ├── transcript-analyst.json        # AI Foundry agent: transcript analysis (gpt-5)
│   │   ├── board-manager.json             # AI Foundry agent: board CRUD operations (gpt-5-mini)
│   │   ├── signal-monitor.json            # AI Foundry agent: email/chat signal detection (gpt-5-mini)
│   │   └── summary-agent.json             # AI Foundry agent: board insights and NL queries (gpt-5)
│   ├── bicep/
│   │   ├── main.bicep                     # Azure IaC: Log Analytics, App Insights, Key Vault, Container Apps, Function App
│   │   └── parameters.json               # Bicep parameter values
│   ├── docker/
│   │   ├── Dockerfile.mcp-delegated       # MCP server: delegated (OBO) transcript access
│   │   ├── Dockerfile.mcp-webhook         # MCP server: webhook (app-level) transcript events
│   │   ├── docker-compose.yml             # Local dev compose for both MCP servers
│   │   └── .dockerignore                  # Docker build exclusions
│   └── functions/
│       ├── src/index.js                   # Azure Function orchestrator (4 triggers)
│       ├── host.json                      # Functions v2 host config
│       ├── local.settings.json            # Local dev settings
│       └── package.json                   # Function dependencies
│
├── public/
│   └── power-apps.svg                     # Power Apps logo
│
├── src/
│   ├── assets/
│   │   └── react.svg                      # React logo
│   │
│   ├── components/
│   │   ├── analytics/
│   │   │   ├── ActivityOverTimeChart.tsx   # Stacked area chart: agent vs human activity
│   │   │   ├── ChartSkeleton.tsx          # Loading skeleton for chart cards
│   │   │   ├── TasksByPriorityChart.tsx   # Donut chart by priority level
│   │   │   ├── TasksBySourceChart.tsx     # Donut chart by task source
│   │   │   ├── TasksByStatusChart.tsx     # Bar chart by column/status
│   │   │   ├── TasksDataTable.tsx         # TanStack Table with sortable headers
│   │   │   └── data-table-columns.tsx     # Column definitions for TasksDataTable
│   │   │
│   │   ├── kanban/
│   │   │   ├── ApprovalBanner.tsx         # Human-in-the-loop: Accept/Reject agent actions
│   │   │   ├── BoardMembersPopover.tsx    # Stacked avatars with role badges
│   │   │   ├── CommentsList.tsx           # Task comments with agent styling
│   │   │   ├── FilterPopover.tsx          # Checkbox filters (assignee, priority, source)
│   │   │   ├── KanbanBoard.tsx            # Main board with DndContext
│   │   │   ├── KanbanCard.tsx             # Draggable task card
│   │   │   ├── KanbanColumn.tsx           # Droppable column with WIP limit
│   │   │   ├── NewTaskDialog.tsx          # Full new task form dialog
│   │   │   ├── NewTaskInline.tsx          # Quick-add task per column
│   │   │   ├── SearchDialog.tsx           # cmdk command palette (Ctrl+K)
│   │   │   ├── TaskActivityFeed.tsx       # Activity timeline for a task
│   │   │   ├── TaskDetailFields.tsx       # Inline-editable task fields
│   │   │   └── TaskDetailPanel.tsx        # Sheet slide-over (480px), 3 tabs
│   │   │
│   │   ├── layout/
│   │   │   ├── AppShell.tsx               # 3-panel layout (sidebar + main + telemetry)
│   │   │   ├── CommandBar.tsx             # Top bar: members, search, filter, new task
│   │   │   ├── Sidebar.tsx                # Collapsible org/project/board navigation
│   │   │   └── TopBar.tsx                 # FlightDeck branding (Gauge icon), theme toggle
│   │   │
│   │   ├── shared/
│   │   │   ├── ErrorBoundary.tsx          # Class component with ChartErrorFallback
│   │   │   ├── KeyboardShortcutsDialog.tsx # Shortcuts reference dialog (? key)
│   │   │   ├── PriorityIcon.tsx           # Priority-coloured arrow/alert icons
│   │   │   ├── SourceBadge.tsx            # Task source indicator badge
│   │   │   └── UserAvatar.tsx             # Initials-based avatar component
│   │   │
│   │   ├── telemetry/
│   │   │   ├── ActivityTimeline.tsx        # Vertical timeline with action-type icons
│   │   │   ├── AgentActionFeed.tsx         # Real-time agent action feed
│   │   │   ├── AgentStatusPanel.tsx        # 4 agents, status dots, tooltips
│   │   │   ├── BoardMetrics.tsx            # 2x2 grid: trend icons, progress bar
│   │   │   ├── TelemetryBlade.tsx          # Right panel container (tabs)
│   │   │   └── TelemetrySkeleton.tsx       # Loading state for telemetry
│   │   │
│   │   ├── ui/                            # shadcn/ui primitives (21 files)
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── card.tsx
│   │   │   ├── chart.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── command.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── textarea.tsx
│   │   │   └── tooltip.tsx
│   │   │
│   │   └── mode-toggle.tsx                # Dark/light theme toggle button
│   │
│   ├── hooks/
│   │   ├── use-activity-log.ts            # Activity log CRUD + TanStack Query
│   │   ├── use-agent-actions.ts           # Agent actions, statuses, pending approvals
│   │   ├── use-analytics.ts               # Analytics data aggregation
│   │   ├── use-board-members.ts           # Board member management
│   │   ├── use-columns.ts                 # Column CRUD + TanStack Query
│   │   ├── use-comments.ts                # Task comments CRUD
│   │   ├── use-kanban-drag-drop.ts        # DnD event handlers, sort order calculation
│   │   ├── use-keyboard-shortcuts.ts      # Centralised keyboard shortcut registration
│   │   ├── use-navigation.ts              # Org/project/board navigation data
│   │   ├── use-responsive-layout.ts       # Auto-collapse sidebar/telemetry by viewport
│   │   ├── use-tasks.ts                   # Task CRUD + TanStack Query (15s polling)
│   │   └── use-theme.ts                   # Theme detection and toggle
│   │
│   ├── lib/
│   │   ├── constants.ts                   # Column/priority/source config, sort order gap
│   │   ├── date-utils.ts                  # UK date formatting (en-GB, date-fns)
│   │   ├── kanban-helpers.ts              # Sort order calculation, column helpers
│   │   ├── types.ts                       # TypeScript interfaces (13 types)
│   │   └── utils.ts                       # cn() utility (clsx + tailwind-merge)
│   │
│   ├── pages/
│   │   ├── _layout.tsx                    # Root layout wrapper
│   │   ├── analytics.tsx                  # Analytics page (4 charts + data table)
│   │   ├── dashboard.tsx                  # Main Kanban dashboard page
│   │   ├── home.tsx                       # Home/landing page
│   │   └── not-found.tsx                  # 404 page
│   │
│   ├── providers/
│   │   ├── query-provider.tsx             # TanStack Query client provider
│   │   ├── sonner-provider.tsx            # Toast notification provider
│   │   └── theme-provider.tsx             # Theme context provider
│   │
│   ├── services/
│   │   ├── activity-log-service.ts        # Activity log mock service
│   │   ├── agent-actions-service.ts       # Agent actions mock service
│   │   ├── board-members-service.ts       # Board members mock service
│   │   ├── boards-service.ts              # Boards mock service
│   │   ├── columns-service.ts             # Columns mock service
│   │   ├── comments-service.ts            # Comments mock service
│   │   ├── index.ts                       # Barrel export for all services
│   │   ├── organizations-service.ts       # Organisations mock service
│   │   ├── projects-service.ts            # Projects mock service
│   │   └── tasks-service.ts               # Tasks mock service (8 sample tasks)
│   │
│   ├── stores/
│   │   ├── board-store.ts                 # Zustand: current org/project/board selection
│   │   └── ui-store.ts                    # Zustand: panels, filters, dialogs, task detail
│   │
│   ├── App.tsx                            # Root app component
│   ├── index.css                          # Global styles, OKLCH theme variables
│   ├── main.tsx                           # Entry point (React 19 createRoot)
│   └── router.tsx                         # React Router config with Power Apps BASENAME
│
├── components.json                        # shadcn/ui configuration
├── eslint.config.js                       # ESLint flat config
├── index.html                             # HTML entry point
├── package.json                           # Dependencies and scripts
├── package-lock.json                      # Locked dependency versions
├── tsconfig.json                          # TypeScript base config
├── tsconfig.app.json                      # TypeScript app config
├── tsconfig.node.json                     # TypeScript node config
├── vite.config.ts                         # Vite configuration with Power Apps plugin
├── .gitignore                             # Git ignore rules
└── README.md                              # Project readme
```

---

## Phase Build Log

### Phase 1: Thin Vertical Slice (Complete)

**Goal:** Prove the Power Apps Code App template works end-to-end with a functional Kanban board.

**Deliverables:**

- **AppShell** 3-panel layout: collapsible sidebar placeholder (left), main content (centre), telemetry blade placeholder (right)
- **TopBar** with FlightDeck branding (Gauge icon from lucide-react), dark/light theme toggle
- **KanbanBoard** with @dnd-kit `DndContext`, `PointerSensor`, `closestCorners` collision detection
- **5 KanbanColumns**: Backlog (grey), To Do (blue), In Progress (amber), Review (purple), Done (green) -- each with colour-coded headers
- **8 KanbanCards** with priority icons (colour-coded arrows/alerts), source badges (Manual/Meeting/Email/Agent/Import), user avatars (initials-based), and label tags
- **NewTaskInline** quick-add input per column (press Enter to create)
- **TelemetryBlade** right panel with static mock agent status display
- **OKLCH colour system** with dark/light theme variants, perceptually uniform colours

**Files created:** 18 new files

---

### Phase 2: Full Board + Navigation + Activity (Complete)

**Goal:** Build out the full board experience with navigation, task detail editing, and activity logging.

**Deliverables:**

- **Sidebar** with hierarchical org -> project -> board navigation, collapsible (w-14 collapsed / w-56 expanded)
- **TaskDetailPanel** sheet slide-over (480px width) with 3 tabs: Details, Comments, Activity
- **TaskDetailFields** with inline editing using Select (priority, assignee), Calendar (due date), Checkbox (blocked state) components
- **CommentsList** with agent comment styling (border-l-2 border-primary accent for AI-authored comments)
- **CommandBar** with BoardMembersPopover, search trigger (Ctrl+K shortcut), FilterPopover, New Task button
- **FilterPopover** with checkbox-based filters for assignee, priority, and source
- **SearchDialog** with cmdk command palette, fuzzy search across all tasks
- **BoardMembersPopover** with stacked avatars, role badges (owner/admin/member/viewer)
- **NewTaskDialog** full form with all task fields (title, description, assignee, priority, source, due date, labels)
- **Activity logging** for all CRUD operations (create, move, update, comment, assign, complete, archive, delete)
- **WIP limit enforcement** with visual warnings on columns approaching limits and drag rejection when above limit
- **Board member management** with add/remove/update role mutations and toast notifications

**Files created/modified:** 14 new files, 12 modified files

---

### Phase 3: Telemetry Blade + Analytics + Enterprise Polish (Complete)

**Goal:** Refactor telemetry into composable sub-components, add analytics dashboard, and polish with enterprise features.

**Deliverables:**

- **TelemetryBlade refactored** into sub-components:
  - `AgentStatusPanel` -- 4 agents with status dots (green/amber/red colour transitions), tooltips showing last action
  - `BoardMetrics` -- 2x2 grid of metric cards with trend icons (up/down arrows), WIP progress bar
  - `ActivityTimeline` -- vertical timeline with action-type icons, agent accent colouring
  - `TelemetrySkeleton` -- shimmer loading state while data loads

- **Analytics page** (`/analytics` route):
  - 4 summary cards: Total Tasks, Completion Rate %, Agent Contribution %, Overdue count
  - `TasksByStatusChart` -- Recharts bar chart using column colours
  - `TasksByPriorityChart` -- Recharts donut chart using priority colours
  - `TasksBySourceChart` -- Recharts donut chart
  - `ActivityOverTimeChart` -- Recharts stacked area chart (agent vs human activity)
  - `TasksDataTable` -- TanStack Table with sortable column headers, row click navigates to task detail

- **ErrorBoundary** class component with `ChartErrorFallback` variant for isolating chart errors
- **Keyboard shortcuts** centralised in `use-keyboard-shortcuts.ts`:
  - `N` -- open New Task dialog
  - `T` -- toggle Telemetry blade
  - `[` -- toggle Sidebar
  - `?` -- open Keyboard Shortcuts dialog
  - `Ctrl+K` -- open Search dialog
- **Responsive layout** via `use-responsive-layout.ts`:
  - Auto-collapse sidebar below 768px viewport width
  - Auto-collapse telemetry blade below 1280px viewport width
- **CSS width transitions** for sidebar and telemetry panel animations (smooth open/close)
- **UK date formatting** centralised in `date-utils.ts` using date-fns with en-GB locale
- **Toast notifications** on all mutations via sonner

**Files created/modified:** 18 new files, 12 modified files

---

### Phase 4: Service Layer + Infrastructure + Agent Telemetry (Complete)

**Goal:** Abstract data access into a service layer, define infrastructure as code, and build agent telemetry UI.

#### Stage 1: Service Abstraction Layer

- **10 service files** in `src/services/`:
  - `tasks-service.ts` -- 8 mock tasks, full CRUD
  - `columns-service.ts` -- 5 default columns, full CRUD
  - `boards-service.ts` -- mock board data
  - `projects-service.ts` -- mock project data
  - `organizations-service.ts` -- mock organisation data
  - `comments-service.ts` -- mock comments
  - `activity-log-service.ts` -- mock activity entries
  - `agent-actions-service.ts` -- mock agent action records
  - `board-members-service.ts` -- mock board membership
  - `index.ts` -- barrel export for all services
- Each service has a `// Swap:` comment showing the one-line import change for Dataverse
- **6 hooks refactored** to import from services instead of inline mock data: `use-tasks`, `use-columns`, `use-activity-log`, `use-navigation`, `use-comments`, `use-board-members`
- New `use-agent-actions.ts` hook with `useAgentActions`, `useLatestAgentStatuses`, `usePendingApprovals`
- `constants.ts` cleaned: removed `MOCK_ORGANIZATIONS`, `MOCK_PROJECTS`, `MOCK_BOARDS`, `MOCK_AGENTS` (data now lives in services)

#### Stage 2: Infrastructure as Code

- **Bicep template** (`infrastructure/bicep/main.bicep`, 375 lines):
  - Log Analytics workspace
  - Application Insights (connected to Log Analytics)
  - Managed Identity
  - Key Vault (with secrets for Graph API, AI Foundry)
  - Container Apps Environment
  - 2 Container Apps (Delegated MCP server, Webhook MCP server)
- **4 AI Foundry agent definitions** (JSON) in `infrastructure/agents/`:
  - `transcript-analyst.json` -- gpt-5, temperature 0.1, extracts action items from transcripts
  - `board-manager.json` -- gpt-5-mini, executes board CRUD operations (temperature not supported)
  - `signal-monitor.json` -- gpt-5-mini, detects email/chat signals (temperature not supported)
  - `summary-agent.json` -- gpt-5, temperature 0.3, generates board insights and answers NL queries
- **Azure Function orchestrator** (`infrastructure/functions/src/index.js`):
  - `transcript-webhook` -- HTTP trigger, Graph Change Notification handler, transcript-analyst → board-manager chain
  - `signal-scanner` -- Timer (every 15 min), calls signal-monitor, auto-executes high-confidence signals via board-manager
  - `daily-summary` -- Timer (08:00 UTC), calls summary-agent
  - `subscription-renewal` -- Timer (midnight), creates/renews Graph webhook subscriptions (3-day max expiry)
- **Docker infrastructure** (`infrastructure/docker/`):
  - 2 Dockerfiles for MCP server containers (delegated + webhook)
  - docker-compose.yml for local development
- **`docs/dataverse-setup.md`** (390 lines) -- complete schema guide for all 9 tables

#### Stage 3: Agent Telemetry + Approval UI

- `AgentActionFeed.tsx` -- real-time feed of agent actions in TelemetryBlade
- `AgentStatusPanel.tsx` -- refactored to use `useLatestAgentStatuses` hook instead of static `MOCK_AGENTS`
- `ApprovalBanner.tsx` -- human-in-the-loop approval UI with Accept/Reject buttons, confidence percentage badges
- Dashboard page updated with `ApprovalBanner` rendered above `CommandBar`

**Files created/modified:** 26 new files, 10 modified files

---

### Phase 5: AI Chat + Governance + Production (Planned)

- AI Chat panel (right side panel, direct Foundry API integration — built, wired into AppShell)
- Governance: board/project settings, role-based access
- Production deployment pipeline
- DLP policy configuration
- Audit logging and compliance

---

## Dataverse Schema

FlightDeck uses 9 custom Dataverse tables, all with the `mc_` publisher prefix. Full schema details are in `docs/dataverse-setup.md`.

### Table Overview

| # | Table | Schema Name | Purpose | Key Columns |
|---|---|---|---|---|
| 1 | Organization | `mc_organization` | Top-level org grouping | name, logoUrl |
| 2 | Project | `mc_project` | Project within an org | name, description, color, organizationId (lookup) |
| 3 | Board | `mc_board` | Kanban board within a project | name, description, isDefault, agentsEnabled, pollInterval, projectId (lookup) |
| 4 | Column | `mc_column` | Board column | name, columnType (choice), sortOrder, color, wipLimit, boardId (lookup) |
| 5 | Task | `mc_task` | Kanban card/task | title, description, priority (choice), sortOrder, dueDate, source (choice), sourceReference, labels, meetingDate, completedDate, archivedDate, isBlocked, blockedReason, assigneeId, assigneeName, columnId (lookup), boardId (lookup) |
| 6 | Comment | `mc_comment` | Task comment | content, authorId, authorName, isAgent, taskId (lookup) |
| 7 | Activity Log | `mc_activitylog` | Audit trail | action (choice), description, actorId, actorName, isAgent, previousValue, newValue, taskId (lookup), boardId (lookup) |
| 8 | Agent Action | `mc_agentaction` | AI agent execution log | agentName, actionType, status (choice), confidence, durationMs, taskId (lookup), boardId (lookup) |
| 9 | Board Member | `mc_boardmember` | Board membership | name, email, role (choice), avatarUrl, boardId (lookup) |

### Choice Column Values

**Column Type** (`mc_columntype`): backlog (100000000), todo (100000001), in_progress (100000002), review (100000003), done (100000004), archived (100000005)

**Priority** (`mc_priority`): critical (100000000), high (100000001), medium (100000002), low (100000003)

**Source** (`mc_source`): manual (100000000), meeting_transcript (100000001), email (100000002), agent (100000003), import (100000004)

**Activity Action** (`mc_action`): created (100000000), moved (100000001), updated (100000002), commented (100000003), assigned (100000004), completed (100000005), archived (100000006), deleted (100000007), agent_action (100000008)

**Agent Action Status** (`mc_status`): pending (100000000), running (100000001), succeeded (100000002), failed (100000003), requires_approval (100000004)

**Board Member Role** (`mc_role`): owner (100000000), admin (100000001), member (100000002), viewer (100000003)

### Security Roles

| Role | organization | project | board | column | task | comment | activitylog | agentaction | boardmember |
|---|---|---|---|---|---|---|---|---|---|
| Board Owner | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | CR | CR | CRUD |
| Board Admin | R | R | RU | CRUD | CRUD | CRUD | CR | CR | CRU |
| Board Member | R | R | R | R | CRUD | CRUD | CR | R | R |
| Board Viewer | R | R | R | R | R | R | R | R | R |
| Agent Service | R | R | R | R | CRU | CR | CR | CRU | R |

---

## Agent Definitions

All agent definitions are stored as JSON in `infrastructure/agents/`.

### 1. Transcript Analyst

| Property | Value |
|---|---|
| **File** | `infrastructure/agents/transcript-analyst.json` |
| **Model** | Azure OpenAI -- gpt-5 (GPT-5.1) |
| **Temperature** | 0.1 |
| **Max Tokens** | 4096 |
| **Confidence Threshold** | 0.7 |
| **Output Format** | structured_json |

**System Prompt Summary:** Analyses meeting transcripts and extracts structured action items. For each item, outputs title, description, assigneeName, priority, dueDate, sourceReference, meetingDate, confidence score, and labels.

**Key Rules:**
1. Only extract items where someone committed to doing something
2. Ignore general discussion points unless a clear action was stated
3. Set confidence below 0.7 if assignment or deadline is ambiguous
4. Use UK date format assumptions (DD/MM/YYYY)
5. Output an array of action items as valid JSON

**Tools:**
- `submit_action_items` (function) -- submits extracted action items to the Board Manager for task creation. Parameters: meetingTitle, meetingDate, actionItems array.

---

### 2. Board Manager

| Property | Value |
|---|---|
| **File** | `infrastructure/agents/board-manager.json` |
| **Model** | Azure OpenAI -- gpt-5-mini |
| **Temperature** | N/A (not supported by gpt-5-mini) |
| **Max Tokens** | 2048 |
| **Confidence Threshold** | 0.8 |
| **Approval Required** | Yes |
| **Output Format** | structured_json |

**System Prompt Summary:** Performs CRUD operations on the Kanban board based on instructions from other agents or direct user requests. Handles task creation, column moves, assignee resolution (fuzzy matching), priority updates, and archiving.

**Key Rules:**
1. Auto-execute when confidence >= 0.8
2. Request human approval when confidence < 0.8
3. Never delete tasks -- only archive
4. Log every action to `mc_activitylog`
5. When resolving assignees, prefer exact email match, then full name match, then partial name match
6. Set isBlocked=true if dependencies are mentioned but unresolved

**Tools:**
- `manage_tasks` (Dataverse) -- CRUD on `mc_task` table (create, read, update)
- `log_activity` (Dataverse) -- create entries in `mc_activitylog`
- `lookup_members` (Dataverse) -- read `mc_boardmember` for assignee resolution

---

### 3. Signal Monitor

| Property | Value |
|---|---|
| **File** | `infrastructure/agents/signal-monitor.json` |
| **Model** | Azure OpenAI -- gpt-5-mini |
| **Temperature** | N/A (not supported by gpt-5-mini) |
| **Max Tokens** | 2048 |
| **Confidence Threshold** | 0.7 |
| **Output Format** | structured_json |

**System Prompt Summary:** Watches email threads and Teams chat messages for signals indicating task status changes. Detects completion, blocker, progress, and escalation signals, then fuzzy-matches them to existing board tasks and recommends actions.

**Signal Types:**
1. **Completion:** "done", "finished", "deployed", "merged", "shipped"
2. **Blocker:** "blocked", "waiting on", "depends on", "can't proceed"
3. **Progress:** "started", "working on", "halfway through", "PR submitted"
4. **Escalation:** "urgent", "critical", "ASAP", "SLA breach"

**Key Rules:**
1. Fuzzy-match subject/context to existing board tasks
2. Recommend action: move_task, update_priority, set_blocked, or add_comment
3. Include confidence score based on match quality
4. Flag for human review when confidence < 0.7

**Tools:**
- `read_tasks` (Dataverse) -- read `mc_task` for fuzzy matching
- `submit_recommendation` (function) -- submits recommended board action to Board Manager. Parameters: signalType, matchedTaskId, recommendedAction, confidence, reasoning, sourceMessage.

---

### 4. Summary Agent

| Property | Value |
|---|---|
| **File** | `infrastructure/agents/summary-agent.json` |
| **Model** | Azure OpenAI -- gpt-5 (GPT-5.1) |
| **Temperature** | 0.3 |
| **Max Tokens** | 4096 |
| **Confidence Threshold** | 0.5 |
| **Output Format** | markdown |

**System Prompt Summary:** Provides board insights and answers natural language questions about the Kanban board state. Generates daily summaries, sprint velocity metrics, team workload analysis, risk assessments, and handles NL queries.

**Capabilities:**
1. Daily board summary: tasks completed, in progress, blocked, overdue
2. Sprint velocity: tasks completed per day, average cycle time
3. Team workload: tasks per assignee, WIP per person
4. Risk assessment: overdue tasks, approaching deadlines, blocked items
5. Natural language queries: "What is Sarah working on?", "Show me blocked tasks"

**Key Rules:**
1. Use UK English spelling and date formats
2. Be concise -- summaries should be 3-5 bullet points
3. Highlight risks and blockers prominently
4. Include specific numbers and percentages
5. For NL queries, infer intent and provide structured + natural language response

**Tools:**
- `read_board_data` (Dataverse) -- read `mc_task` for board analysis
- `read_activity` (Dataverse) -- read `mc_activitylog` for velocity calculations

---

## Azure Function Orchestrator

The autonomous trigger pipeline uses an Azure Function App (`func-flightdeck-dev`) instead of Copilot Studio. This simplifies deployment (no portal configuration required) and gives full control over agent chaining logic.

Source: `infrastructure/functions/src/index.js`

### 1. Transcript Webhook

| Property | Value |
|---|---|
| **Trigger Type** | HTTP (POST) |
| **Auth Level** | Function key |
| **Endpoint** | `https://func-flightdeck-dev.azurewebsites.net/api/transcript-webhook` |

**Pipeline:**
1. Handle Graph subscription validation handshake (returns `validationToken`)
2. Extract meeting ID and transcript ID from notification resource path
3. Fetch transcript content from Graph API
4. Invoke **Transcript Analyst** — extracts action items as structured JSON
5. Invoke **Board Manager** — creates tasks from extracted action items
6. Log pipeline completion

---

### 2. Signal Scanner

| Property | Value |
|---|---|
| **Trigger Type** | Timer |
| **Schedule** | Every 15 minutes (`0 */15 * * * *`) |

**Pipeline:**
1. Invoke **Signal Monitor** — scans recent emails and Teams messages
2. Parse structured recommendations from agent output
3. For each signal with `confidence >= 0.7`: invoke **Board Manager** to execute
4. Low-confidence signals logged for manual review

---

### 3. Daily Summary

| Property | Value |
|---|---|
| **Trigger Type** | Timer |
| **Schedule** | 08:00 UTC daily (`0 0 8 * * *`) |

**Pipeline:**
1. Invoke **Summary Agent** — generates board digest (completed, in-progress, blocked, overdue, workload)
2. Output formatted for Teams posting (via Work IQ MCP when connected)

---

### 4. Subscription Renewal

| Property | Value |
|---|---|
| **Trigger Type** | Timer |
| **Schedule** | Midnight daily (`0 0 0 * * *`) |

**Pipeline:**
1. List existing Graph webhook subscriptions
2. If transcript subscription exists: renew (extend 3 days)
3. If no subscription: create new subscription for `communications/onlineMeetings/getAllTranscripts`
4. Uses `WEBHOOK_NOTIFICATION_URL` from Function App settings

---

## Key Design Decisions

### 1. shadcn/ui over Fluent UI v9

The Power Apps Code App starter template ships with shadcn/ui (Radix primitives + Tailwind). Staying with the template convention avoids ~180KB of additional bundle size from Fluent UI v9 and maintains consistency with the template's styling system.

### 2. TanStack Query polling over WebSockets

Power Apps Code Apps run inside the Power Apps host iframe and do not support persistent WebSocket connections. TanStack Query's `refetchInterval: 15000` (15 seconds) provides near-real-time updates via polling, which works within the platform constraints.

### 3. Fractional indexing for DnD reordering

`SORT_ORDER_GAP = 65536` provides fractional indexing for drag-and-drop reordering. When a card is moved between two others, its sort order is set to the midpoint. The large gap allows approximately 16 levels of subdivision before needing a rebalance.

### 4. Service abstraction layer for mock-to-Dataverse swap

Every service file has a `// Swap:` comment showing the one-line import change. The mock service API is designed to match the Dataverse-generated service pattern exactly, so switching from mock data to live Dataverse requires only changing the import statement in each service file.

### 5. OKLCH colour system

OKLCH (Oklab Lightness Chroma Hue) provides perceptually uniform colours, meaning equal numeric steps produce equal visual contrast changes. This is especially valuable for dark mode where traditional hex/HSL colours can appear washed out or overly saturated.

### 6. CSS width transitions over conditional render

Sidebar and telemetry blade animations use CSS `transition: width` rather than conditional rendering (`{isOpen && <Panel />}`). This preserves component state during open/close transitions and enables smooth animations without remounting.

### 7. Centralised keyboard shortcuts

All keyboard shortcuts are registered in a single `use-keyboard-shortcuts.ts` hook to prevent conflicts between components. The hook checks `document.activeElement` to avoid triggering shortcuts while typing in input fields.

### 8. UK date formatting throughout

All dates use en-GB locale via date-fns. The centralised `date-utils.ts` exports formatters like `formatDate`, `formatDateTime`, and `formatRelative` that consistently produce UK-formatted output (e.g. "24/03/2026", "24 Mar 2026").

### 9. ErrorBoundary isolation

Each telemetry section (charts, metrics, timelines) is wrapped in its own ErrorBoundary. If a single chart crashes due to bad data, only that section shows a fallback -- the rest of the telemetry blade remains functional.

### 10. Three-layer architecture for testability

The Components -> Hooks -> Services separation enables testing at each layer independently. Components can be tested with mock hooks, hooks can be tested with mock services, and services can be swapped between mock and Dataverse implementations.

---

## State Management

### Zustand Stores

**`ui-store.ts`** -- manages all UI state:
- Panel visibility: `telemetryBladeOpen`, `chatPanelOpen`, `sidebarOpen`, `sidebarCollapsed`
- Task detail: `selectedTaskId`, `taskDetailOpen`
- Dialogs: `newTaskDialogOpen`, `searchOpen`, `shortcutsDialogOpen`
- Filters: `FilterState` (search string, assigneeIds[], priorities[], sources[])

**`board-store.ts`** -- manages navigation context:
- `currentOrgId` -- selected organisation
- `currentProjectId` -- selected project
- `currentBoardId` -- selected board

### TanStack Query Keys

| Query Key | Polling | Source |
|---|---|---|
| `["tasks", boardId]` | 15s | `TasksService.getAll` |
| `["task", taskId]` | -- | `TasksService.get` |
| `["columns", boardId]` | -- | `ColumnsService.getAll` |
| `["agent-actions", boardId]` | 15s | `AgentActionsService.getAll` |
| `["activity-log", boardId]` | -- | `ActivityLogService.getAll` |
| `["comments", taskId]` | -- | `CommentsService.getAll` |
| `["board-members", boardId]` | -- | `BoardMembersService.getAll` |
| `["organizations"]` | -- | `OrganizationsService.getAll` |
| `["projects", orgId]` | -- | `ProjectsService.getAll` |
| `["boards", projectId]` | -- | `BoardsService.getAll` |

---

## Metrics

| Category | Count |
|---|---|
| Total project files (excl. node_modules) | ~127 |
| Source lines of code (src/) | ~8,100 |
| Infrastructure lines (IaC + agents + topics) | ~926 |
| React components | 44 |
| Custom hooks | 12 |
| Service files | 10 |
| UI primitives (shadcn) | 21 |
| Zustand stores | 2 |
| Routes | 2 (+404) |
| Dataverse tables | 9 |
| AI Foundry agents | 4 |
| Azure Function triggers | 4 |
| Infrastructure templates | 1 Bicep template + parameters |
| TypeScript interfaces | 13 |
| Mock task records | 8 |

---

## Routes

| Path | Component | Description |
|---|---|---|
| `/` | `DashboardPage` | Main Kanban board with CommandBar and ApprovalBanner |
| `/analytics` | `AnalyticsPage` | 4 charts + data table |
| `*` | `NotFoundPage` | 404 fallback |

All routes are wrapped in the `AppShell` layout component which provides the three-panel structure (Sidebar + Main + TelemetryBlade).

The router uses Power Apps BASENAME normalisation to handle routing correctly when hosted inside the Power Apps iframe:

```typescript
const BASENAME = new URL(".", location.href).pathname
```

---

## TypeScript Interfaces

Defined in `src/lib/types.ts`:

| Interface | Purpose |
|---|---|
| `KanbanColumn` | Board column (id, name, boardId, sortOrder, color, wipLimit, columnType) |
| `KanbanTask` | Task/card (19 fields including title, priority, assignee, dates, source, labels) |
| `KanbanBoard` | Board metadata (id, name, projectId, agentsEnabled, pollInterval) |
| `ActivityLogEntry` | Audit trail entry (action, actor, isAgent, previous/new values) |
| `AgentAction` | AI agent execution record (agentName, actionType, status, confidence, durationMs) |
| `Organization` | Top-level org (id, name, logoUrl) |
| `Project` | Project within org (id, organizationId, name, description, color) |
| `BoardMember` | Board membership (id, boardId, name, email, role, avatarUrl) |
| `Comment` | Task comment (id, taskId, authorId, authorName, isAgent, content) |
| `FilterState` | Active filters (search, assigneeIds, priorities, sources) |
| `ColumnType` | Union type: "backlog" \| "todo" \| "in_progress" \| "review" \| "done" \| "archived" |
| `Priority` | Union type: "critical" \| "high" \| "medium" \| "low" |
| `TaskSource` | Union type: "manual" \| "meeting_transcript" \| "email" \| "agent" \| "import" |

---

## Azure Deployment (Live)

### Resource Group: `rg-flightdeck` (uksouth)

| Resource | Type | Name | Status |
|---|---|---|---|
| AI Services | Microsoft.CognitiveServices/accounts | `ai-flightdeck` (S0) | Deployed |
| Foundry Project | accounts/projects | `flightdeck-project` | Deployed |
| gpt-5 | Model deployment (GPT-5.1) | GlobalStandard, 50K TPM, 500 RPM | Deployed |
| gpt-5-mini | Model deployment | GlobalStandard, 50K TPM, 500 RPM | Deployed |
| Container Registry | Microsoft.ContainerRegistry | `crflightdeck.azurecr.io` (Basic) | Deployed |
| Log Analytics | Microsoft.OperationalInsights | `log-flightdeck-dev` | Deployed |
| App Insights | Microsoft.Insights | `appi-flightdeck-dev` | Deployed |
| Key Vault | Microsoft.KeyVault | `kv-flightdeck-dev` | Deployed |
| Managed Identity | Microsoft.ManagedIdentity | `id-flightdeck-dev` (AcrPull assigned) | Deployed |
| Container Apps Env | Microsoft.App/managedEnvironments | `cae-flightdeck-dev` | Deployed |
| MCP Delegated App | Microsoft.App/containerApps | `mcp-delegated-dev` | Awaiting images |
| MCP Webhook App | Microsoft.App/containerApps | `mcp-webhook-dev` | Awaiting images |
| Function App | Azure Function | `func-flightdeck-dev` — Agent orchestrator (webhook + timers) | Pending deploy |
| Storage Account | Microsoft.Storage | `stflightdeckdev` — Function App storage | Pending deploy |
| Entra App Registration | Microsoft.Entra | "FlightDeck MCP Servers" (appId: `1a46ecf3-31b0-4884-8747-b39a34e26554`) | Deployed |

### AI Foundry Agents (4, all tested)

| Agent | Model | Temperature | Purpose |
|---|---|---|---|
| `transcript-analyst` | gpt-5 (GPT-5.1) | 0.1 | Extract action items from meeting transcripts |
| `board-manager` | gpt-5-mini | N/A | Kanban CRUD, Teams/email notifications |
| `signal-monitor` | gpt-5-mini | N/A | Detect email/Teams signals, recommend actions |
| `summary-agent` | gpt-5 (GPT-5.1) | 0.3 | Board summaries, NL queries, document generation |

> **Note:** gpt-5-mini does not support the `temperature` parameter.

### Endpoints

- **Foundry Project:** `https://ai-flightdeck.services.ai.azure.com/api/projects/flightdeck-project`
- **ACR Login:** `crflightdeck.azurecr.io`
- **Key Vault:** `https://kv-flightdeck-dev.vault.azure.net/`
- **Key Vault Secrets:** `GRAPH-CLIENT-SECRET`, `GRAPH-CLIENT-ID`, `GRAPH-TENANT-ID` (all stored)

### Pending Deployment Steps

1. **Container Images** — Build and push MCP server images (`flightdeck/mcp-delegated:latest`, `flightdeck/mcp-webhook:latest`) to ACR
2. **Function App** — Deploy `func-flightdeck-dev` Azure Function (agent orchestrator with webhook + timer triggers)
3. **Agent 365 Login** — Run `npm run login` for Work IQ MCP server connections (interactive browser sign-in)

---

## Autonomous Trigger Pipeline

The Function App (`func-flightdeck-dev`) orchestrates four autonomous pipelines that drive agent activity without user interaction.

### 1. transcript-webhook

**Trigger:** Graph Change Notification (webhook) on new meeting transcripts.

```
Graph Change Notification → Function App → transcript-analyst → board-manager
```

- Microsoft Graph sends a change notification when a new meeting transcript is available.
- The Function App receives the webhook, fetches the transcript via the Delegated MCP server, and invokes the `transcript-analyst` agent.
- The transcript-analyst extracts action items and forwards them to the `board-manager` for task creation.

### 2. signal-scanner

**Trigger:** 15-minute timer.

```
15-min timer → signal-monitor → board-manager (if confidence >= 0.7)
```

- Every 15 minutes the Function App invokes the `signal-monitor` agent to scan recent email and Teams messages.
- The signal-monitor detects completion, blocker, progress, and escalation signals and fuzzy-matches them to existing board tasks.
- Recommendations with confidence >= 0.7 are forwarded to the `board-manager` for automatic board updates.

### 3. daily-summary

**Trigger:** 08:00 UTC daily timer.

```
08:00 UTC timer → summary-agent → Teams notification
```

- At 08:00 UTC each day the Function App invokes the `summary-agent` to generate a board summary.
- The summary includes sprint velocity, team workload, overdue tasks, and risk assessments.
- The output is posted as a Teams notification to the configured channel.

### 4. subscription-renewal

**Trigger:** Midnight UTC daily timer.

```
Midnight timer → auto-renew Graph webhook subscription
```

- At midnight UTC the Function App checks the Graph webhook subscription expiry.
- If the subscription is due to expire within 24 hours, it is automatically renewed.
- Ensures continuous delivery of meeting transcript change notifications without manual intervention.

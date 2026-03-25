# FlightDeck — Agentic AI Kanban Board

An enterprise agentic Kanban board built as a **Power Apps Code App** (React + TypeScript + Vite). FlightDeck automatically ingests meeting transcripts via custom MCP servers, extracts action items with AI agents, and populates a dynamically updating Kanban board.

---

## What It Does

1. **Meeting transcripts come in** via Microsoft Teams webhooks or delegated Graph API access
2. **AI agents analyse** the transcript, extract action items, assign priorities, and identify owners
3. **Tasks appear on the board** in the right columns with full traceability back to the source meeting
4. **Signal monitoring** scans for cross-board patterns, blockers, and overdue items
5. **Daily summaries** are generated automatically for stakeholder visibility

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Power Apps Code App (React 19 + Vite 7 + Tailwind CSS 4)  │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐   │
│  │ Kanban   │ │ Analytics│ │ Chat     │ │ Telemetry     │   │
│  │ Board    │ │ Dashboard│ │ Panel    │ │ Blade         │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └───────┬───────┘   │
│       └─────────────┴────────────┴───────────────┘           │
│                         │                                    │
│              @microsoft/power-apps SDK                       │
│              (postMessage bridge → CSP safe)                 │
└─────────────────────────┬───────────────────────────────────┘
                          │
              ┌───────────▼───────────┐
              │     Dataverse         │
              │  9 mc_ tables         │
              │  11 lookup relations  │
              └───────────┬───────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
   ┌─────▼─────┐  ┌──────▼──────┐  ┌──────▼──────┐
   │ Orchestrator│  │ MCP Delegated│  │ MCP Webhook │
   │ (Express +  │  │ (OBO/user    │  │ (App-level  │
   │  node-cron) │  │  transcripts)│  │  tenant)    │
   └─────┬──────┘  └─────────────┘  └─────────────┘
         │
   ┌─────▼──────────────────────┐
   │  Azure AI Foundry Agents   │
   │  ┌────────────────────┐    │
   │  │ Transcript Analyst │    │
   │  │ Board Manager      │    │
   │  │ Signal Monitor     │    │
   │  │ Summary Agent      │    │
   │  └────────────────────┘    │
   └────────────────────────────┘
```

### Three-Layer Frontend Architecture

```
Components (presentation) → Hooks (business logic + TanStack Query) → Services (Dataverse CRUD)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, TypeScript, Tailwind CSS 4 |
| UI Components | shadcn/ui, Radix UI primitives |
| State | Zustand (UI), TanStack Query (server) |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Charts | Recharts (4 chart types + TanStack data table) |
| Data | Dataverse (9 tables, `mc_` prefix) via @microsoft/power-apps SDK |
| Agents | Azure AI Foundry (GPT-5 / GPT-5-mini), 4 specialised agents |
| Orchestration | Container App (Express + node-cron), 4 triggers |
| MCP Servers | 2 custom (delegated + webhook) + Work IQ enterprise servers |
| Infrastructure | Azure Bicep IaC, Container Apps, Key Vault, App Insights |

---

## Features

### Board
- Drag-and-drop Kanban with 5 columns (Backlog → Done)
- WIP limits with visual indicators
- Task detail panel with inline editing
- Keyboard-accessible DnD (arrow keys + space)
- Real-time polling (15s refetch interval)

### Analytics
- Tasks by Status (bar chart)
- Tasks by Priority (donut chart)
- Tasks by Source (donut chart)
- Activity Over Time (stacked area chart)
- Sortable/filterable data table
- Summary cards (completion rate, agent contribution, overdue count)

### AI & Agents
- Chat panel with direct Foundry API integration
- Agent action feed with approval workflows
- Cross-board intelligence alerts
- MCP source tracking on every agent action
- Meeting transcript → task pipeline (fully automated)

### Governance
- Board settings page
- Project settings page
- Role-based access (owner/admin/member/viewer)
- Activity logging with actor attribution

---

## Dataverse Schema

9 tables with `mc_` prefix:

| Table | Purpose |
|-------|---------|
| `mc_organization` | Top-level org |
| `mc_project` | Project container |
| `mc_board` | Kanban board config |
| `mc_column` | Board columns with types and WIP limits |
| `mc_task` | Task records with priority, source, labels |
| `mc_comment` | Task comments |
| `mc_activitylog` | Audit trail (human + agent) |
| `mc_agentaction` | AI agent action records |
| `mc_boardmember` | Board membership and roles |

---

## Getting Started

### Prerequisites
- Node.js 20+
- Power Apps CLI (`pac`)
- Azure subscription (for Foundry agents and Container Apps)

### Development
```bash
npm install
npm run dev
```

### Build & Deploy
```bash
npm run build
pac pcf push --publisher-prefix mc
```

### Infrastructure
```bash
# Deploy Azure resources
az deployment group create \
  --resource-group rg-flightdeck \
  --template-file infrastructure/bicep/main.bicep
```

---

## Project Structure

```
src/
├── components/
│   ├── analytics/      # Charts, data table
│   ├── chat/           # AI chat panel
│   ├── kanban/         # Board, columns, cards, detail panel
│   ├── layout/         # AppShell, sidebar, command bar
│   ├── shared/         # ErrorBoundary, badges, avatars
│   ├── telemetry/      # Board metrics, agent feed, alerts
│   └── ui/             # shadcn/ui primitives
├── generated/          # Dataverse client, services, choice maps
├── hooks/              # TanStack Query hooks (business logic)
├── lib/                # Types, constants, utilities
├── pages/              # Route pages (lazy-loaded)
├── services/           # Service barrel exports
└── stores/             # Zustand stores (UI + board state)

infrastructure/
├── bicep/              # Azure IaC (main.bicep)
├── agents/             # AI Foundry agent definitions (4 JSON)
├── docker/             # MCP server Dockerfiles
├── functions/          # Orchestrator source
└── scripts/            # Dataverse setup & seed scripts
```

---

## Licence

Proprietary. All rights reserved.

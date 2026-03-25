# FlightDeck — Updated Architecture Plan

## What Changed

### Copilot Studio Removed
Copilot Studio has been replaced entirely. The original architecture used Studio as a middleware orchestrator with 5 topics and Direct Line for the chat UI. This created unnecessary deployment complexity (portal configuration, topic publishing, Direct Line channel setup) and added a dependency that provided no unique value.

**Before:** React SPA → Copilot Studio (5 topics, A2A gateway, Direct Line) → AI Foundry Agents
**After:** React SPA → AI Foundry Agents (direct REST API)

### What Replaced It

1. **Azure Function App** (`func-flightdeck-dev`) — handles all autonomous triggers that Studio topics previously managed:
   - `transcript-webhook` — Graph Change Notification → transcript-analyst → board-manager chain
   - `signal-scanner` — 15-min timer → signal-monitor → board-manager (if confidence >= 0.7)
   - `daily-summary` — 08:00 UTC timer → summary-agent
   - `subscription-renewal` — midnight timer → Graph webhook subscription management

2. **Direct Foundry Chat** — the React chat panel calls Foundry agents REST API directly:
   - No Direct Line WebSocket
   - No `botframework-*` dependencies
   - No Copilot Studio portal configuration
   - Same chat UX, simpler stack

### Files Deprecated
The `infrastructure/copilot-studio/` directory (5 YAML topics + README) is now superseded. Its functionality is fully covered by `infrastructure/functions/src/index.js`.

---

## Current State

### What's Built and Working

| Component | Status | Details |
|---|---|---|
| React SPA (Phases 1-4) | Built, runs locally | Board, DnD, telemetry, analytics, approval UI |
| AI Chat Panel | Built, runs locally | `ChatPanel.tsx`, `use-chat.ts`, `chat-service.ts` (mock) |
| Service Layer (11 services) | Built, mock data | `// Swap:` comments for Dataverse migration |
| AI Foundry Agents (4) | Live, tested on GPT-5 | transcript-analyst, board-manager, signal-monitor, summary-agent |
| Model Deployments | Live | gpt-5 (GPT-5.1), gpt-5-mini |
| Azure Infrastructure | Live | RG, AI Services, ACR, Key Vault, Container Apps Env, Managed Identity |
| Function App Orchestrator | Code written | `infrastructure/functions/` — not yet deployed |
| Docker MCP Servers | Dockerfiles written | Not yet built/pushed to ACR |
| Bicep IaC | Template ready | Includes Function App, Storage, App Service Plan |

### What Needs Deploying

| Step | Blocked By | What It Wires |
|---|---|---|
| 1. Deploy Function App | Nothing | Autonomous triggers (webhook, timers) |
| 2. Build + push MCP images | Nothing | Custom transcript MCP servers |
| 3. Register Graph subscription | Step 1 | Auto transcript ingestion |
| 4. Agent 365 login | User (browser sign-in) | Work IQ MCP tools for agents |
| 5. Dataverse tables | Power Platform access | Persistent data storage |
| 6. Service swap | Step 5 | Frontend ↔ live Dataverse |

### What Needs Building (Phase 5 Remaining)

| Feature | Priority | Effort |
|---|---|---|
| Chat → live Foundry API swap | High | Small (swap mock to REST call) |
| Board settings page | Medium | Medium |
| Project settings page | Medium | Medium |
| Code splitting (React.lazy) | Medium | Small |
| Virtual scrolling (@tanstack/react-virtual) | Low | Medium |
| Security audit (CSP, CORS, DLP) | High | Medium |
| Accessibility (WCAG 2.1 AA) | Medium | Medium |
| CI/CD pipeline (GitHub Actions) | High | Medium |

---

## Updated Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│  FlightDeck React SPA (Power Apps Code App)                          │
│  ┌──────┬──────────────────┬──────────┬──────────────────────┐      │
│  │ Side │  Kanban Board    │ AI Chat  │  Telemetry           │      │
│  │ bar  │  + Approval      │ Panel    │  Blade               │      │
│  │      │  Banner          │ (direct  │  Agent Status         │      │
│  │      │                  │  Foundry)│  Agent Actions        │      │
│  │ Nav  │  DnD Cards       │          │  Board Metrics        │      │
│  │      │                  │          │  Activity Feed        │      │
│  └──────┴──────────────────┴──────────┴──────────────────────┘      │
├──────────────────────────────────────────────────────────────────────┤
│  Service Layer (src/services/) — mock → Dataverse swap               │
├──────────────────────────────────────────────────────────────────────┤
│  TanStack Query + Zustand State Management                           │
└────────────────┬──────────────────────┬──────────────────────────────┘
                 │ Power Apps SDK       │ Direct Foundry REST API
                 ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Dataverse (9 mc_ tables) ◄──── AI Foundry Agents write results     │
└────────────────┬──────────────────────┬─────────────────────────────┘
                 │                      │
        ┌────────┴────────┐    ┌────────┴──────────────────────────┐
        │ Azure Function  │    │ Work IQ MCP Servers                │
        │ App (4 triggers)│    │ Mail│Calendar│Teams│User│SharePoint│
        │ transcript-wh   │    │ Copilot│OneDrive│Word│Dataverse   │
        │ signal-scanner  │    └───────────────────────────────────┘
        │ daily-summary   │
        │ sub-renewal     │    ┌───────────────────────────────────┐
        └───┬───┬───┬───┬─┘    │ Custom Transcript MCP Servers     │
            │   │   │   │      │ Delegated (OBO) + Webhook (App)   │
            ▼   ▼   ▼   ▼      └───────────────────────────────────┘
        ┌──────────────────────────────────────────────────────┐
        │ AI Foundry Agents (GPT-5 / GPT-5-mini)               │
        │ Transcript Analyst │ Board Manager                    │
        │ Signal Monitor     │ Summary Agent                    │
        └──────────────────────────────────────────────────────┘
```

---

## Deployment Sequence

```
Steps 1-3: Fully autonomous (no user interaction needed)
────────────────────────────────────────────────────────
  1. Deploy Bicep (Function App + Storage + all infra)
  2. Build + push MCP Docker images to ACR
  3. Graph webhook subscription auto-created by timer

Step 4: Requires user once
────────────────────────────────────────────────────────
  4. Agent 365 browser login (Work IQ MCP connections)

Steps 5-6: Production data
────────────────────────────────────────────────────────
  5. Create Dataverse tables (Power Platform)
  6. Swap service imports (mock → Dataverse)
```

Once Steps 1-3 are complete, FlightDeck runs fully autonomously:
- Meeting ends → transcript extracted → action items → tasks created on board
- Every 15 min → email/Teams signals scanned → board updated if confident
- Every morning → daily summary generated
- Every night → Graph subscription renewed

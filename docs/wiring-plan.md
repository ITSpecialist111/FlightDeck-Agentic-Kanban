# FlightDeck — Wiring Plan

Everything that needs connecting to make FlightDeck fully autonomous.

## Current State (what's live)

| Component | Status |
|---|---|
| AI Foundry Agents (4) | Live, tested on GPT-5 |
| Model Deployments (gpt-5, gpt-5-mini) | Live |
| Resource Group + AI Services | Live |
| Container Registry (crflightdeck.azurecr.io) | Live, 3 images pushed |
| Log Analytics + App Insights | Live |
| Key Vault (secrets stored) | Live, real secret |
| Managed Identity (AcrPull) | Live |
| Container Apps Environment | Live |
| Entra App Registration | Live, admin consent granted |
| Orchestrator Container App | Live, healthy |
| MCP Delegated Container App | Live, healthy |
| MCP Webhook Container App | Live, healthy |
| Dataverse Tables (9) | Live, seeded with default data |
| Frontend (React app) | Builds clean, runs locally |

## Autonomous Trigger Pipeline

```
┌──────────────────────────────────────────────────────────────────┐
│                    AUTONOMOUS TRIGGERS                           │
│                                                                  │
│  ┌─────────────┐    ┌──────────────────────────────────────────┐ │
│  │ Graph Change │───►│ transcript-webhook (Azure Function)      │ │
│  │ Notification │    │  1. Validate subscription                │ │
│  │ (transcript  │    │  2. Fetch transcript from Graph          │ │
│  │  created)    │    │  3. Call transcript-analyst (GPT-5)      │ │
│  └─────────────┘    │  4. Pass action items → board-manager    │ │
│                      └──────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────┐    ┌──────────────────────────────────────────┐ │
│  │ Timer        │───►│ signal-scanner (every 15 min)            │ │
│  │ (*/15 * *)   │    │  1. Call signal-monitor (GPT-5-mini)     │ │
│  └─────────────┘    │  2. If confidence >= 0.7 → board-manager │ │
│                      └──────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────┐    ┌──────────────────────────────────────────┐ │
│  │ Timer        │───►│ daily-summary (08:00 UTC)                │ │
│  │ (0 0 8 * *)  │    │  1. Call summary-agent (GPT-5)           │ │
│  └─────────────┘    │  2. Post to Teams via Work IQ             │ │
│                      └──────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────┐    ┌──────────────────────────────────────────┐ │
│  │ Timer        │───►│ subscription-renewal (midnight)          │ │
│  │ (0 0 0 * *)  │    │  1. Check Graph subscription status      │ │
│  └─────────────┘    │  2. Renew or create (3-day max expiry)   │ │
│                      └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## Wiring Steps (in order)

### Step 1: Deploy Orchestrator ✅ DONE
Deployed as a Container App (not Function App — subscription has 0 VM quota):
```
orchestrator-dev.yellowmeadow-084e6936.uksouth.azurecontainerapps.io
```
Express + node-cron server with 4 triggers: transcript-webhook (HTTP POST), signal-scanner (*/15 cron), daily-summary (08:00 cron), subscription-renewal (midnight cron).

**Wires:** Graph webhook endpoint, agent orchestration, timer triggers.

### Step 2: Build and Push MCP Server Images ✅ DONE
All 3 images built via ACR Tasks and deployed:
```
mcp-delegated-dev.yellowmeadow-084e6936.uksouth.azurecontainerapps.io
mcp-webhook-dev.yellowmeadow-084e6936.uksouth.azurecontainerapps.io
```
Built from real MCP repos (MicrosoftGraph_Transcript_MCP + TranscriptsWebhookMCP).

**Wires:** Custom Transcript MCP servers (delegated + webhook).

### Step 3: Register Graph Change Notification ✅ DONE
Orchestrator webhook endpoint:
```
https://orchestrator-dev.yellowmeadow-084e6936.uksouth.azurecontainerapps.io/api/transcript-webhook
```
The `subscription-renewal` cron (midnight) automatically creates and renews the Graph subscription.

**Wires:** Automatic transcript ingestion when meetings end.

### Step 4: Agent 365 Login ✅ DONE
Interactive browser sign-in completed via Device Code flow. Required enabling "Allow public client flows" on the Entra app (`9b00c7ab`).

Discovered **61 tools** across 14 Work IQ MCP servers:
- mcp_MailTools (22), mcp_CalendarTools (13), mcp_SharePointListsTools (13)
- mcp_KnowledgeTools (5), mcp_WordServer (4), mcp_ExcelServer (4)
- Auth record cached at `~/.agent365-bridge/auth-record.json`

**Wires:** Work IQ MCP tools for all 4 agents.

### Step 5: Dataverse Tables ✅ DONE
All 9 Dataverse tables created with `mc_` prefix in the ABS Power Platform environment (`https://orged45fd63.crm.dynamics.com`):
- mc_organization, mc_project, mc_board, mc_column, mc_task
- mc_comment, mc_activitylog, mc_agentaction, mc_boardmember

All columns added, 11 lookup relationships created, default data seeded (FlightDeck Demo org, Default Project, Sprint Board, 5 columns).

Schema documented in `docs/dataverse-setup.md`. Scripts in `infrastructure/scripts/`.

**Wires:** Persistent data storage, swaps mock services to live Dataverse.

### Step 6: Frontend Service Swap ✅ DONE
All 9 entity service files swapped from mock to Dataverse:
- Created `src/generated/dataverse-client.ts` — wraps `@microsoft/power-apps/data` `DataClient`
- Created `src/generated/choice-maps.ts` — Dataverse integer ↔ TypeScript string union mappings
- Created 9 service wrappers in `src/generated/services/Mc*.ts` with `fromDv`/`toDv` mappers
- Each `src/services/*-service.ts` now re-exports the generated Dataverse service
- Board store defaults updated from mock IDs to live Dataverse GUIDs
- Chat service remains mock (separate Foundry API swap, not Dataverse)
- Build passes clean (`tsc --noEmit` + `vite build`)

**Wires:** Frontend ↔ Dataverse live data.

## What Runs Without User Intervention

Once Steps 1–3 are done, the following runs fully autonomously:
- New meeting transcript → action items extracted → tasks created on board
- Email/Teams signals scanned every 15 min → board updates recommended
- Daily summary generated at 08:00 UTC
- Graph webhook subscription auto-renewed nightly

Step 4 (Agent 365 login) adds Work IQ capabilities to the agents.
Steps 5–6 are for the full production deployment.

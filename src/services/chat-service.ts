/**
 * ChatService — AI chat via Azure AI Foundry agents REST API.
 *
 * Calls the summary-agent deployed in AI Foundry for board queries,
 * task status, team workload, and sprint insights.
 *
 * Conversation history is maintained client-side (Foundry runs are stateless)
 * and sent as context with each request so the agent can reference prior turns.
 *
 * Token acquisition:
 *   - In Power Apps: uses the host platform auth context (getContext → OBO token)
 *   - For local dev: set VITE_FOUNDRY_TOKEN env var, or falls back to mock responses
 */

import { FoundryAgentClient } from "@/generated/clients/FoundryAgentClient"
import type { FoundryMessage } from "@/generated/clients/FoundryAgentClient"
import type { ChatMessage, ChatConversation } from "@/lib/types"

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const FOUNDRY_ENDPOINT =
  "https://ai-flightdeck.services.ai.azure.com/api/projects/flightdeck-project"

const AGENT_NAME = "summary-agent"

// ---------------------------------------------------------------------------
// Token provider
// ---------------------------------------------------------------------------

/**
 * Resolve an access token for the Foundry API.
 *
 * Priority:
 *  1. Power Apps host context (production) — imports getContext dynamically
 *     so local builds without the Power Apps host don't crash.
 *  2. VITE_FOUNDRY_TOKEN environment variable (local dev with a real agent).
 *  3. Empty string — caught downstream so the service falls back to mock.
 */
async function resolveToken(): Promise<string> {
  // 1. Try Power Apps host context (available when deployed as a Code App)
  try {
    const { getContext } = await import("@microsoft/power-apps/app")
    const ctx = await getContext()
    // The host session includes an OBO token we can use for Foundry calls.
    // Access it from appSettings if the platform provides it.
    const token = (ctx.app.appSettings as Record<string, string>)?.foundryToken
    if (token) return token
  } catch {
    // Not running inside Power Apps host — expected during local dev.
  }

  // 2. Env var for local testing against live Foundry
  if (import.meta.env.VITE_FOUNDRY_TOKEN) {
    return import.meta.env.VITE_FOUNDRY_TOKEN as string
  }

  // 3. No token available — the service will fall back to mock responses
  return ""
}

// ---------------------------------------------------------------------------
// Foundry client (lazy singleton)
// ---------------------------------------------------------------------------

let _client: FoundryAgentClient | null = null

function getClient(): FoundryAgentClient {
  if (!_client) {
    _client = new FoundryAgentClient(FOUNDRY_ENDPOINT, resolveToken)
  }
  return _client
}

// ---------------------------------------------------------------------------
// Conversation state (client-side, since Foundry runs are stateless)
// ---------------------------------------------------------------------------

let conversation: ChatConversation = {
  id: "conv-1",
  messages: [],
  createdOn: new Date().toISOString(),
}

// ---------------------------------------------------------------------------
// Mock fallback (used when no auth token is available)
// ---------------------------------------------------------------------------

interface MockCommandResult {
  text: string
  agentName: string
}

/** Generate a UK-formatted date N days from now. */
function futureDateUK(daysAhead: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

/** Generate today's date in short UK format (dd/MM/yyyy). */
function todayUK(): string {
  return new Date().toLocaleDateString("en-GB")
}

// ---- Command patterns (order matters — first match wins) ----

const COMMAND_PATTERNS: Array<{
  pattern: RegExp
  handler: (match: RegExpMatchArray) => MockCommandResult
}> = [
  // 1. Create board
  {
    pattern:
      /(?:create\s+(?:a\s+)?(?:new\s+)?board\s+(?:called\s+|named\s+|for\s+)?|new\s+board\s+(?:called\s+|named\s+|for\s+)?)(.+)/i,
    handler: (m) => ({
      text:
        `I've created a new board called '${m[1].trim()}' with standard sprint columns ` +
        `(Backlog, To Do, In Progress, Review, Done). Would you like me to add team members?`,
      agentName: "board-manager",
    }),
  },

  // 2. Create / add task
  {
    pattern:
      /(?:create\s+(?:a\s+)?(?:new\s+)?task\s+|add\s+(?:a\s+)?(?:new\s+)?task\s+)(.+)/i,
    handler: (m) => ({
      text:
        `Task '${m[1].trim()}' has been created in the Backlog column with medium priority. ` +
        `Would you like me to assign it to someone?`,
      agentName: "board-manager",
    }),
  },

  // 3. Move task to column
  {
    pattern: /move\s+(.+?)\s+to\s+(.+)/i,
    handler: (m) => ({
      text:
        `Done! I've moved '${m[1].trim()}' to ${m[2].trim()}. The board has been updated.`,
      agentName: "board-manager",
    }),
  },

  // 4. Assign task to person
  {
    pattern: /assign\s+(.+?)\s+to\s+(.+)/i,
    handler: (m) => ({
      text:
        `'${m[1].trim()}' has been assigned to ${m[2].trim()}. ` +
        `I've checked their calendar and they have capacity this sprint.`,
      agentName: "board-manager",
    }),
  },

  // 5. Predict completion
  {
    pattern: /predict\s+(?:completion\s+(?:for\s+)?|when\s+will\s+)(.+?)(?:\s+be\s+(?:done|completed|finished))?$/i,
    handler: (m) => {
      const daysAhead = 5 + Math.floor(Math.random() * 6) // 5-10 days
      return {
        text:
          `Based on historical velocity and task complexity, I estimate '${m[1].trim()}' ` +
          `will be completed by **${futureDateUK(daysAhead)}**. Confidence: **82%**.\n\n` +
          `Factors considered:\n` +
          `- Similar tasks averaged 4.3 days to completion\n` +
          `- Current assignee's throughput is above team average\n` +
          `- No blocking dependencies detected`,
        agentName: "summary-agent",
      }
    },
  },

  // 6. Who should work on
  {
    pattern: /who\s+should\s+(?:work\s+on|take|handle|pick\s+up)\s+(.+)/i,
    handler: (m) => {
      const people = [
        { name: "Sarah", area: "frontend architecture", tasks: 2 },
        { name: "James", area: "backend APIs", tasks: 3 },
        { name: "Priya", area: "data engineering", tasks: 1 },
        { name: "Tom", area: "DevOps and infrastructure", tasks: 2 },
      ]
      const pick = people[Math.floor(Math.random() * people.length)]
      return {
        text:
          `I'd recommend **${pick.name}** for '${m[1].trim()}' based on their expertise ` +
          `in ${pick.area} and current workload (${pick.tasks} tasks). They're available ` +
          `this week according to their calendar.\n\n` +
          `Alternative: You could also consider cross-training another team member on this area.`,
        agentName: "board-manager",
      }
    },
  },

  // 7. Board summary / status (enhanced — catches "summarise board", "board summary",
  //    "what's the status", "overview", and plain "summary")
  {
    pattern:
      /(?:summari[sz]e\s+(?:the\s+)?board|board\s+summary|what(?:'s| is)\s+the\s+status|give\s+me\s+(?:a\s+)?(?:board\s+)?summary|overview|status\s+(?:update|report))/i,
    handler: () => ({
      text:
        `**Board Summary (${todayUK()})**\n\n` +
        `| Column | Tasks |\n` +
        `|--------|-------|\n` +
        `| Backlog | 6 |\n` +
        `| To Do | 4 |\n` +
        `| In Progress | 5 |\n` +
        `| Review | 3 |\n` +
        `| Done | 8 |\n\n` +
        `**Highlights:**\n` +
        `- **2 overdue** items: *API rate limiting* (3 days) and *Database migration* (1 day)\n` +
        `- **2 blocked** tasks requiring attention\n` +
        `- Sprint velocity: **4.2 tasks/day** (up 8% from last week)\n` +
        `- **Sarah** has the highest WIP (4 tasks) — consider rebalancing\n\n` +
        `**Recent agent actions:**\n` +
        `- transcript-analyst extracted 3 tasks from yesterday's standup\n` +
        `- signal-monitor flagged a dependency risk on *Infrastructure upgrade*\n` +
        `- summary-agent updated sprint burndown projection`,
      agentName: "summary-agent",
    }),
  },

  // 8. Blocked tasks (existing, now with agentName)
  {
    pattern: /block/i,
    handler: () => ({
      text:
        "There are currently **2 blocked tasks**:\n\n" +
        "1. **Database migration** — waiting on DevOps PR approval (assigned to James)\n" +
        "2. **API rate limiting** — depends on infrastructure team capacity planning\n\n" +
        "Both are flagged for escalation if unresolved by Friday.",
      agentName: "summary-agent",
    }),
  },
]

// ---- Default fallback ----

const DEFAULT_MOCK: MockCommandResult = {
  text:
    "I can help you with board queries, task operations, team workload, and sprint insights. Try asking:\n\n" +
    '- "Create a board called Phoenix"\n' +
    '- "Add task Design login page"\n' +
    '- "Move API integration to Review"\n' +
    '- "Assign Dashboard redesign to Sarah"\n' +
    '- "Summarise board"\n' +
    '- "What\'s blocked?"\n' +
    '- "Predict completion for API integration"\n' +
    '- "Who should work on Database migration?"',
  agentName: "summary-agent",
}

function getMockResponse(input: string): MockCommandResult {
  for (const { pattern, handler } of COMMAND_PATTERNS) {
    const match = input.match(pattern)
    if (match) return handler(match)
  }
  return DEFAULT_MOCK
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert local ChatMessage[] into the Foundry conversation_history format. */
function toFoundryHistory(messages: ChatMessage[]): FoundryMessage[] {
  return messages.map((m) => ({ role: m.role, content: m.content }))
}

/** Check whether a live Foundry call is possible (token available). */
async function canUseLiveAgent(): Promise<boolean> {
  try {
    const token = await resolveToken()
    return token.length > 0
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const ChatService = {
  /**
   * Return the current conversation (messages are held in memory).
   */
  async getConversation(): Promise<ChatConversation> {
    return conversation
  },

  /**
   * Send a message and receive the agent's response.
   *
   * If a Foundry token is available the message is sent to the live
   * summary-agent. Otherwise a deterministic mock response is returned
   * so local development works without credentials.
   */
  async sendMessage(content: string): Promise<ChatMessage> {
    // 1. Record the user message locally
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content,
      agentName: null,
      createdOn: new Date().toISOString(),
    }
    conversation.messages.push(userMsg)

    // 2. Get the agent response (live or mock)
    let responseText: string
    let resolvedAgentName: string = AGENT_NAME

    if (await canUseLiveAgent()) {
      // Build conversation history (everything except the message we just added)
      const history = toFoundryHistory(
        conversation.messages.slice(0, -1), // prior turns only
      )
      responseText = await getClient().createRun(
        AGENT_NAME,
        content,
        history,
      )
    } else {
      // Fallback: simulated delay + mock response with command detection
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 400))
      const mockResult = getMockResponse(content)
      responseText = mockResult.text
      resolvedAgentName = mockResult.agentName
    }

    // 3. Record the assistant message locally
    const assistantMsg: ChatMessage = {
      id: `msg-${Date.now() + 1}`,
      role: "assistant",
      content: responseText,
      agentName: resolvedAgentName,
      createdOn: new Date().toISOString(),
    }
    conversation.messages.push(assistantMsg)

    return assistantMsg
  },

  /**
   * Clear the conversation and start fresh.
   */
  async clearConversation(): Promise<void> {
    conversation = {
      id: `conv-${Date.now()}`,
      messages: [],
      createdOn: new Date().toISOString(),
    }
  },
}

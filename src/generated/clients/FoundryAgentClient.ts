/**
 * FoundryAgentClient — wraps the Azure AI Foundry agents REST API.
 *
 * Handles token acquisition, request/response mapping, and error handling.
 * The client is stateless per-request; conversation history is managed by the caller.
 *
 * Foundry API pattern:
 *   POST {endpoint}/agents/{agent-name}/runs
 *   Authorization: Bearer {token}
 *   Body: { input: string }
 *   Response: { id: string, output: string, status: string }
 */

/** Function that returns an access token for the Foundry API. */
export type TokenProvider = () => Promise<string>

/** Shape of a single message sent as conversation context. */
export interface FoundryMessage {
  role: "user" | "assistant"
  content: string
}

/** Request body for creating a Foundry agent run. */
export interface FoundryRunRequest {
  input: string
  conversation_history?: FoundryMessage[]
}

/** Response from a Foundry agent run. */
export interface FoundryRunResponse {
  id: string
  output: string
  status: "completed" | "failed" | "running"
}

export class FoundryAgentClient {
  private readonly endpoint: string
  private readonly getToken: TokenProvider

  constructor(endpoint: string, tokenProvider: TokenProvider) {
    this.endpoint = endpoint.replace(/\/$/, "") // strip trailing slash
    this.getToken = tokenProvider
  }

  /**
   * Create a run against a named Foundry agent.
   *
   * @param agentName  The agent to invoke (e.g. "summary-agent")
   * @param input      The user's current message
   * @param history    Prior conversation messages for context (optional)
   * @returns          The agent's response text
   * @throws           On network errors, auth failures, or non-OK HTTP status
   */
  async createRun(
    agentName: string,
    input: string,
    history?: FoundryMessage[],
  ): Promise<string> {
    const token = await this.getToken()
    const url = `${this.endpoint}/agents/${encodeURIComponent(agentName)}/runs`

    const body: FoundryRunRequest = { input }
    if (history && history.length > 0) {
      body.conversation_history = history
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error")
      throw new Error(
        `Foundry agent "${agentName}" returned ${response.status}: ${errorText}`,
      )
    }

    const data: FoundryRunResponse = await response.json()

    if (data.status === "failed") {
      throw new Error(
        `Foundry agent "${agentName}" run ${data.id} failed: ${data.output}`,
      )
    }

    return data.output
  }
}

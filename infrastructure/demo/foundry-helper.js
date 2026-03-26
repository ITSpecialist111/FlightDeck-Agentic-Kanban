/**
 * FlightDeck Demo — Foundry Agent helper
 *
 * Calls AI Foundry agents via REST API using Azure CLI tokens.
 * Same pattern as infrastructure/functions/src/index.js.
 */

const FOUNDRY_ENDPOINT =
  "https://ai-flightdeck.services.ai.azure.com/api/projects/flightdeck-project";
const API_VERSION = "2025-05-15-preview";

let _token = null;
let _tokenExpiry = 0;

/**
 * Get Foundry access token via Azure CLI.
 */
async function getFoundryToken() {
  if (_token && Date.now() < _tokenExpiry) return _token;

  const { execSync } = await import("child_process");
  const result = execSync(
    `az account get-access-token --resource "https://ai.azure.com" --query accessToken -o tsv`,
    { encoding: "utf8", timeout: 30000 }
  ).trim();

  _token = result;
  _tokenExpiry = Date.now() + 45 * 60 * 1000;
  return _token;
}

/**
 * Invoke a Foundry agent and return its text output.
 *
 * @param {string} agentName - One of: transcript-analyst, board-manager, signal-monitor, summary-agent
 * @param {string} input - The input/prompt text for the agent
 * @returns {Promise<string>} - The agent's text response
 */
export async function invokeAgent(agentName, input) {
  const token = await getFoundryToken();

  const res = await fetch(
    `${FOUNDRY_ENDPOINT}/agents/${agentName}/runs?api-version=${API_VERSION}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Agent ${agentName} failed (${res.status}): ${err}`);
  }

  const data = await res.json();

  // Handle both response formats (direct output string vs nested array)
  if (typeof data.output === "string") return data.output;
  if (data.output?.[0]?.content?.[0]?.text) return data.output[0].content[0].text;

  return JSON.stringify(data);
}

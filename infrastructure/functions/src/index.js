/**
 * FlightDeck Agent Orchestrator
 *
 * Express server with cron-scheduled triggers, deployed as a Container App.
 *
 * 1. transcript-webhook   — POST /api/transcript-webhook: receives Graph Change
 *                           Notifications when a new meeting transcript is available,
 *                           validates the subscription, fetches transcript, calls
 *                           transcript-analyst → board-manager agent chain.
 *
 * 2. signal-scanner       — Cron (every 15 min): calls signal-monitor agent to
 *                           scan email/Teams for status change signals, then
 *                           passes recommendations to board-manager.
 *
 * 3. daily-summary        — Cron (08:00 UTC daily): calls summary-agent to
 *                           generate board summary.
 *
 * 4. subscription-renewal — Cron (midnight UTC): creates/renews Graph webhook
 *                           subscriptions for transcript notifications.
 *
 * Environment variables (from Key Vault via Container App secrets):
 *   FOUNDRY_ENDPOINT    — AI Foundry project endpoint
 *   GRAPH_TENANT_ID     — Entra tenant ID
 *   GRAPH_CLIENT_ID     — App registration client ID
 *   GRAPH_CLIENT_SECRET — App registration client secret
 *   PORT                — HTTP listen port (default 7071)
 */

const express = require("express");
const cron = require("node-cron");
const { DefaultAzureCredential } = require("@azure/identity");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 7071;
const FOUNDRY_ENDPOINT = process.env.FOUNDRY_ENDPOINT;
const API_VERSION = "2025-05-15-preview";

// ── Helper: invoke a Foundry agent ──────────────────────────────────────────
async function invokeAgent(agentName, inputText) {
  const credential = new DefaultAzureCredential();
  const token = await credential.getToken("https://ai.azure.com/.default");

  const res = await fetch(
    `${FOUNDRY_ENDPOINT}/agents/${agentName}/runs?api-version=${API_VERSION}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input: inputText }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Agent ${agentName} failed (${res.status}): ${err}`);
  }

  return res.json();
}

// ── Helper: get Graph access token (client credentials) ─────────────────────
async function getGraphToken() {
  const tenantId = process.env.GRAPH_TENANT_ID;
  const clientId = process.env.GRAPH_CLIENT_ID;
  const clientSecret = process.env.GRAPH_CLIENT_SECRET;

  const res = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://graph.microsoft.com/.default",
      }),
    }
  );

  const data = await res.json();
  return data.access_token;
}

// ── Helper: fetch transcript content from Graph ─────────────────────────────
async function fetchTranscript(meetingId, transcriptId) {
  const token = await getGraphToken();

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/communications/onlineMeetings/${meetingId}/transcripts/${transcriptId}/content?$format=text/vtt`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch transcript: ${res.status}`);
  }

  return res.text();
}

// ═══════════════════════════════════════════════════════════════════════════
// Health check
// ═══════════════════════════════════════════════════════════════════════════
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// ═══════════════════════════════════════════════════════════════════════════
// 1. TRANSCRIPT WEBHOOK — receives Graph Change Notifications
// ═══════════════════════════════════════════════════════════════════════════
app.post("/api/transcript-webhook", async (req, res) => {
  // Graph subscription validation handshake
  const validationToken = req.query.validationToken;
  if (validationToken) {
    console.log("Graph subscription validation request received");
    return res.type("text/plain").status(200).send(validationToken);
  }

  // Process change notification
  const notifications = req.body?.value || [];

  for (const notification of notifications) {
    try {
      const resource = notification.resource;
      console.log(`Transcript notification: ${resource}`);

      const parts = resource.split("/");
      const meetingId = parts[2];
      const transcriptId = parts[4];

      const transcriptContent = await fetchTranscript(meetingId, transcriptId);

      // Chain 1: transcript-analyst extracts action items
      console.log("Invoking transcript-analyst agent...");
      const analysisResult = await invokeAgent(
        "transcript-analyst",
        `Extract action items from this meeting transcript:\n\n${transcriptContent}`
      );

      const actionItems =
        analysisResult?.output?.[0]?.content?.[0]?.text || "[]";
      console.log(`Transcript analysis complete: ${actionItems.length} chars`);

      // Chain 2: board-manager creates tasks from action items
      console.log("Invoking board-manager agent...");
      await invokeAgent(
        "board-manager",
        `Create tasks from these extracted action items:\n${actionItems}`
      );

      console.log(`Pipeline complete for transcript ${transcriptId}`);
    } catch (err) {
      console.error(`Error processing notification: ${err.message}`);
    }
  }

  res.status(202).send();
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. SIGNAL SCANNER — polls email/Teams every 15 minutes
// ═══════════════════════════════════════════════════════════════════════════
cron.schedule("*/15 * * * *", async () => {
  console.log("Signal scanner triggered at:", new Date().toISOString());

  try {
    const scanResult = await invokeAgent(
      "signal-monitor",
      "Scan the last 15 minutes of emails and Teams messages for task status signals. Match any detected signals against the current board tasks."
    );

    const recommendations =
      scanResult?.output?.[0]?.content?.[0]?.text || "{}";
    console.log(`Signal scan complete: ${recommendations.length} chars`);

    try {
      const parsed = JSON.parse(recommendations);
      const signals = Array.isArray(parsed) ? parsed : [parsed];

      for (const signal of signals) {
        if (signal.confidence >= 0.7) {
          console.log(
            `High-confidence signal: ${signal.signal_type} for ${signal.matched_task_id}`
          );
          await invokeAgent(
            "board-manager",
            `Execute this recommended board action:\n${JSON.stringify(signal)}`
          );
        } else {
          console.log(
            `Low-confidence signal flagged for review: ${JSON.stringify(signal)}`
          );
        }
      }
    } catch {
      console.log("Signal output was not structured JSON, skipping auto-action");
    }
  } catch (err) {
    console.error(`Signal scanner error: ${err.message}`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. DAILY SUMMARY — generates board digest at 08:00 UTC
// ═══════════════════════════════════════════════════════════════════════════
cron.schedule("0 8 * * *", async () => {
  console.log("Daily summary triggered at:", new Date().toISOString());

  try {
    const summaryResult = await invokeAgent(
      "summary-agent",
      "Generate a daily board summary. Include: tasks completed yesterday, tasks in progress, blocked items, overdue tasks, and team workload breakdown. Format as a concise Teams-ready message."
    );

    const summary =
      summaryResult?.output?.[0]?.content?.[0]?.text || "No summary available";
    console.log(`Daily summary generated: ${summary.length} chars`);
    console.log("Daily summary:\n" + summary);
  } catch (err) {
    console.error(`Daily summary error: ${err.message}`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. SUBSCRIPTION MANAGER — creates/renews Graph webhook subscriptions
// ═══════════════════════════════════════════════════════════════════════════
cron.schedule("0 0 * * *", async () => {
  console.log("Checking Graph subscription status...");

  try {
    const token = await getGraphToken();

    // Build the webhook notification URL from the orchestrator's own FQDN
    const webhookUrl = process.env.WEBHOOK_NOTIFICATION_URL;
    if (!webhookUrl) {
      console.warn("WEBHOOK_NOTIFICATION_URL not set, skipping subscription management");
      return;
    }

    // List existing subscriptions
    const listRes = await fetch(
      "https://graph.microsoft.com/v1.0/subscriptions",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const existing = await listRes.json();

    const transcriptSub = (existing.value || []).find(
      (s) => s.resource === "communications/onlineMeetings/getAllTranscripts"
    );

    if (transcriptSub) {
      const newExpiry = new Date(
        Date.now() + 3 * 24 * 60 * 60 * 1000
      ).toISOString();

      await fetch(
        `https://graph.microsoft.com/v1.0/subscriptions/${transcriptSub.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ expirationDateTime: newExpiry }),
        }
      );
      console.log(`Subscription renewed until ${newExpiry}`);
    } else {
      const expiry = new Date(
        Date.now() + 3 * 24 * 60 * 60 * 1000
      ).toISOString();

      const createRes = await fetch(
        "https://graph.microsoft.com/v1.0/subscriptions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            changeType: "created",
            notificationUrl: webhookUrl,
            resource: "communications/onlineMeetings/getAllTranscripts",
            expirationDateTime: expiry,
            clientState: "flightdeck-transcript-webhook",
          }),
        }
      );

      if (createRes.ok) {
        const sub = await createRes.json();
        console.log(`New subscription created: ${sub.id}, expires ${expiry}`);
      } else {
        const err = await createRes.text();
        console.error(`Failed to create subscription: ${err}`);
      }
    }
  } catch (err) {
    console.error(`Subscription renewal error: ${err.message}`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// Start server
// ═══════════════════════════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log(`FlightDeck Orchestrator listening on port ${PORT}`);
  console.log("Cron schedules active:");
  console.log("  - signal-scanner:       every 15 minutes");
  console.log("  - daily-summary:        08:00 UTC daily");
  console.log("  - subscription-renewal: midnight UTC daily");
});

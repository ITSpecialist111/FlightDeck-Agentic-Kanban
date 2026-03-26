/**
 * Demo Scenario: Email signals
 *
 * Simulated email signals that trigger task status changes.
 * These feed the Signal Monitor agent to demonstrate auto-detection.
 */

/**
 * Completion signal — Sarah finished the report investigation.
 */
export const COMPLETION_EMAIL = {
  from: "Sarah Chen <sarah.chen@contoso.com>",
  to: "team-phoenix@contoso.com",
  subject: "RE: Report performance — root cause found and fixed",
  body: `Hi team,

Quick update — I've finished profiling the report engine. As I suspected, the aggregation
queries were hitting the raw transaction table (14M rows) instead of the materialised views.

I've rewritten the three worst queries to use the pre-aggregated views and the P95 response
time dropped from 12 seconds to 340ms.

The fix is deployed to staging and I've verified all report types generate correctly.
Ready for sign-off whenever someone can review.

This one's done from my side.

Cheers,
Sarah`,
  receivedDate: new Date().toISOString(),
  signalType: "completion",
  expectedAction: "move_task_to_done",
};

/**
 * Blocker signal — Marcus is blocked on notifications.
 */
export const BLOCKER_EMAIL = {
  from: "Marcus Johnson <marcus.j@contoso.com>",
  to: "Graham Hosking <admin@ABSx02771022.onmicrosoft.com>",
  subject: "Blocked: WebSocket port not open on staging firewall",
  body: `Graham,

I'm blocked on the real-time notification task. The WebSocket connections keep timing out
because port 8443 isn't open on the staging firewall.

I've raised a ticket with the infra team but they say it needs your approval as it's a
network change. Can you approve the firewall rule change?

I can't proceed until this is resolved. Everything else is ready — the Socket.io server
is coded and tested locally.

Thanks,
Marcus`,
  receivedDate: new Date().toISOString(),
  signalType: "blocker",
  expectedAction: "set_blocked",
};

/**
 * Progress signal — Priya is halfway through documentation.
 */
export const PROGRESS_EMAIL = {
  from: "Priya Patel <priya.patel@contoso.com>",
  to: "team-phoenix@contoso.com",
  subject: "Client onboarding docs — first draft halfway done",
  body: `Hi everyone,

Just a progress update on the onboarding documentation. I've completed the API authentication
section and the webhook setup guide. Started working on the data migration steps.

I'd estimate I'm about 60% done. Will have a complete first draft by Monday for review.

Also, Alex and I looked at the JWT rotation issue this afternoon. We've identified the bug —
the refresh token endpoint was caching the old signing key. Simple fix, we'll have a PR up
tomorrow.

Priya`,
  receivedDate: new Date().toISOString(),
  signalType: "progress",
  expectedAction: "add_comment",
};

/**
 * Escalation signal — stakeholder urgency.
 */
export const ESCALATION_EMAIL = {
  from: "Victoria Reynolds <v.reynolds@clientcorp.com>",
  to: "Graham Hosking <admin@ABSx02771022.onmicrosoft.com>",
  subject: "URGENT: Production go-live at risk — need notification system by EOD Thursday",
  body: `Graham,

Our CEO has moved the board presentation to Friday morning. We absolutely need the real-time
notification system working in production by end of day Thursday. This is now critical path.

If the WebSocket issue can't be resolved, can we fall back to SSE as a temporary solution?
Whatever it takes — this is our top priority.

Please treat this as ASAP.

Thanks,
Victoria`,
  receivedDate: new Date().toISOString(),
  signalType: "escalation",
  expectedAction: "update_priority_to_critical",
};

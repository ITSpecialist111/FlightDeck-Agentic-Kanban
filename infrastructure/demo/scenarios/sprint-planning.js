/**
 * Demo Scenario: Project Phoenix Sprint Planning
 *
 * A realistic Teams meeting transcript that the Transcript Analyst
 * will parse into action items. Designed to produce 4-5 tasks
 * with clear owners, priorities, and due dates.
 */

export const MEETING_TITLE = "Project Phoenix — Sprint Planning (Week 14)";
export const MEETING_DATE = new Date().toISOString().split("T")[0];

export const TRANSCRIPT = `WEBVTT

00:00:01.000 --> 00:00:05.000
<v Graham Hosking>Right, let's kick off the sprint planning for week 14. We've got a tight deadline on the Phoenix launch so let's make every task count.</v>

00:00:06.000 --> 00:00:14.000
<v Sarah Chen>Before we start, quick update — the API gateway migration is done. All endpoints are now going through the new gateway. We can close that one off.</v>

00:00:15.000 --> 00:00:25.000
<v Graham Hosking>Brilliant, nice one Sarah. OK so the big priorities this week. First, we absolutely need the real-time notification system wired up. Marcus, can you take that? We need WebSocket connections for the dashboard alerts. Due by Friday.</v>

00:00:26.000 --> 00:00:35.000
<v Marcus Johnson>Yeah, I'll pick that up. I'll use Socket.io with the existing Express backend. Should be straightforward. I'll have a PR up by Thursday.</v>

00:00:36.000 --> 00:00:48.000
<v Graham Hosking>Perfect. Second thing — Priya, the client onboarding documentation is critical. The sales team is screaming for it. Can you write up the technical onboarding guide? We need it by Wednesday next week at the latest.</v>

00:00:49.000 --> 00:00:56.000
<v Priya Patel>Yes, I'll start on that today. I'll include the API authentication flow, the webhook setup, and the data migration steps.</v>

00:00:57.000 --> 00:01:10.000
<v Graham Hosking>Great. Third — we've had three customer complaints about the report generation being slow. Sarah, can you investigate the performance bottleneck in the report engine? This is high priority.</v>

00:01:11.000 --> 00:01:18.000
<v Sarah Chen>I already have a suspicion it's the aggregation queries hitting the raw data instead of the materialised views. I'll profile it and have findings by Tuesday.</v>

00:01:19.000 --> 00:01:32.000
<v Graham Hosking>Good shout. And lastly, Alex flagged a security concern — the JWT tokens aren't rotating properly in the staging environment. It's not critical yet but it needs fixing before we go to production. Priya, can you pair with Alex on that? Medium priority, due end of next week.</v>

00:01:33.000 --> 00:01:40.000
<v Priya Patel>Sure, I'll sync with Alex this afternoon. We might need to update the auth middleware.</v>

00:01:41.000 --> 00:01:52.000
<v Graham Hosking>Alright, that's a solid sprint. To summarise — Marcus on real-time notifications, Priya on client onboarding docs and the JWT rotation fix, Sarah on report performance. Let's smash it.</v>

00:01:53.000 --> 00:01:55.000
<v Sarah Chen>Let's go!</v>

00:01:56.000 --> 00:01:58.000
<v Marcus Johnson>On it!</v>
`;

/**
 * Expected action items the Transcript Analyst should extract.
 * Used as a fallback if the live agent call fails.
 */
export const EXPECTED_ACTIONS = [
  {
    title: "Build real-time notification system with WebSocket support",
    description: "Wire up WebSocket connections using Socket.io with the existing Express backend to enable real-time dashboard alerts. PR expected by Thursday.",
    assigneeName: "Marcus Johnson",
    priority: "high",
    dueDate: fridayThisWeek(),
    labels: ["real-time", "websocket", "dashboard"],
    confidence: 0.95,
  },
  {
    title: "Write client onboarding technical documentation",
    description: "Create technical onboarding guide covering API authentication flow, webhook setup, and data migration steps. Sales team needs it urgently.",
    assigneeName: "Priya Patel",
    priority: "critical",
    dueDate: wednesdayNextWeek(),
    labels: ["documentation", "onboarding", "client-facing"],
    confidence: 0.92,
  },
  {
    title: "Investigate report generation performance bottleneck",
    description: "Profile the report engine to identify performance bottleneck. Suspected cause: aggregation queries hitting raw data instead of materialised views. Three customer complaints received.",
    assigneeName: "Sarah Chen",
    priority: "high",
    dueDate: tuesdayThisWeek(),
    labels: ["performance", "reports", "customer-impact"],
    confidence: 0.90,
  },
  {
    title: "Fix JWT token rotation in staging environment",
    description: "JWT tokens aren't rotating properly in staging. Needs fixing before production launch. May require auth middleware update. Pair with Alex Wright on this.",
    assigneeName: "Priya Patel",
    priority: "medium",
    dueDate: fridayNextWeek(),
    labels: ["security", "auth", "staging"],
    confidence: 0.88,
  },
];

function fridayThisWeek() {
  const d = new Date();
  d.setDate(d.getDate() + (5 - d.getDay()));
  return d.toISOString().split("T")[0];
}

function wednesdayNextWeek() {
  const d = new Date();
  d.setDate(d.getDate() + (10 - d.getDay()));
  return d.toISOString().split("T")[0];
}

function tuesdayThisWeek() {
  const d = new Date();
  d.setDate(d.getDate() + (9 - d.getDay()));
  return d.toISOString().split("T")[0];
}

function fridayNextWeek() {
  const d = new Date();
  d.setDate(d.getDate() + (12 - d.getDay()));
  return d.toISOString().split("T")[0];
}

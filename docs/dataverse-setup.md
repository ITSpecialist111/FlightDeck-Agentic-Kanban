# FlightDeck -- Dataverse Setup Guide

## Prerequisites

- Power Platform environment with Dataverse provisioned
- System Administrator or System Customizer security role
- Power Platform CLI (`pac`) installed and authenticated (`pac auth create`)

## Overview

FlightDeck uses 9 custom Dataverse tables, all with the `mc_` publisher prefix. The tables support the full Kanban board lifecycle including organisations, projects, boards, columns, tasks, comments, activity logging, AI agent actions, and board membership.

Create the tables in the order listed below to satisfy lookup (foreign key) dependencies.

---

## Table Definitions

### 1. mc_organization

| Display Name | Plural Name | Schema Name |
|---|---|---|
| Organization | Organizations | mc_organization |

| Column | Schema Name | Type | Required | Description |
|--------|-------------|------|----------|-------------|
| Name | mc_name | Single line text (200) | Yes | Organisation name |
| Logo URL | mc_logourl | URL | No | Organisation logo |

---

### 2. mc_project

| Display Name | Plural Name | Schema Name |
|---|---|---|
| Project | Projects | mc_project |

| Column | Schema Name | Type | Required | Description |
|--------|-------------|------|----------|-------------|
| Name | mc_name | Single line text (200) | Yes | Project name |
| Description | mc_description | Multi-line text | No | Project description |
| Colour | mc_color | Single line text (10) | No | Hex colour code (e.g. `#3B82F6`) |
| Organisation | mc_organizationid | Lookup (mc_organization) | Yes | Parent organisation |

---

### 3. mc_board

| Display Name | Plural Name | Schema Name |
|---|---|---|
| Board | Boards | mc_board |

| Column | Schema Name | Type | Required | Description |
|--------|-------------|------|----------|-------------|
| Name | mc_name | Single line text (200) | Yes | Board name |
| Description | mc_description | Multi-line text | No | Board description |
| Is Default | mc_isdefault | Yes/No | No | Default board for the project |
| Agents Enabled | mc_agentsenabled | Yes/No | No | Whether AI agents are active on this board |
| Poll Interval | mc_pollinterval | Whole Number | No | UI poll interval in milliseconds (default 30000) |
| Project | mc_projectid | Lookup (mc_project) | Yes | Parent project |

---

### 4. mc_column

| Display Name | Plural Name | Schema Name |
|---|---|---|
| Column | Columns | mc_column |

| Column | Schema Name | Type | Required | Description |
|--------|-------------|------|----------|-------------|
| Name | mc_name | Single line text (100) | Yes | Column display name |
| Column Type | mc_columntype | Choice | Yes | Column category (see options below) |
| Sort Order | mc_sortorder | Whole Number | Yes | Display order (left to right) |
| Colour | mc_color | Single line text (10) | No | Hex colour for column header |
| WIP Limit | mc_wiplimit | Whole Number | No | Maximum tasks allowed (0 = unlimited) |
| Board | mc_boardid | Lookup (mc_board) | Yes | Parent board |

**mc_columntype choice options:**

| Value | Label |
|-------|-------|
| 100000000 | backlog |
| 100000001 | todo |
| 100000002 | in_progress |
| 100000003 | review |
| 100000004 | done |
| 100000005 | archived |

---

### 5. mc_task

| Display Name | Plural Name | Schema Name |
|---|---|---|
| Task | Tasks | mc_task |

| Column | Schema Name | Type | Required | Description |
|--------|-------------|------|----------|-------------|
| Title | mc_title | Single line text (300) | Yes | Task title |
| Description | mc_description | Multi-line text | No | Task description / details |
| Priority | mc_priority | Choice | Yes | Task priority (see options below) |
| Sort Order | mc_sortorder | Whole Number | Yes | Position within column (top to bottom) |
| Due Date | mc_duedate | Date Only | No | Task deadline |
| Source | mc_source | Choice | Yes | How the task was created (see options below) |
| Source Reference | mc_sourcereference | Single line text (500) | No | Origin reference (e.g. meeting name, email subject) |
| Labels | mc_labels | Multi-line text | No | JSON array of label strings |
| Meeting Date | mc_meetingdate | Date and Time | No | Associated meeting date/time |
| Completed Date | mc_completeddate | Date and Time | No | When the task was marked complete |
| Archived Date | mc_archiveddate | Date and Time | No | When the task was archived |
| Is Blocked | mc_isblocked | Yes/No | No | Whether the task is currently blocked |
| Blocked Reason | mc_blockedreason | Single line text (500) | No | Reason for the block |
| Assignee ID | mc_assigneeid | Single line text (100) | No | Entra ID user GUID |
| Assignee Name | mc_assigneename | Single line text (200) | No | Display name of assignee |
| Column | mc_columnid | Lookup (mc_column) | Yes | Current column |
| Board | mc_boardid | Lookup (mc_board) | Yes | Parent board |

**mc_priority choice options:**

| Value | Label |
|-------|-------|
| 100000000 | critical |
| 100000001 | high |
| 100000002 | medium |
| 100000003 | low |

**mc_source choice options:**

| Value | Label |
|-------|-------|
| 100000000 | manual |
| 100000001 | meeting_transcript |
| 100000002 | email |
| 100000003 | agent |
| 100000004 | import |

---

### 6. mc_comment

| Display Name | Plural Name | Schema Name |
|---|---|---|
| Comment | Comments | mc_comment |

| Column | Schema Name | Type | Required | Description |
|--------|-------------|------|----------|-------------|
| Content | mc_content | Multi-line text | Yes | Comment text (supports markdown) |
| Author ID | mc_authorid | Single line text (100) | Yes | User or agent identifier |
| Author Name | mc_authorname | Single line text (200) | Yes | Display name of author |
| Is Agent | mc_isagent | Yes/No | No | Whether the author is an AI agent |
| Task | mc_taskid | Lookup (mc_task) | Yes | Parent task |

---

### 7. mc_activitylog

| Display Name | Plural Name | Schema Name |
|---|---|---|
| Activity Log | Activity Logs | mc_activitylog |

| Column | Schema Name | Type | Required | Description |
|--------|-------------|------|----------|-------------|
| Action | mc_action | Choice | Yes | Type of activity (see options below) |
| Description | mc_description | Multi-line text | Yes | Human-readable activity description |
| Actor ID | mc_actorid | Single line text (100) | Yes | User or agent identifier |
| Actor Name | mc_actorname | Single line text (200) | Yes | Display name of actor |
| Is Agent | mc_isagent | Yes/No | No | Whether the actor is an AI agent |
| Previous Value | mc_previousvalue | Single line text (500) | No | Value before the change |
| New Value | mc_newvalue | Single line text (500) | No | Value after the change |
| Task | mc_taskid | Lookup (mc_task) | No | Related task (nullable for board-level actions) |
| Board | mc_boardid | Lookup (mc_board) | Yes | Parent board |

**mc_action choice options:**

| Value | Label |
|-------|-------|
| 100000000 | created |
| 100000001 | moved |
| 100000002 | updated |
| 100000003 | commented |
| 100000004 | assigned |
| 100000005 | completed |
| 100000006 | archived |
| 100000007 | deleted |
| 100000008 | agent_action |

---

### 8. mc_agentaction

| Display Name | Plural Name | Schema Name |
|---|---|---|
| Agent Action | Agent Actions | mc_agentaction |

| Column | Schema Name | Type | Required | Description |
|--------|-------------|------|----------|-------------|
| Agent Name | mc_agentname | Single line text (100) | Yes | Agent display name (e.g. "Transcript Analyst") |
| Action Type | mc_actiontype | Single line text (100) | Yes | Type of action performed (e.g. "extract_action_items") |
| Status | mc_status | Choice | Yes | Execution status (see options below) |
| Confidence | mc_confidence | Decimal (precision 2) | No | Confidence score 0.00 - 1.00 |
| Duration (ms) | mc_durationms | Whole Number | No | Execution time in milliseconds |
| Task | mc_taskid | Lookup (mc_task) | No | Related task (nullable) |
| Board | mc_boardid | Lookup (mc_board) | Yes | Parent board |

**mc_status choice options:**

| Value | Label |
|-------|-------|
| 100000000 | pending |
| 100000001 | running |
| 100000002 | succeeded |
| 100000003 | failed |
| 100000004 | requires_approval |

---

### 9. mc_boardmember

| Display Name | Plural Name | Schema Name |
|---|---|---|
| Board Member | Board Members | mc_boardmember |

| Column | Schema Name | Type | Required | Description |
|--------|-------------|------|----------|-------------|
| Name | mc_name | Single line text (200) | Yes | Member display name |
| Email | mc_email | Email | Yes | Member email address |
| Role | mc_role | Choice | Yes | Board membership role (see options below) |
| Avatar URL | mc_avatarurl | URL | No | Profile picture URL |
| Board | mc_boardid | Lookup (mc_board) | Yes | Parent board |

**mc_role choice options:**

| Value | Label |
|-------|-------|
| 100000000 | owner |
| 100000001 | admin |
| 100000002 | member |
| 100000003 | viewer |

---

## Creating Tables via the Maker Portal

1. Navigate to https://make.powerapps.com
2. Select the target environment from the environment picker
3. Go to **Tables** in the left navigation
4. Click **New table** > **Set advanced properties**
5. Set the publisher prefix to `mc` (configure under **Solutions** > **Default Solution** > **Publisher** if not already set)
6. Create each table with the columns defined above
7. For Choice columns, create the option set values as listed
8. For Lookup columns, select the related table from the list

## Creating Tables via Solution XML

For repeatable deployments, export the solution as unmanaged, modify the `customizations.xml`, and re-import. This is the recommended approach for CI/CD pipelines.

---

## Code Generation

After creating all 9 tables in Dataverse, run the Power Platform CLI to generate typed TypeScript services for the frontend.

```bash
# Navigate to the project root
cd AI_Kanban

# Generate services for each table
pac code add-data-source -a dataverse -t mc_organization
pac code add-data-source -a dataverse -t mc_project
pac code add-data-source -a dataverse -t mc_board
pac code add-data-source -a dataverse -t mc_column
pac code add-data-source -a dataverse -t mc_task
pac code add-data-source -a dataverse -t mc_comment
pac code add-data-source -a dataverse -t mc_activitylog
pac code add-data-source -a dataverse -t mc_agentaction
pac code add-data-source -a dataverse -t mc_boardmember
```

This generates files under `src/generated/services/` following the pattern `McXxxService.ts` (e.g. `McTasksService.ts`).

Each generated service exposes standard CRUD methods:

```typescript
// Example: McTasksService
McTasksService.getAll({ select, filter, orderBy, top });
McTasksService.get(id, { select });
McTasksService.create(record);
McTasksService.update(id, changes);
McTasksService.delete(id);
```

---

## Swapping Mock Services for Dataverse

The FlightDeck frontend ships with mock services that return sample data for local development. Once the Dataverse tables are provisioned and code generation is complete, swap each import.

```typescript
// BEFORE (mock service for local development):
import { TasksService } from "@/services/tasks-service";

// AFTER (generated Dataverse service):
import { McTasksService as TasksService } from "@/generated/services/McTasksService";
```

The mock service API is designed to match the generated Dataverse service pattern, so the rest of the component code should work without changes.

---

## Lookup Bindings (OData)

When creating or updating records that contain lookup (foreign key) columns, use the OData bind syntax instead of setting the lookup column directly.

```typescript
// Creating a task with board and column lookups
const task = {
  mc_title: "Implement login page",
  mc_priority: 100000001, // high
  mc_source: 100000000,   // manual
  mc_sortorder: 1,
  // Lookup bindings use @odata.bind with the plural table name and GUID
  "mc_boardid@odata.bind": `/mc_boards(${boardGuid})`,
  "mc_columnid@odata.bind": `/mc_columns(${columnGuid})`,
};

await McTasksService.create(task);
```

```typescript
// Moving a task to a different column
await McTasksService.update(taskId, {
  "mc_columnid@odata.bind": `/mc_columns(${newColumnGuid})`,
  mc_sortorder: newSortOrder,
});
```

---

## Default Data

After creating the tables, seed the following default data for a working board.

### Default Columns

Create these columns on the default board (in sort order):

| Name | Column Type | Sort Order | Colour | WIP Limit |
|------|------------|------------|--------|-----------|
| Backlog | backlog (100000000) | 0 | #6B7280 | 0 |
| To Do | todo (100000001) | 1 | #3B82F6 | 0 |
| In Progress | in_progress (100000002) | 2 | #F59E0B | 5 |
| Review | review (100000003) | 3 | #8B5CF6 | 3 |
| Done | done (100000004) | 4 | #10B981 | 0 |

The "Archived" column type (100000005) is used internally by agents and does not need a visible column on the board.

---

## Security Roles

Create or modify security roles to control table access:

| Role | mc_organization | mc_project | mc_board | mc_column | mc_task | mc_comment | mc_activitylog | mc_agentaction | mc_boardmember |
|------|----------------|------------|----------|-----------|---------|------------|----------------|----------------|----------------|
| Board Owner | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | CR | CR | CRUD |
| Board Admin | R | R | RU | CRUD | CRUD | CRUD | CR | CR | CRU |
| Board Member | R | R | R | R | CRUD | CRUD | CR | R | R |
| Board Viewer | R | R | R | R | R | R | R | R | R |
| Agent Service | R | R | R | R | CRU | CR | CR | CRU | R |

Where: C = Create, R = Read, U = Update, D = Delete

---

## Troubleshooting

**"Table not found" errors after code generation**
- Ensure the environment connection in `pac auth` points to the correct environment
- Run `pac auth list` to verify the active connection
- Re-run `pac code add-data-source` after fixing the connection

**Lookup columns not binding**
- Verify you are using the *plural* table name in the OData bind path (e.g. `mc_boards` not `mc_board`)
- Ensure the target GUID exists in the related table

**Choice column values not matching**
- Dataverse choice values are integers, not strings
- Use the numeric values from the tables above (e.g. `100000002` for `medium` priority)
- The frontend mapping is defined in `src/lib/constants.ts`

#!/usr/bin/env bash
# FlightDeck — Seed default data: 1 org, 1 project, 1 board, 5 columns
set -uo pipefail
DV="https://orged45fd63.crm.dynamics.com"
API="${DV}/api/data/v9.2"

echo "=== Seeding default FlightDeck data ==="

# 1. Create Organisation
echo -n "Creating Organisation... "
ORG_RESPONSE=$(az rest --method post \
  --url "${API}/mc_organizations" \
  --resource "${DV}" \
  --headers "Content-Type=application/json" "Prefer=return=representation" \
  --body '{"mc_name":"FlightDeck Demo","mc_logourl":""}' \
  2>&1)

ORG_ID=$(echo "${ORG_RESPONSE}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('mc_organizationid',''))" 2>/dev/null)
if [ -z "${ORG_ID}" ]; then
  echo "FAILED - trying to find existing..."
  ORG_ID=$(az rest --method get \
    --url "${API}/mc_organizations?\$filter=mc_name eq 'FlightDeck Demo'&\$select=mc_organizationid" \
    --resource "${DV}" \
    --query "value[0].mc_organizationid" -o tsv 2>&1)
fi
echo "OK (${ORG_ID})"
sleep 3

# 2. Create Project
echo -n "Creating Project... "
PROJ_RESPONSE=$(az rest --method post \
  --url "${API}/mc_projects" \
  --resource "${DV}" \
  --headers "Content-Type=application/json" "Prefer=return=representation" \
  --body "{\"mc_name\":\"Default Project\",\"mc_description\":\"FlightDeck default project\",\"mc_color\":\"#3B82F6\",\"mc_organizationlookup@odata.bind\":\"/mc_organizations(${ORG_ID})\"}" \
  2>&1)

PROJ_ID=$(echo "${PROJ_RESPONSE}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('mc_projectid',''))" 2>/dev/null)
if [ -z "${PROJ_ID}" ]; then
  echo "FAILED - trying to find existing..."
  PROJ_ID=$(az rest --method get \
    --url "${API}/mc_projects?\$filter=mc_name eq 'Default Project'&\$select=mc_projectid" \
    --resource "${DV}" \
    --query "value[0].mc_projectid" -o tsv 2>&1)
fi
echo "OK (${PROJ_ID})"
sleep 3

# 3. Create Board
echo -n "Creating Board... "
BOARD_RESPONSE=$(az rest --method post \
  --url "${API}/mc_boards" \
  --resource "${DV}" \
  --headers "Content-Type=application/json" "Prefer=return=representation" \
  --body "{\"mc_name\":\"Sprint Board\",\"mc_description\":\"Default sprint board\",\"mc_isdefault\":true,\"mc_agentsenabled\":true,\"mc_pollinterval\":30000,\"mc_projectlookup@odata.bind\":\"/mc_projects(${PROJ_ID})\"}" \
  2>&1)

BOARD_ID=$(echo "${BOARD_RESPONSE}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('mc_boardid',''))" 2>/dev/null)
if [ -z "${BOARD_ID}" ]; then
  echo "FAILED - trying to find existing..."
  BOARD_ID=$(az rest --method get \
    --url "${API}/mc_boards?\$filter=mc_name eq 'Sprint Board'&\$select=mc_boardid" \
    --resource "${DV}" \
    --query "value[0].mc_boardid" -o tsv 2>&1)
fi
echo "OK (${BOARD_ID})"
sleep 3

# 4. Create 5 Columns
create_column() {
  local NAME="$1" TYPE="$2" SORT="$3" COLOR="$4" WIP="$5"
  echo -n "Creating column '${NAME}'... "

  az rest --method post \
    --url "${API}/mc_columns" \
    --resource "${DV}" \
    --headers "Content-Type=application/json" \
    --body "{\"mc_name\":\"${NAME}\",\"mc_columntype\":${TYPE},\"mc_sortorder\":${SORT},\"mc_color\":\"${COLOR}\",\"mc_wiplimit\":${WIP},\"mc_boardlookup@odata.bind\":\"/mc_boards(${BOARD_ID})\"}" \
    --output none 2>&1 && echo "OK" || echo "FAILED"
  sleep 5
}

create_column "Backlog"     100000000 0 "#6B7280" 0
create_column "To Do"       100000001 1 "#3B82F6" 0
create_column "In Progress" 100000002 2 "#F59E0B" 5
create_column "Review"      100000003 3 "#8B5CF6" 3
create_column "Done"        100000004 4 "#10B981" 0

echo ""
echo "=== Seed data summary ==="
echo "Organisation ID: ${ORG_ID}"
echo "Project ID:      ${PROJ_ID}"
echo "Board ID:        ${BOARD_ID}"
echo "Columns:         5 (Backlog, To Do, In Progress, Review, Done)"
echo "=== Done ==="

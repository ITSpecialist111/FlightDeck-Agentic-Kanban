#!/usr/bin/env bash
# FlightDeck — Create lookup (foreign key) relationships between Dataverse tables
# Relationship SchemaName must be unique and NOT collide with existing attribute names,
# so we use the pattern: mc_{referencingTable}_{referencedTable}
set -uo pipefail
DV="https://orged45fd63.crm.dynamics.com"
API="${DV}/api/data/v9.2"

add_lookup() {
  local TABLE="$1" REL_SCHEMA="$2" LOOKUP_SCHEMA="$3" LOOKUP_DISPLAY="$4" REFERENCED_TABLE="$5" REQUIRED="$6"

  echo -n "  ${TABLE}.${LOOKUP_SCHEMA} → ${REFERENCED_TABLE} (rel: ${REL_SCHEMA})... "

  local TMPFILE
  TMPFILE=$(mktemp)
  cat > "${TMPFILE}" <<EOF
{
  "SchemaName": "${REL_SCHEMA}",
  "ReferencingEntity": "${TABLE}",
  "ReferencedEntity": "${REFERENCED_TABLE}",
  "@odata.type": "Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata",
  "CascadeConfiguration": {
    "Assign": "NoCascade",
    "Delete": "RemoveLink",
    "Merge": "NoCascade",
    "Reparent": "NoCascade",
    "Share": "NoCascade",
    "Unshare": "NoCascade",
    "RollupView": "NoCascade"
  },
  "Lookup": {
    "@odata.type": "Microsoft.Dynamics.CRM.LookupAttributeMetadata",
    "SchemaName": "${LOOKUP_SCHEMA}",
    "DisplayName": {
      "@odata.type": "Microsoft.Dynamics.CRM.Label",
      "LocalizedLabels": [{"Label": "${LOOKUP_DISPLAY}", "LanguageCode": 1033}]
    },
    "RequiredLevel": {"Value": "${REQUIRED}"}
  }
}
EOF

  az rest --method post \
    --url "${API}/RelationshipDefinitions" \
    --resource "${DV}" \
    --headers "Content-Type=application/json" \
    --body @"${TMPFILE}" \
    --output none 2>&1 && echo "OK" || echo "EXISTS/FAILED"

  rm -f "${TMPFILE}"
  sleep 8
}

echo "=== Creating lookup relationships ==="

# 1. mc_project → mc_organization
add_lookup mc_project mc_project_organization mc_organizationlookup "Organisation" mc_organization "ApplicationRequired"

# 2. mc_board → mc_project
add_lookup mc_board mc_board_project mc_projectlookup "Project" mc_project "ApplicationRequired"

# 3. mc_column → mc_board
add_lookup mc_column mc_column_board mc_boardlookup "Board" mc_board "ApplicationRequired"

# 4. mc_task → mc_column
add_lookup mc_task mc_task_column mc_columnlookup "Column" mc_column "ApplicationRequired"

# 5. mc_task → mc_board
add_lookup mc_task mc_task_board mc_boardlookup "Board" mc_board "ApplicationRequired"

# 6. mc_comment → mc_task
add_lookup mc_comment mc_comment_task mc_tasklookup "Task" mc_task "ApplicationRequired"

# 7. mc_activitylog → mc_task (nullable)
add_lookup mc_activitylog mc_activitylog_task mc_tasklookup "Task" mc_task "None"

# 8. mc_activitylog → mc_board
add_lookup mc_activitylog mc_activitylog_board mc_boardlookup "Board" mc_board "ApplicationRequired"

# 9. mc_agentaction → mc_task (nullable)
add_lookup mc_agentaction mc_agentaction_task mc_tasklookup "Task" mc_task "None"

# 10. mc_agentaction → mc_board
add_lookup mc_agentaction mc_agentaction_board mc_boardlookup "Board" mc_board "ApplicationRequired"

# 11. mc_boardmember → mc_board
add_lookup mc_boardmember mc_boardmember_board mc_boardlookup "Board" mc_board "ApplicationRequired"

echo "=== Lookup relationships done ==="

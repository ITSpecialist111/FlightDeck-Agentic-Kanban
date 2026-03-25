#!/usr/bin/env bash
set -uo pipefail
DV="https://orged45fd63.crm.dynamics.com"
API="${DV}/api/data/v9.2"

add_col() {
  local TABLE="$1" COL_NAME="$2" BODYFILE="$3"
  echo -n "  ${TABLE}.${COL_NAME}... "
  az rest --method post \
    --url "${API}/EntityDefinitions(LogicalName='${TABLE}')/Attributes" \
    --resource "${DV}" \
    --headers "Content-Type=application/json" \
    --body @"${BODYFILE}" \
    --output none 2>&1 && echo "OK" || echo "EXISTS/FAILED"
  sleep 3
}

TMPDIR=$(mktemp -d)

# mc_project columns
echo "=== mc_project ==="
cat > "${TMPDIR}/proj-desc.json" << 'EOFJ'
{"@odata.type":"Microsoft.Dynamics.CRM.MemoAttributeMetadata","SchemaName":"mc_description","DisplayName":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Description","LanguageCode":1033}]},"RequiredLevel":{"Value":"None"},"MaxLength":10000,"Format":"TextArea"}
EOFJ
add_col mc_project mc_description "${TMPDIR}/proj-desc.json"

cat > "${TMPDIR}/proj-color.json" << 'EOFJ'
{"@odata.type":"Microsoft.Dynamics.CRM.StringAttributeMetadata","SchemaName":"mc_color","DisplayName":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Colour","LanguageCode":1033}]},"RequiredLevel":{"Value":"None"},"MaxLength":10,"FormatName":{"Value":"Text"}}
EOFJ
add_col mc_project mc_color "${TMPDIR}/proj-color.json"

# mc_task columns
echo "=== mc_task ==="
cat > "${TMPDIR}/task-title.json" << 'EOFJ'
{"@odata.type":"Microsoft.Dynamics.CRM.StringAttributeMetadata","SchemaName":"mc_title","DisplayName":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Title","LanguageCode":1033}]},"RequiredLevel":{"Value":"ApplicationRequired"},"MaxLength":300,"FormatName":{"Value":"Text"}}
EOFJ
add_col mc_task mc_title "${TMPDIR}/task-title.json"

cat > "${TMPDIR}/task-desc.json" << 'EOFJ'
{"@odata.type":"Microsoft.Dynamics.CRM.MemoAttributeMetadata","SchemaName":"mc_description","DisplayName":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Description","LanguageCode":1033}]},"RequiredLevel":{"Value":"None"},"MaxLength":10000,"Format":"TextArea"}
EOFJ
add_col mc_task mc_description "${TMPDIR}/task-desc.json"

cat > "${TMPDIR}/task-priority.json" << 'EOFJ'
{"@odata.type":"Microsoft.Dynamics.CRM.PicklistAttributeMetadata","SchemaName":"mc_priority","DisplayName":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Priority","LanguageCode":1033}]},"RequiredLevel":{"Value":"ApplicationRequired"},"OptionSet":{"@odata.type":"Microsoft.Dynamics.CRM.OptionSetMetadata","IsGlobal":false,"OptionSetType":"Picklist","Options":[{"Value":100000000,"Label":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"critical","LanguageCode":1033}]}},{"Value":100000001,"Label":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"high","LanguageCode":1033}]}},{"Value":100000002,"Label":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"medium","LanguageCode":1033}]}},{"Value":100000003,"Label":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"low","LanguageCode":1033}]}}]}}
EOFJ
add_col mc_task mc_priority "${TMPDIR}/task-priority.json"

cat > "${TMPDIR}/task-sort.json" << 'EOFJ'
{"@odata.type":"Microsoft.Dynamics.CRM.IntegerAttributeMetadata","SchemaName":"mc_sortorder","DisplayName":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Sort Order","LanguageCode":1033}]},"RequiredLevel":{"Value":"ApplicationRequired"},"MinValue":0,"MaxValue":2147483647,"Format":"None"}
EOFJ
add_col mc_task mc_sortorder "${TMPDIR}/task-sort.json"

cat > "${TMPDIR}/task-due.json" << 'EOFJ'
{"@odata.type":"Microsoft.Dynamics.CRM.DateTimeAttributeMetadata","SchemaName":"mc_duedate","DisplayName":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Due Date","LanguageCode":1033}]},"RequiredLevel":{"Value":"None"},"Format":"DateOnly"}
EOFJ
add_col mc_task mc_duedate "${TMPDIR}/task-due.json"

cat > "${TMPDIR}/task-source.json" << 'EOFJ'
{"@odata.type":"Microsoft.Dynamics.CRM.PicklistAttributeMetadata","SchemaName":"mc_source","DisplayName":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Source","LanguageCode":1033}]},"RequiredLevel":{"Value":"ApplicationRequired"},"OptionSet":{"@odata.type":"Microsoft.Dynamics.CRM.OptionSetMetadata","IsGlobal":false,"OptionSetType":"Picklist","Options":[{"Value":100000000,"Label":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"manual","LanguageCode":1033}]}},{"Value":100000001,"Label":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"meeting_transcript","LanguageCode":1033}]}},{"Value":100000002,"Label":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"email","LanguageCode":1033}]}},{"Value":100000003,"Label":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"agent","LanguageCode":1033}]}},{"Value":100000004,"Label":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"import","LanguageCode":1033}]}}]}}
EOFJ
add_col mc_task mc_source "${TMPDIR}/task-source.json"

cat > "${TMPDIR}/task-srcref.json" << 'EOFJ'
{"@odata.type":"Microsoft.Dynamics.CRM.StringAttributeMetadata","SchemaName":"mc_sourcereference","DisplayName":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Source Reference","LanguageCode":1033}]},"RequiredLevel":{"Value":"None"},"MaxLength":500,"FormatName":{"Value":"Text"}}
EOFJ
add_col mc_task mc_sourcereference "${TMPDIR}/task-srcref.json"

cat > "${TMPDIR}/task-labels.json" << 'EOFJ'
{"@odata.type":"Microsoft.Dynamics.CRM.MemoAttributeMetadata","SchemaName":"mc_labels","DisplayName":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Labels","LanguageCode":1033}]},"RequiredLevel":{"Value":"None"},"MaxLength":4000,"Format":"TextArea"}
EOFJ
add_col mc_task mc_labels "${TMPDIR}/task-labels.json"

cat > "${TMPDIR}/task-meeting.json" << 'EOFJ'
{"@odata.type":"Microsoft.Dynamics.CRM.DateTimeAttributeMetadata","SchemaName":"mc_meetingdate","DisplayName":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Meeting Date","LanguageCode":1033}]},"RequiredLevel":{"Value":"None"},"Format":"DateAndTime"}
EOFJ
add_col mc_task mc_meetingdate "${TMPDIR}/task-meeting.json"

cat > "${TMPDIR}/task-completed.json" << 'EOFJ'
{"@odata.type":"Microsoft.Dynamics.CRM.DateTimeAttributeMetadata","SchemaName":"mc_completeddate","DisplayName":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Completed Date","LanguageCode":1033}]},"RequiredLevel":{"Value":"None"},"Format":"DateAndTime"}
EOFJ
add_col mc_task mc_completeddate "${TMPDIR}/task-completed.json"

cat > "${TMPDIR}/task-archived.json" << 'EOFJ'
{"@odata.type":"Microsoft.Dynamics.CRM.DateTimeAttributeMetadata","SchemaName":"mc_archiveddate","DisplayName":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Archived Date","LanguageCode":1033}]},"RequiredLevel":{"Value":"None"},"Format":"DateAndTime"}
EOFJ
add_col mc_task mc_archiveddate "${TMPDIR}/task-archived.json"

cat > "${TMPDIR}/task-blocked.json" << 'EOFJ'
{"@odata.type":"Microsoft.Dynamics.CRM.BooleanAttributeMetadata","SchemaName":"mc_isblocked","DisplayName":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Is Blocked","LanguageCode":1033}]},"RequiredLevel":{"Value":"None"},"OptionSet":{"TrueOption":{"Value":1,"Label":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Yes","LanguageCode":1033}]}},"FalseOption":{"Value":0,"Label":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"No","LanguageCode":1033}]}}}}
EOFJ
add_col mc_task mc_isblocked "${TMPDIR}/task-blocked.json"

cat > "${TMPDIR}/task-blockedreason.json" << 'EOFJ'
{"@odata.type":"Microsoft.Dynamics.CRM.StringAttributeMetadata","SchemaName":"mc_blockedreason","DisplayName":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Blocked Reason","LanguageCode":1033}]},"RequiredLevel":{"Value":"None"},"MaxLength":500,"FormatName":{"Value":"Text"}}
EOFJ
add_col mc_task mc_blockedreason "${TMPDIR}/task-blockedreason.json"

cat > "${TMPDIR}/task-assigneeid.json" << 'EOFJ'
{"@odata.type":"Microsoft.Dynamics.CRM.StringAttributeMetadata","SchemaName":"mc_assigneeid","DisplayName":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Assignee ID","LanguageCode":1033}]},"RequiredLevel":{"Value":"None"},"MaxLength":100,"FormatName":{"Value":"Text"}}
EOFJ
add_col mc_task mc_assigneeid "${TMPDIR}/task-assigneeid.json"

cat > "${TMPDIR}/task-assigneename.json" << 'EOFJ'
{"@odata.type":"Microsoft.Dynamics.CRM.StringAttributeMetadata","SchemaName":"mc_assigneename","DisplayName":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Assignee Name","LanguageCode":1033}]},"RequiredLevel":{"Value":"None"},"MaxLength":200,"FormatName":{"Value":"Text"}}
EOFJ
add_col mc_task mc_assigneename "${TMPDIR}/task-assigneename.json"

rm -rf "${TMPDIR}"
echo "=== Batch 2 done ==="

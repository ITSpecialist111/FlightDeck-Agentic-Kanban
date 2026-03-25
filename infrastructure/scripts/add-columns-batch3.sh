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

# mc_comment
echo "=== mc_comment ==="
cat > "${TMPDIR}/c1.json" << 'EOF'
{"@odata.type":"Microsoft.Dynamics.CRM.MemoAttributeMetadata","SchemaName":"mc_content","DisplayName":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Content","LanguageCode":1033}]},"RequiredLevel":{"Value":"ApplicationRequired"},"MaxLength":10000,"Format":"TextArea"}
EOF
add_col mc_comment mc_content "${TMPDIR}/c1.json"

cat > "${TMPDIR}/c2.json" << 'EOF'
{"@odata.type":"Microsoft.Dynamics.CRM.StringAttributeMetadata","SchemaName":"mc_authorid","DisplayName":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Author ID","LanguageCode":1033}]},"RequiredLevel":{"Value":"ApplicationRequired"},"MaxLength":100,"FormatName":{"Value":"Text"}}
EOF
add_col mc_comment mc_authorid "${TMPDIR}/c2.json"

cat > "${TMPDIR}/c3.json" << 'EOF'
{"@odata.type":"Microsoft.Dynamics.CRM.StringAttributeMetadata","SchemaName":"mc_authorname","DisplayName":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Author Name","LanguageCode":1033}]},"RequiredLevel":{"Value":"ApplicationRequired"},"MaxLength":200,"FormatName":{"Value":"Text"}}
EOF
add_col mc_comment mc_authorname "${TMPDIR}/c3.json"

cat > "${TMPDIR}/c4.json" << 'EOF'
{"@odata.type":"Microsoft.Dynamics.CRM.BooleanAttributeMetadata","SchemaName":"mc_isagent","DisplayName":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Is Agent","LanguageCode":1033}]},"RequiredLevel":{"Value":"None"},"OptionSet":{"TrueOption":{"Value":1,"Label":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Yes","LanguageCode":1033}]}},"FalseOption":{"Value":0,"Label":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"No","LanguageCode":1033}]}}}}
EOF
add_col mc_comment mc_isagent "${TMPDIR}/c4.json"

# mc_activitylog
echo "=== mc_activitylog ==="
cat > "${TMPDIR}/a1.json" << 'EOF'
{"@odata.type":"Microsoft.Dynamics.CRM.PicklistAttributeMetadata","SchemaName":"mc_action","DisplayName":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Action","LanguageCode":1033}]},"RequiredLevel":{"Value":"ApplicationRequired"},"OptionSet":{"@odata.type":"Microsoft.Dynamics.CRM.OptionSetMetadata","IsGlobal":false,"OptionSetType":"Picklist","Options":[{"Value":100000000,"Label":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"created","LanguageCode":1033}]}},{"Value":100000001,"Label":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"moved","LanguageCode":1033}]}},{"Value":100000002,"Label":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"updated","LanguageCode":1033}]}},{"Value":100000003,"Label":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"commented","LanguageCode":1033}]}},{"Value":100000004,"Label":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"assigned","LanguageCode":1033}]}},{"Value":100000005,"Label":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"completed","LanguageCode":1033}]}},{"Value":100000006,"Label":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"archived","LanguageCode":1033}]}},{"Value":100000007,"Label":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"deleted","LanguageCode":1033}]}},{"Value":100000008,"Label":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"agent_action","LanguageCode":1033}]}}]}}
EOF
add_col mc_activitylog mc_action "${TMPDIR}/a1.json"

cat > "${TMPDIR}/a2.json" << 'EOF'
{"@odata.type":"Microsoft.Dynamics.CRM.MemoAttributeMetadata","SchemaName":"mc_description","DisplayName":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Description","LanguageCode":1033}]},"RequiredLevel":{"Value":"ApplicationRequired"},"MaxLength":10000,"Format":"TextArea"}
EOF
add_col mc_activitylog mc_description "${TMPDIR}/a2.json"

cat > "${TMPDIR}/a3.json" << 'EOF'
{"@odata.type":"Microsoft.Dynamics.CRM.StringAttributeMetadata","SchemaName":"mc_actorid","DisplayName":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Actor ID","LanguageCode":1033}]},"RequiredLevel":{"Value":"ApplicationRequired"},"MaxLength":100,"FormatName":{"Value":"Text"}}
EOF
add_col mc_activitylog mc_actorid "${TMPDIR}/a3.json"

cat > "${TMPDIR}/a4.json" << 'EOF'
{"@odata.type":"Microsoft.Dynamics.CRM.StringAttributeMetadata","SchemaName":"mc_actorname","DisplayName":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Actor Name","LanguageCode":1033}]},"RequiredLevel":{"Value":"ApplicationRequired"},"MaxLength":200,"FormatName":{"Value":"Text"}}
EOF
add_col mc_activitylog mc_actorname "${TMPDIR}/a4.json"

cat > "${TMPDIR}/a5.json" << 'EOF'
{"@odata.type":"Microsoft.Dynamics.CRM.BooleanAttributeMetadata","SchemaName":"mc_isagent","DisplayName":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Is Agent","LanguageCode":1033}]},"RequiredLevel":{"Value":"None"},"OptionSet":{"TrueOption":{"Value":1,"Label":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Yes","LanguageCode":1033}]}},"FalseOption":{"Value":0,"Label":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"No","LanguageCode":1033}]}}}}
EOF
add_col mc_activitylog mc_isagent "${TMPDIR}/a5.json"

cat > "${TMPDIR}/a6.json" << 'EOF'
{"@odata.type":"Microsoft.Dynamics.CRM.StringAttributeMetadata","SchemaName":"mc_previousvalue","DisplayName":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Previous Value","LanguageCode":1033}]},"RequiredLevel":{"Value":"None"},"MaxLength":500,"FormatName":{"Value":"Text"}}
EOF
add_col mc_activitylog mc_previousvalue "${TMPDIR}/a6.json"

cat > "${TMPDIR}/a7.json" << 'EOF'
{"@odata.type":"Microsoft.Dynamics.CRM.StringAttributeMetadata","SchemaName":"mc_newvalue","DisplayName":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"New Value","LanguageCode":1033}]},"RequiredLevel":{"Value":"None"},"MaxLength":500,"FormatName":{"Value":"Text"}}
EOF
add_col mc_activitylog mc_newvalue "${TMPDIR}/a7.json"

# mc_agentaction
echo "=== mc_agentaction ==="
cat > "${TMPDIR}/ag1.json" << 'EOF'
{"@odata.type":"Microsoft.Dynamics.CRM.StringAttributeMetadata","SchemaName":"mc_agentname","DisplayName":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Agent Name","LanguageCode":1033}]},"RequiredLevel":{"Value":"ApplicationRequired"},"MaxLength":100,"FormatName":{"Value":"Text"}}
EOF
add_col mc_agentaction mc_agentname "${TMPDIR}/ag1.json"

cat > "${TMPDIR}/ag2.json" << 'EOF'
{"@odata.type":"Microsoft.Dynamics.CRM.StringAttributeMetadata","SchemaName":"mc_actiontype","DisplayName":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Action Type","LanguageCode":1033}]},"RequiredLevel":{"Value":"ApplicationRequired"},"MaxLength":100,"FormatName":{"Value":"Text"}}
EOF
add_col mc_agentaction mc_actiontype "${TMPDIR}/ag2.json"

cat > "${TMPDIR}/ag3.json" << 'EOF'
{"@odata.type":"Microsoft.Dynamics.CRM.PicklistAttributeMetadata","SchemaName":"mc_status","DisplayName":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Status","LanguageCode":1033}]},"RequiredLevel":{"Value":"ApplicationRequired"},"OptionSet":{"@odata.type":"Microsoft.Dynamics.CRM.OptionSetMetadata","IsGlobal":false,"OptionSetType":"Picklist","Options":[{"Value":100000000,"Label":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"pending","LanguageCode":1033}]}},{"Value":100000001,"Label":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"running","LanguageCode":1033}]}},{"Value":100000002,"Label":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"succeeded","LanguageCode":1033}]}},{"Value":100000003,"Label":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"failed","LanguageCode":1033}]}},{"Value":100000004,"Label":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"requires_approval","LanguageCode":1033}]}}]}}
EOF
add_col mc_agentaction mc_status "${TMPDIR}/ag3.json"

cat > "${TMPDIR}/ag4.json" << 'EOF'
{"@odata.type":"Microsoft.Dynamics.CRM.DecimalAttributeMetadata","SchemaName":"mc_confidence","DisplayName":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Confidence","LanguageCode":1033}]},"RequiredLevel":{"Value":"None"},"MinValue":0,"MaxValue":1,"Precision":2}
EOF
add_col mc_agentaction mc_confidence "${TMPDIR}/ag4.json"

cat > "${TMPDIR}/ag5.json" << 'EOF'
{"@odata.type":"Microsoft.Dynamics.CRM.IntegerAttributeMetadata","SchemaName":"mc_durationms","DisplayName":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Duration (ms)","LanguageCode":1033}]},"RequiredLevel":{"Value":"None"},"MinValue":0,"MaxValue":2147483647,"Format":"None"}
EOF
add_col mc_agentaction mc_durationms "${TMPDIR}/ag5.json"

# mc_boardmember
echo "=== mc_boardmember ==="
cat > "${TMPDIR}/bm1.json" << 'EOF'
{"@odata.type":"Microsoft.Dynamics.CRM.StringAttributeMetadata","SchemaName":"mc_email","DisplayName":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Email","LanguageCode":1033}]},"RequiredLevel":{"Value":"ApplicationRequired"},"MaxLength":200,"FormatName":{"Value":"Email"}}
EOF
add_col mc_boardmember mc_email "${TMPDIR}/bm1.json"

cat > "${TMPDIR}/bm2.json" << 'EOF'
{"@odata.type":"Microsoft.Dynamics.CRM.PicklistAttributeMetadata","SchemaName":"mc_role","DisplayName":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Role","LanguageCode":1033}]},"RequiredLevel":{"Value":"ApplicationRequired"},"OptionSet":{"@odata.type":"Microsoft.Dynamics.CRM.OptionSetMetadata","IsGlobal":false,"OptionSetType":"Picklist","Options":[{"Value":100000000,"Label":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"owner","LanguageCode":1033}]}},{"Value":100000001,"Label":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"admin","LanguageCode":1033}]}},{"Value":100000002,"Label":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"member","LanguageCode":1033}]}},{"Value":100000003,"Label":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"viewer","LanguageCode":1033}]}}]}}
EOF
add_col mc_boardmember mc_role "${TMPDIR}/bm2.json"

cat > "${TMPDIR}/bm3.json" << 'EOF'
{"@odata.type":"Microsoft.Dynamics.CRM.StringAttributeMetadata","SchemaName":"mc_avatarurl","DisplayName":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Avatar URL","LanguageCode":1033}]},"RequiredLevel":{"Value":"None"},"MaxLength":500,"FormatName":{"Value":"Url"}}
EOF
add_col mc_boardmember mc_avatarurl "${TMPDIR}/bm3.json"

rm -rf "${TMPDIR}"
echo "=== Batch 3 done ==="

#!/bin/bash

# Alert Sending Script
ALERT_TYPE="$1"
MESSAGE="$2"
SEVERITY="${3:-warning}"

# Slack notification
if [ -n "$SLACK_WEBHOOK" ]; then
    case "$SEVERITY" in
        "critical")
            EMOJI="🚨"
            COLOR="#ff0000"
            ;;
        "warning")
            EMOJI="⚠️"
            COLOR="#ffaa00"
            ;;
        *)
            EMOJI="ℹ️"
            COLOR="#0000ff"
            ;;
    esac
    
    curl -X POST -H 'Content-type: application/json' \
        --data "{
            \"attachments\": [{
                \"color\": \"$COLOR\",
                \"title\": \"$EMOJI Authentication Alert: $ALERT_TYPE\",
                \"text\": \"$MESSAGE\",
                \"footer\": \"Auth Monitor\",
                \"ts\": $(date +%s)
            }]
        }" \
        "$SLACK_WEBHOOK"
fi

# Email notification (if configured)
if [ -n "$ALERT_EMAIL" ] && command -v mail >/dev/null 2>&1; then
    echo "$MESSAGE" | mail -s "Auth Alert: $ALERT_TYPE" "$ALERT_EMAIL"
fi

# Log alert
echo "$(date): ALERT [$SEVERITY] $ALERT_TYPE - $MESSAGE" >> /var/log/auth-alerts.log

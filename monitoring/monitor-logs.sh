#!/bin/bash

# Log Monitoring Script for Authentication Events
LOG_DIR="${LOG_DIR:-/var/log/app}"
ALERT_THRESHOLD="${ALERT_THRESHOLD:-5}"
TIME_WINDOW="${TIME_WINDOW:-300}" # 5 minutes

# Function to count log patterns
count_pattern() {
    local pattern="$1"
    local log_file="$2"
    local since_time="$3"
    
    if [ -f "$log_file" ]; then
        # Count occurrences in the last TIME_WINDOW seconds
        grep "$pattern" "$log_file" | awk -v since="$since_time" '$1 >= since' | wc -l
    else
        echo "0"
    fi
}

# Calculate time threshold
current_time=$(date +%s)
time_threshold=$((current_time - TIME_WINDOW))

# Monitor authentication errors
auth_errors=$(count_pattern "Authentication failed\|JWT validation failed" "$LOG_DIR/app.log" "$time_threshold")
logto_errors=$(count_pattern "Logto.*error\|Callback.*error" "$LOG_DIR/app.log" "$time_threshold")

echo "=== Authentication Log Monitor $(date) ==="
echo "Auth errors in last ${TIME_WINDOW}s: $auth_errors"
echo "Logto errors in last ${TIME_WINDOW}s: $logto_errors"

# Check thresholds and alert
total_errors=$((auth_errors + logto_errors))
if [ "$total_errors" -gt "$ALERT_THRESHOLD" ]; then
    echo "🚨 ALERT: High error rate detected - $total_errors errors in ${TIME_WINDOW}s"
    
    # Send alert (customize based on your alerting system)
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 Auth Error Alert: $total_errors errors in last ${TIME_WINDOW}s\"}" \
            "$SLACK_WEBHOOK"
    fi
    
    exit 1
else
    echo "✅ Error rate within acceptable limits"
fi

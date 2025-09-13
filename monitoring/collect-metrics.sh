#!/bin/bash

# Metrics Collection Script for Dashboard
METRICS_FILE="${METRICS_FILE:-/tmp/auth-metrics.json}"
BASE_URL="${BASE_URL:-http://localhost:6789}"

# Collect health metrics
collect_health_metrics() {
    local health_response
    health_response=$(curl -s "$BASE_URL/api/health" || echo '{"status": "unreachable"}')
    echo "$health_response" | jq -c '{
        timestamp: now,
        status: .status,
        uptime: .uptime,
        memory: .memory,
        auth_configured: .auth.logto.configured
    }'
}

# Collect performance metrics
collect_performance_metrics() {
    local endpoints=("/" "/api/health" "/api/logto/sign-in" "/profile")
    local metrics=()
    
    for endpoint in "${endpoints[@]}"; do
        local start_time
        local end_time
        local duration
        local status
        
        start_time=$(date +%s%N)
        status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint" || echo "000")
        end_time=$(date +%s%N)
        
        duration=$(((end_time - start_time) / 1000000))
        
        metrics+=("$(jq -n --arg endpoint "$endpoint" --argjson duration "$duration" --argjson status "$status" '{
            endpoint: $endpoint,
            response_time_ms: $duration,
            status_code: $status,
            timestamp: now
        }')")
    done
    
    printf '%s\n' "${metrics[@]}" | jq -s '.'
}

# Generate combined metrics
{
    echo "{"
    echo "  \"health\": $(collect_health_metrics),"
    echo "  \"performance\": $(collect_performance_metrics),"
    echo "  \"timestamp\": $(date +%s)"
    echo "}"
} > "$METRICS_FILE"

echo "Metrics collected at $(date)"

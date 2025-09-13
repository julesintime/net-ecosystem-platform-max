#!/bin/bash

# Performance Monitoring Script
BASE_URL="${BASE_URL:-http://localhost:6789}"
WARNING_THRESHOLD="${WARNING_THRESHOLD:-2000}" # 2 seconds in ms
CRITICAL_THRESHOLD="${CRITICAL_THRESHOLD:-5000}" # 5 seconds in ms

# Function to measure endpoint response time
measure_endpoint() {
    local endpoint="$1"
    local description="$2"
    
    local start_time
    local end_time
    local duration
    
    start_time=$(date +%s%N)
    curl -s -o /dev/null "$BASE_URL$endpoint" || return 1
    end_time=$(date +%s%N)
    
    duration=$(((end_time - start_time) / 1000000)) # Convert to milliseconds
    
    echo "$description: ${duration}ms"
    
    if [ "$duration" -gt "$CRITICAL_THRESHOLD" ]; then
        echo "🚨 CRITICAL: $description response time is ${duration}ms (threshold: ${CRITICAL_THRESHOLD}ms)"
        return 2
    elif [ "$duration" -gt "$WARNING_THRESHOLD" ]; then
        echo "⚠️  WARNING: $description response time is ${duration}ms (threshold: ${WARNING_THRESHOLD}ms)"
        return 1
    else
        echo "✅ $description performance is acceptable"
        return 0
    fi
}

echo "=== Performance Check $(date) ==="

# Check key endpoints
measure_endpoint "/" "Homepage"
measure_endpoint "/api/health" "Health Check"
measure_endpoint "/api/logto/sign-in" "Sign-in Redirect"
measure_endpoint "/profile" "Profile Page"

echo "=== Performance check completed ==="

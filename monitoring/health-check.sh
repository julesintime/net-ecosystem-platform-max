#!/bin/bash

# Health Check Script for Authentication System
BASE_URL="${BASE_URL:-http://localhost:6789}"
LOG_FILE="${LOG_FILE:-/tmp/health-check.log}"

# Function to check endpoint
check_endpoint() {
    local endpoint="$1"
    local expected_status="$2"
    local description="$3"
    
    local response
    local status
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL$endpoint" 2>/dev/null || echo "HTTPSTATUS:000")
    status=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    
    if [[ "$expected_status" == *"$status"* ]]; then
        echo "✅ $description: $status"
        echo "$(date): SUCCESS - $endpoint returned $status" >> "$LOG_FILE"
        return 0
    else
        echo "❌ $description: $status (expected $expected_status)"
        echo "$(date): FAILURE - $endpoint returned $status, expected $expected_status" >> "$LOG_FILE"
        return 1
    fi
}

# Run health checks
echo "=== Authentication Health Check $(date) ==="

check_endpoint "/api/health" "200" "Application Health"
check_endpoint "/api/logto/sign-in" "302,307" "Sign-in Redirect" 
check_endpoint "/api/logto/sign-out" "302,307" "Sign-out Redirect"
check_endpoint "/api/logto/callback" "200,302,400" "Auth Callback"

echo "=== Health check completed ==="

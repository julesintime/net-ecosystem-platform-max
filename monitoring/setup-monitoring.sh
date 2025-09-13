#!/bin/bash

# Authentication Monitoring Setup Script
# Sets up monitoring infrastructure for authentication system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MONITORING_DIR="$(dirname "$0")"
CONFIG_FILE="$MONITORING_DIR/auth-monitoring.yml"

log() {
    echo -e "$1"
}

error() {
    log "${RED}❌ ERROR: $1${NC}"
    exit 1
}

warning() {
    log "${YELLOW}⚠️  WARNING: $1${NC}"
}

success() {
    log "${GREEN}✅ $1${NC}"
}

info() {
    log "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    info "Checking monitoring prerequisites..."
    
    if [ ! -f "$CONFIG_FILE" ]; then
        error "Monitoring configuration file not found: $CONFIG_FILE"
    fi
    
    success "Prerequisites check passed"
}

# Setup health check monitoring
setup_health_checks() {
    info "Setting up health check monitoring..."
    
    # Create health check script
    cat > "$MONITORING_DIR/health-check.sh" << 'EOF'
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
EOF

    chmod +x "$MONITORING_DIR/health-check.sh"
    success "Health check script created"
}

# Setup log monitoring
setup_log_monitoring() {
    info "Setting up log monitoring..."
    
    # Create log monitoring script
    cat > "$MONITORING_DIR/monitor-logs.sh" << 'EOF'
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
EOF

    chmod +x "$MONITORING_DIR/monitor-logs.sh"
    success "Log monitoring script created"
}

# Setup performance monitoring
setup_performance_monitoring() {
    info "Setting up performance monitoring..."
    
    # Create performance monitoring script
    cat > "$MONITORING_DIR/performance-check.sh" << 'EOF'
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
EOF

    chmod +x "$MONITORING_DIR/performance-check.sh"
    success "Performance monitoring script created"
}

# Setup cron jobs for monitoring
setup_cron_jobs() {
    info "Setting up monitoring cron jobs..."
    
    # Create cron configuration
    cat > "$MONITORING_DIR/monitoring-cron" << EOF
# Authentication monitoring cron jobs

# Health check every 5 minutes
*/5 * * * * $MONITORING_DIR/health-check.sh >> /var/log/auth-health.log 2>&1

# Log monitoring every minute  
* * * * * $MONITORING_DIR/monitor-logs.sh >> /var/log/auth-monitor.log 2>&1

# Performance check every 15 minutes
*/15 * * * * $MONITORING_DIR/performance-check.sh >> /var/log/auth-performance.log 2>&1

# Daily validation script
0 2 * * * $MONITORING_DIR/../scripts/validate-auth-environment.sh >> /var/log/auth-validation.log 2>&1
EOF

    success "Cron configuration created at $MONITORING_DIR/monitoring-cron"
    warning "To activate, run: crontab $MONITORING_DIR/monitoring-cron"
}

# Setup alerting
setup_alerting() {
    info "Setting up alerting configuration..."
    
    # Create alerting script template
    cat > "$MONITORING_DIR/send-alert.sh" << 'EOF'
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
EOF

    chmod +x "$MONITORING_DIR/send-alert.sh"
    success "Alerting script created"
}

# Create monitoring dashboard data
setup_dashboard_data() {
    info "Setting up dashboard data collection..."
    
    # Create metrics collection script
    cat > "$MONITORING_DIR/collect-metrics.sh" << 'EOF'
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
EOF

    chmod +x "$MONITORING_DIR/collect-metrics.sh"
    success "Metrics collection script created"
}

# Main setup function
main() {
    info "Setting up authentication monitoring infrastructure..."
    echo ""
    
    check_prerequisites
    setup_health_checks
    setup_log_monitoring
    setup_performance_monitoring
    setup_cron_jobs
    setup_alerting
    setup_dashboard_data
    
    echo ""
    success "🎉 Monitoring setup completed successfully!"
    info ""
    info "Next steps:"
    info "1. Configure environment variables (SLACK_WEBHOOK, ALERT_EMAIL, etc.)"
    info "2. Install cron jobs: crontab $MONITORING_DIR/monitoring-cron"
    info "3. Test scripts manually before automation"
    info "4. Review and customize alert thresholds"
    info ""
    info "Monitoring scripts created:"
    info "• Health checks: $MONITORING_DIR/health-check.sh"
    info "• Log monitoring: $MONITORING_DIR/monitor-logs.sh" 
    info "• Performance: $MONITORING_DIR/performance-check.sh"
    info "• Alerting: $MONITORING_DIR/send-alert.sh"
    info "• Metrics: $MONITORING_DIR/collect-metrics.sh"
}

# Run main function
main
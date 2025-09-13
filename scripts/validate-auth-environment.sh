#!/bin/bash

# Production Authentication Environment Validation Script
# Validates that all authentication components are properly configured and functional

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-http://localhost:6789}"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-30}"
LOG_FILE="${LOG_FILE:-auth-validation.log}"

# Initialize log file
echo "=== Authentication Environment Validation Started at $(date) ===" > "$LOG_FILE"

# Helper functions
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
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

# Check if curl is available
check_prerequisites() {
    info "Checking prerequisites..."
    
    if ! command -v curl &> /dev/null; then
        error "curl is required but not installed"
    fi
    
    if ! command -v jq &> /dev/null; then
        warning "jq not found - JSON parsing will be limited"
    fi
    
    success "Prerequisites check passed"
}

# Test application health endpoint
test_health_endpoint() {
    info "Testing health endpoint..."
    
    local health_response
    local status_code
    
    health_response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/api/health" || echo "HTTPSTATUS:000")
    status_code=$(echo "$health_response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    
    if [ "$status_code" != "200" ]; then
        error "Health endpoint returned status $status_code"
    fi
    
    # Parse health response
    local health_json
    health_json=$(echo "$health_response" | sed 's/HTTPSTATUS:[0-9]*$//')
    
    if command -v jq &> /dev/null; then
        local app_status
        local logto_configured
        
        app_status=$(echo "$health_json" | jq -r '.status // "unknown"')
        logto_configured=$(echo "$health_json" | jq -r '.auth.logto.configured // false')
        
        info "Application status: $app_status"
        info "Logto configured: $logto_configured"
        
        if [ "$app_status" != "healthy" ]; then
            warning "Application status is not healthy: $app_status"
        fi
        
        if [ "$logto_configured" != "true" ]; then
            error "Logto authentication is not properly configured"
        fi
    fi
    
    success "Health endpoint validation passed"
}

# Test authentication endpoints
test_auth_endpoints() {
    info "Testing authentication endpoints..."
    
    # Test sign-in endpoint (should redirect)
    local signin_status
    signin_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/logto/sign-in" || echo "000")
    
    if [[ ! "$signin_status" =~ ^(302|307)$ ]]; then
        error "Sign-in endpoint returned unexpected status: $signin_status (expected 302 or 307)"
    fi
    
    success "Sign-in endpoint responds correctly (status: $signin_status)"
    
    # Test sign-out endpoint (should redirect)
    local signout_status
    signout_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/logto/sign-out" || echo "000")
    
    if [[ ! "$signout_status" =~ ^(302|307)$ ]]; then
        error "Sign-out endpoint returned unexpected status: $signout_status (expected 302 or 307)"
    fi
    
    success "Sign-out endpoint responds correctly (status: $signout_status)"
    
    # Test callback endpoint (should handle GET requests)
    local callback_status
    callback_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/logto/callback" || echo "000")
    
    if [[ ! "$callback_status" =~ ^(200|302|400)$ ]]; then
        error "Callback endpoint returned unexpected status: $callback_status"
    fi
    
    success "Callback endpoint responds correctly (status: $callback_status)"
}

# Test API endpoints
test_api_endpoints() {
    info "Testing API endpoints..."
    
    # Test organizations endpoint (should require auth or return proper error)
    local orgs_status
    orgs_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/organizations" || echo "000")
    
    if [[ ! "$orgs_status" =~ ^(200|401|403)$ ]]; then
        warning "Organizations endpoint returned unexpected status: $orgs_status"
    else
        success "Organizations endpoint responds correctly (status: $orgs_status)"
    fi
    
    # Test profile settings endpoint
    local profile_status
    profile_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/profile/settings" || echo "000")
    
    if [[ ! "$profile_status" =~ ^(200|401|403)$ ]]; then
        warning "Profile settings endpoint returned unexpected status: $profile_status"
    else
        success "Profile settings endpoint responds correctly (status: $profile_status)"
    fi
}

# Test page loading
test_page_loading() {
    info "Testing page loading..."
    
    local pages=("/" "/inbox" "/library" "/catalog" "/profile")
    
    for page in "${pages[@]}"; do
        local page_status
        page_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$page" || echo "000")
        
        if [ "$page_status" != "200" ]; then
            error "Page $page returned status $page_status"
        fi
        
        success "Page $page loads correctly"
    done
}

# Test environment variables
test_environment_variables() {
    info "Testing environment variables..."
    
    local required_vars=("LOGTO_ENDPOINT" "LOGTO_APP_ID" "LOGTO_APP_SECRET")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        error "Missing required environment variables: ${missing_vars[*]}"
    fi
    
    success "All required environment variables are set"
    
    # Check optional but recommended variables
    local optional_vars=("LOGTO_RESOURCE_ID" "LOGTO_MANAGEMENT_API_RESOURCE" "LOGTO_MANAGEMENT_API_IDENTIFIER")
    
    for var in "${optional_vars[@]}"; do
        if [ -z "${!var}" ]; then
            warning "Optional environment variable $var is not set"
        else
            info "$var is configured"
        fi
    done
}

# Test JWT validation capabilities
test_jwt_validation() {
    info "Testing JWT validation setup..."
    
    # This is a mock test - in real scenarios you'd test with actual tokens
    # For now, we'll just verify the endpoint structure
    
    local test_endpoint="/api/organizations"
    local response_headers
    
    response_headers=$(curl -s -I "$BASE_URL$test_endpoint" | grep -i "www-authenticate\|authorization" || true)
    
    if [ -z "$response_headers" ]; then
        info "API endpoints appear to be public (no auth headers detected)"
    else
        success "Authentication headers detected in API responses"
    fi
}

# Performance baseline test
test_performance_baseline() {
    info "Testing performance baseline..."
    
    local start_time
    local end_time
    local duration
    
    start_time=$(date +%s%N)
    curl -s -o /dev/null "$BASE_URL"
    end_time=$(date +%s%N)
    
    duration=$(((end_time - start_time) / 1000000)) # Convert to milliseconds
    
    info "Homepage load time: ${duration}ms"
    
    if [ "$duration" -gt 5000 ]; then
        warning "Homepage load time exceeds 5 seconds (${duration}ms)"
    else
        success "Homepage performance is acceptable (${duration}ms)"
    fi
}

# Main validation function
run_validation() {
    info "Starting authentication environment validation..."
    info "Base URL: $BASE_URL"
    info "Timeout: $TIMEOUT_SECONDS seconds"
    info "Log file: $LOG_FILE"
    echo ""
    
    check_prerequisites
    echo ""
    
    test_environment_variables
    echo ""
    
    test_health_endpoint
    echo ""
    
    test_auth_endpoints
    echo ""
    
    test_api_endpoints  
    echo ""
    
    test_page_loading
    echo ""
    
    test_jwt_validation
    echo ""
    
    test_performance_baseline
    echo ""
    
    success "🎉 Authentication environment validation completed successfully!"
    info "Full validation log available in: $LOG_FILE"
}

# Error handling
trap 'error "Validation script interrupted"' INT TERM

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    run_validation
fi
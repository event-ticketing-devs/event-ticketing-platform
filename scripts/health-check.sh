#!/bin/bash
# ============================================================================
# Event Ticketing Platform - Health Check Script
# ============================================================================
# This script verifies the application is running correctly.
# Use after deployment or to diagnose issues.
#
# Usage:
#   ./scripts/health-check.sh [options]
#
# Options:
#   --verbose    Show detailed output
#   --json       Output in JSON format
#   --quick      Only check basic endpoints (faster)
# ============================================================================

set -e

# ============================================================================
# CONFIGURATION
# ============================================================================
PROJECT_DIR="${PROJECT_DIR:-$HOME/event-ticketing-platform}"
COMPOSE_FILE="docker-compose.prod.yml"
BASE_URL="${BASE_URL:-http://localhost}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================================
# PARSE ARGUMENTS
# ============================================================================
VERBOSE=false
JSON_OUTPUT=false
QUICK=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --json)
            JSON_OUTPUT=true
            shift
            ;;
        --quick|-q)
            QUICK=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================
check_passed=0
check_failed=0
check_warnings=0

log_check() {
    local status=$1
    local name=$2
    local details=$3
    
    if [ "$JSON_OUTPUT" = true ]; then
        return
    fi
    
    case $status in
        "pass")
            echo -e "${GREEN}PASS${NC} - $name"
            ((check_passed++))
            ;;
        "fail")
            echo -e "${RED}FAIL${NC} - $name"
            if [ -n "$details" ] && [ "$VERBOSE" = true ]; then
                echo -e "   ${RED}$details${NC}"
            fi
            ((check_failed++))
            ;;
        "warn")
            echo -e "${YELLOW}WARN${NC} - $name"
            if [ -n "$details" ] && [ "$VERBOSE" = true ]; then
                echo -e "   ${YELLOW}$details${NC}"
            fi
            ((check_warnings++))
            ;;
    esac
}

# ============================================================================
# CHECK: Docker Daemon
# ============================================================================
check_docker() {
    if docker info > /dev/null 2>&1; then
        log_check "pass" "Docker daemon running"
        return 0
    else
        log_check "fail" "Docker daemon not running"
        return 1
    fi
}

# ============================================================================
# CHECK: Container Status
# ============================================================================
check_containers() {
    cd "$PROJECT_DIR"
    
    # Check if containers exist
    local running_count=$(docker compose -f $COMPOSE_FILE ps -q 2>/dev/null | wc -l)
    
    if [ "$running_count" -eq 0 ]; then
        log_check "fail" "No containers running"
        return 1
    fi
    
    # Check each container
    local all_healthy=true
    
    for container in frontend backend redis; do
        local status=$(docker compose -f $COMPOSE_FILE ps $container --format "{{.Status}}" 2>/dev/null || echo "not found")
        
        if echo "$status" | grep -qE "Up|running"; then
            log_check "pass" "Container '$container' is running"
        else
            log_check "fail" "Container '$container' status: $status"
            all_healthy=false
        fi
    done
    
    if [ "$all_healthy" = true ]; then
        return 0
    else
        return 1
    fi
}

# ============================================================================
# CHECK: Nginx Health Endpoint
# ============================================================================
check_nginx() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health" 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ]; then
        log_check "pass" "Nginx health endpoint (HTTP $response)"
        return 0
    else
        log_check "fail" "Nginx health endpoint (HTTP $response)"
        return 1
    fi
}

# ============================================================================
# CHECK: API Endpoints
# ============================================================================
check_api() {
    # Check categories endpoint (should work without auth)
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/categories" 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ] || [ "$response" = "304" ]; then
        log_check "pass" "API /categories endpoint (HTTP $response)"
    else
        log_check "fail" "API /categories endpoint (HTTP $response)"
    fi
    
    # Check events endpoint
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/events" 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ] || [ "$response" = "304" ]; then
        log_check "pass" "API /events endpoint (HTTP $response)"
    else
        log_check "warn" "API /events endpoint (HTTP $response)"
    fi
    
    # Check venues endpoint
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/venues" 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ] || [ "$response" = "304" ]; then
        log_check "pass" "API /venues endpoint (HTTP $response)"
    else
        log_check "warn" "API /venues endpoint (HTTP $response)"
    fi
}

# ============================================================================
# CHECK: Redis Connection
# ============================================================================
check_redis() {
    cd "$PROJECT_DIR"
    
    local ping_result=$(docker compose -f $COMPOSE_FILE exec -T redis redis-cli ping 2>/dev/null || echo "FAIL")
    
    if echo "$ping_result" | grep -q "PONG"; then
        log_check "pass" "Redis responding to PING"
        
        if [ "$VERBOSE" = true ]; then
            # Show Redis info
            local info=$(docker compose -f $COMPOSE_FILE exec -T redis redis-cli info memory 2>/dev/null | grep "used_memory_human" || echo "")
            if [ -n "$info" ]; then
                echo "   Memory: $info"
            fi
        fi
        return 0
    else
        log_check "fail" "Redis not responding"
        return 1
    fi
}

# ============================================================================
# CHECK: MongoDB Connection (via backend logs)
# ============================================================================
check_mongodb() {
    cd "$PROJECT_DIR"
    
    local mongo_log=$(docker compose -f $COMPOSE_FILE logs backend 2>&1 | grep -i "mongodb" | tail -5)
    
    if echo "$mongo_log" | grep -qi "connected"; then
        log_check "pass" "MongoDB connected (verified in logs)"
        return 0
    elif echo "$mongo_log" | grep -qi "error\|failed"; then
        log_check "fail" "MongoDB connection error found in logs"
        return 1
    else
        log_check "warn" "Could not verify MongoDB connection"
        return 0
    fi
}

# ============================================================================
# CHECK: WebSocket (Socket.io)
# ============================================================================
check_websocket() {
    # Check if socket.io endpoint is accessible
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/socket.io/" 2>/dev/null || echo "000")
    
    # Socket.io returns various codes (200, 400) depending on the request
    if [ "$response" != "000" ] && [ "$response" != "502" ] && [ "$response" != "504" ]; then
        log_check "pass" "Socket.io endpoint accessible (HTTP $response)"
        return 0
    else
        log_check "warn" "Socket.io endpoint check (HTTP $response)"
        return 0
    fi
}

# ============================================================================
# CHECK: Disk Space
# ============================================================================
check_disk() {
    local usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$usage" -lt 80 ]; then
        log_check "pass" "Disk usage: ${usage}%"
        return 0
    elif [ "$usage" -lt 90 ]; then
        log_check "warn" "Disk usage: ${usage}% (consider cleanup)"
        return 0
    else
        log_check "fail" "Disk usage: ${usage}% (critical!)"
        return 1
    fi
}

# ============================================================================
# CHECK: Memory Usage
# ============================================================================
check_memory() {
    local mem_info=$(free -m | awk 'NR==2')
    local total=$(echo $mem_info | awk '{print $2}')
    local used=$(echo $mem_info | awk '{print $3}')
    local percentage=$((used * 100 / total))
    
    if [ "$percentage" -lt 80 ]; then
        log_check "pass" "Memory usage: ${percentage}% (${used}MB / ${total}MB)"
        return 0
    elif [ "$percentage" -lt 95 ]; then
        log_check "warn" "Memory usage: ${percentage}% (${used}MB / ${total}MB)"
        return 0
    else
        log_check "fail" "Memory usage: ${percentage}% (${used}MB / ${total}MB)"
        return 1
    fi
}

# ============================================================================
# CHECK: Docker Resource Usage
# ============================================================================
check_docker_resources() {
    cd "$PROJECT_DIR"
    
    if [ "$VERBOSE" = true ]; then
        echo ""
        echo "Container Resource Usage:"
        docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
        echo ""
    fi
    
    log_check "pass" "Docker resources checked"
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

if [ "$JSON_OUTPUT" = false ]; then
    echo ""
    echo "========================================"
    echo "Health Check - Event Ticketing Platform"
    echo "========================================"
    echo "Time: $(date)"
    echo "URL: $BASE_URL"
    echo ""
fi

# Run checks
check_docker

if [ "$QUICK" = true ]; then
    # Quick checks only
    check_nginx
    check_api
else
    # Full checks
    check_containers
    check_nginx
    check_api
    check_redis
    check_mongodb
    check_websocket
    check_disk
    check_memory
    
    if [ "$VERBOSE" = true ]; then
        check_docker_resources
    fi
fi

# Summary
if [ "$JSON_OUTPUT" = false ]; then
    echo ""
    echo "========================================"
    echo "📊 Summary"
    echo "========================================"
    echo -e "   ${GREEN}Passed:${NC}   $check_passed"
    echo -e "   ${YELLOW}Warnings:${NC} $check_warnings"
    echo -e "   ${RED}Failed:${NC}   $check_failed"
    echo ""
    
    if [ $check_failed -eq 0 ]; then
        echo -e "${GREEN}All critical checks passed!${NC}"
        exit 0
    else
        echo -e "${RED}Some checks failed. Review the output above.${NC}"
        exit 1
    fi
else
    # JSON output
    cat << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "passed": $check_passed,
    "warnings": $check_warnings,
    "failed": $check_failed,
    "healthy": $([ $check_failed -eq 0 ] && echo "true" || echo "false")
}
EOF
    exit $([ $check_failed -eq 0 ] && echo 0 || echo 1)
fi

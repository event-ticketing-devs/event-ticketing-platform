#!/bin/bash
# ============================================================================
# Event Ticketing Platform - Deployment Script
# ============================================================================
# This script is executed on the EC2 server to deploy the application.
# It can be run manually or triggered by GitHub Actions.
#
# Usage:
#   ./scripts/deploy.sh [options]
#
# Options:
#   --no-cache     Force rebuild without Docker cache
#   --skip-backup  Skip creating backup tag
#   --rollback     Rollback to previous version
#   --health-only  Only run health checks
# ============================================================================

set -e  # Exit on any error

# ============================================================================
# CONFIGURATION
# ============================================================================
PROJECT_DIR="${PROJECT_DIR:-$HOME/event-ticketing-platform}"
COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="/tmp/deployment-backups"
MAX_HEALTH_RETRIES=20
HEALTH_RETRY_INTERVAL=3

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

log_info() {
    echo -e "${BLUE}$1${NC}"
}

log_success() {
    echo -e "${GREEN}$1${NC}"
}

log_warning() {
    echo -e "${YELLOW}WARN${NC} - $1"
}

log_error() {
    echo -e "${RED}ERROR${NC} - $1"
}

log_header() {
    echo ""
    echo "========================================"
    echo -e "${BLUE}$1${NC}"
    echo "========================================"
}

# ============================================================================
# PARSE ARGUMENTS
# ============================================================================
NO_CACHE=false
SKIP_BACKUP=false
ROLLBACK=false
HEALTH_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --no-cache)
            NO_CACHE=true
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --rollback)
            ROLLBACK=true
            shift
            ;;
        --health-only)
            HEALTH_ONLY=true
            shift
            ;;
        *)
            log_warning "Unknown option: $1"
            shift
            ;;
    esac
done

# ============================================================================
# HEALTH CHECK FUNCTION
# ============================================================================
run_health_checks() {
    log_header "Running Health Checks"
    
    local all_passed=true
    
    # Check Nginx/Frontend
    log_info "Checking Nginx..."
    for i in $(seq 1 $MAX_HEALTH_RETRIES); do
        if curl -s -f http://localhost/health > /dev/null 2>&1; then
            log_success "Nginx health check passed!"
            break
        fi
        if [ $i -eq $MAX_HEALTH_RETRIES ]; then
            log_error "Nginx health check failed after $MAX_HEALTH_RETRIES attempts"
            all_passed=false
        else
            echo "   Waiting for Nginx... (attempt $i/$MAX_HEALTH_RETRIES)"
            sleep $HEALTH_RETRY_INTERVAL
        fi
    done
    
    # Check API
    log_info "Checking API..."
    for i in $(seq 1 $MAX_HEALTH_RETRIES); do
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/categories 2>/dev/null || echo "000")
        if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
            log_success "API health check passed! (HTTP $HTTP_CODE)"
            break
        fi
        if [ $i -eq $MAX_HEALTH_RETRIES ]; then
            log_warning "API returned HTTP $HTTP_CODE (may still be starting)"
        else
            echo "   Waiting for API... (attempt $i/$MAX_HEALTH_RETRIES, HTTP $HTTP_CODE)"
            sleep $HEALTH_RETRY_INTERVAL
        fi
    done
    
    # Check Redis
    log_info "Checking Redis..."
    if docker compose -f $COMPOSE_FILE exec -T redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
        log_success "Redis health check passed!"
    else
        log_warning "Redis health check inconclusive"
    fi
    
    # Check Backend logs for MongoDB connection
    log_info "Checking MongoDB connection..."
    if docker compose -f $COMPOSE_FILE logs backend 2>&1 | grep -q "MongoDB connected"; then
        log_success "MongoDB connection verified!"
    else
        log_warning "Could not verify MongoDB connection in logs"
    fi
    
    # Check Backend logs for Redis connection
    if docker compose -f $COMPOSE_FILE logs backend 2>&1 | grep -q "Connected to Redis"; then
        log_success "Redis connection verified in backend!"
    fi
    
    echo ""
    if [ "$all_passed" = true ]; then
        log_success "All health checks passed!"
        return 0
    else
        log_error "Some health checks failed"
        return 1
    fi
}

# ============================================================================
# HEALTH CHECK ONLY MODE
# ============================================================================
if [ "$HEALTH_ONLY" = true ]; then
    cd "$PROJECT_DIR"
    run_health_checks
    exit $?
fi

# ============================================================================
# MAIN DEPLOYMENT
# ============================================================================
log_header "Starting Deployment"
echo "Deployment Time: $(date)"
echo "Project Directory: $PROJECT_DIR"
echo ""

cd "$PROJECT_DIR"

# ============================================================================
# ROLLBACK MODE
# ============================================================================
if [ "$ROLLBACK" = true ]; then
    log_header "Rolling Back Deployment"
    
    # Get last known good commit
    if [ -f "$BACKUP_DIR/last_good_commit" ]; then
        ROLLBACK_COMMIT=$(cat "$BACKUP_DIR/last_good_commit")
        log_info "Rolling back to commit: $ROLLBACK_COMMIT"
        git checkout "$ROLLBACK_COMMIT"
        
        # Rebuild and restart
        docker compose -f $COMPOSE_FILE build
        docker compose -f $COMPOSE_FILE down
        docker compose -f $COMPOSE_FILE up -d
        
        log_success "Rollback complete!"
        run_health_checks
    else
        log_error "No backup commit found. Manual intervention required."
        exit 1
    fi
    exit 0
fi

# ============================================================================
# STEP 1: Create Backup
# ============================================================================
if [ "$SKIP_BACKUP" = false ]; then
    log_header "Creating Backup"
    mkdir -p "$BACKUP_DIR"
    
    # Save current commit hash
    CURRENT_COMMIT=$(git rev-parse HEAD)
    echo "$CURRENT_COMMIT" > "$BACKUP_DIR/last_good_commit"
    
    # Save current image tags
    docker compose -f $COMPOSE_FILE images > "$BACKUP_DIR/images_backup.txt" 2>/dev/null || true
    
    log_success "Backup created (commit: ${CURRENT_COMMIT:0:8})"
fi

# ============================================================================
# STEP 2: Pull Latest Code
# ============================================================================
log_header "Pulling Latest Code"
git fetch origin main
git reset --hard origin/main

NEW_COMMIT=$(git rev-parse --short HEAD)
COMMIT_MESSAGE=$(git log -1 --pretty=%B | head -1)
log_success "Updated to commit: $NEW_COMMIT"
echo "   Message: $COMMIT_MESSAGE"

# ============================================================================
# STEP 3: Build Docker Images
# ============================================================================
log_header "Building Docker Images"

if [ "$NO_CACHE" = true ]; then
    log_warning "Building without cache (this will take longer)"
    docker compose -f $COMPOSE_FILE build --no-cache
else
    docker compose -f $COMPOSE_FILE build
fi

log_success "Docker images built successfully"

# ============================================================================
# STEP 4: Stop Old Containers
# ============================================================================
log_header "Stopping Old Containers"
docker compose -f $COMPOSE_FILE down --remove-orphans
log_success "Old containers stopped"

# ============================================================================
# STEP 5: Start New Containers
# ============================================================================
log_header "Starting New Containers"
docker compose -f $COMPOSE_FILE up -d
log_success "New containers started"

# Wait for services to initialize
log_info "Waiting for services to initialize..."
sleep 10

# ============================================================================
# STEP 6: Health Checks
# ============================================================================
if ! run_health_checks; then
    log_error "Health checks failed. Consider rolling back:"
    echo "   ./scripts/deploy.sh --rollback"
    exit 1
fi

# ============================================================================
# STEP 7: Cleanup
# ============================================================================
log_header "Cleaning Up"
docker image prune -f
log_success "Cleaned up unused Docker images"

# ============================================================================
# STEP 8: Final Status
# ============================================================================
log_header "DEPLOYMENT SUCCESSFUL!"
echo ""
echo "Completed: $(date)"
echo "Commit: $NEW_COMMIT"
echo "Message: $COMMIT_MESSAGE"
echo ""
echo "Running Containers:"
docker compose -f $COMPOSE_FILE ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "Resource Usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
echo ""
log_success "Deployment complete!"

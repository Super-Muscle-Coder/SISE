#!/bin/bash
# =============================================================================
# AI Service Health Check — Bash Script
# =============================================================================
# Purpose: Monitor health of AI Service container
# Usage: bash scripts/ai-service/health-check.sh [OPTIONS]
# =============================================================================

set -e

# Configuration
HOST="${AI_SERVICE_HOST:-localhost}"
PORT="${AI_SERVICE_PORT:-8001}"
TIMEOUT="${HEALTH_CHECK_TIMEOUT:-10}"
RETRIES="${HEALTH_CHECK_RETRIES:-3}"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Helper functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check liveness
check_liveness() {
	log_info "Checking /health/liveness..."

	response=$(curl -s -w "%{http_code}" -o /dev/null \
		--connect-timeout "$TIMEOUT" \
		http://"$HOST":"$PORT"/health/liveness 2>/dev/null || echo "000")

	if [ "$response" = "200" ]; then
		log_success "Liveness probe passed (HTTP 200)"
		return 0
	else
		log_error "Liveness probe failed (HTTP $response)"
		return 1
	fi
}

# Check readiness
check_readiness() {
	log_info "Checking /health/readiness..."

	response=$(curl -s -w "%{http_code}" -o /tmp/readiness.json \
		--connect-timeout "$TIMEOUT" \
		http://"$HOST":"$PORT"/health/readiness 2>/dev/null || echo "000")

	if [ "$response" = "200" ]; then
		log_success "Readiness probe passed (HTTP 200)"
		[ -f /tmp/readiness.json ] && cat /tmp/readiness.json
		return 0
	else
		log_warning "Readiness probe not yet passing (HTTP $response)"
		[ -f /tmp/readiness.json ] && cat /tmp/readiness.json
		return 1
	fi
}

# Retry logic
retry_with_backoff() {
	local attempt=1
	local delay=2

	while [ $attempt -le "$RETRIES" ]; do
		log_info "Attempt $attempt/$RETRIES..."

		if check_readiness; then
			return 0
		fi

		if [ $attempt -lt "$RETRIES" ]; then
			log_warning "Retrying in ${delay}s..."
			sleep "$delay"
			delay=$((delay * 2))
		fi

		attempt=$((attempt + 1))
	done

	return 1
}

# Display usage
show_help() {
	cat <<EOF
AI Service Health Check

USAGE:
  bash scripts/ai-service/health-check.sh [OPTIONS]

OPTIONS:
  --host HOST         Service host (default: localhost)
  --port PORT         Service port (default: 8001)
  --timeout SECONDS   Curl timeout (default: 10)
  --retries COUNT     Number of retries (default: 3)
  --liveness          Check only liveness (quick)
  --readiness         Check only readiness (detailed, with retries)
  --help              Show this message

EXAMPLES:
  # Quick liveness check
  bash scripts/ai-service/health-check.sh --liveness

  # Full readiness check with retries
  bash scripts/ai-service/health-check.sh --readiness

  # Custom host/port
  bash scripts/ai-service/health-check.sh --host 192.168.1.100 --port 8001

EOF
}

# Parse arguments
CHECK_MODE="both"

while [[ $# -gt 0 ]]; do
	case $1 in
		--host)
			HOST="$2"
			shift 2
			;;
		--port)
			PORT="$2"
			shift 2
			;;
		--timeout)
			TIMEOUT="$2"
			shift 2
			;;
		--retries)
			RETRIES="$2"
			shift 2
			;;
		--liveness)
			CHECK_MODE="liveness"
			shift
			;;
		--readiness)
			CHECK_MODE="readiness"
			shift
			;;
		--help)
			show_help
			exit 0
			;;
		*)
			log_error "Unknown option: $1"
			show_help
			exit 1
			;;
	esac
done

# Run checks
echo ""
log_info "AI Service Health Check"
log_info "Target: http://$HOST:$PORT"
echo ""

case $CHECK_MODE in
	liveness)
		check_liveness
		;;
	readiness)
		retry_with_backoff
		;;
	both)
		if check_liveness; then
			log_info ""
			retry_with_backoff || log_warning "Service may still be warming up"
		else
			exit 1
		fi
		;;
esac

exit $?

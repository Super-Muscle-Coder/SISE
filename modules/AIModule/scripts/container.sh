#!/bin/bash
# =============================================================================
# AI Service Container Management — Bash Script
# =============================================================================
# Purpose: Quick commands to start/stop/restart AI Service container
# Usage: bash scripts/ai-service/container.sh [COMMAND] [OPTIONS]
# =============================================================================

set -e

# Configuration
CONTAINER_NAME="${CONTAINER_NAME:-sise-ai-service}"
IMAGE_NAME="${IMAGE_NAME:-ai-service:1.0.0}"
PORT="${AI_SERVICE_PORT:-8001}"

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

# Check if Docker is available
check_docker() {
	if ! command -v docker &> /dev/null; then
		log_error "Docker is not installed or not in PATH"
		return 1
	fi
	return 0
}

# Start container
start_container() {
	local name="$1"
	local image="$2"
	local port="$3"

	log_info "Starting container: $name"

	# Check if container already running
	if docker ps --format '{{.Names}}' | grep -q "^${name}$"; then
		log_warning "Container already running: $name"
		return 0
	fi

	# Check if container exists but stopped
	if docker ps -a --format '{{.Names}}' | grep -q "^${name}$"; then
		log_info "Container exists but stopped, starting..."
		docker start "$name"
		log_success "Container started: $name"
		return 0
	fi

	# Create and start new container
	log_info "Creating new container..."
	docker run -d \
		--name "$name" \
		-p "$port:$port" \
		-e AI_SERVICE_PORT="$port" \
		-e CLIP_MODEL_NAME=ViT-B/32 \
		-e DEVICE=cpu \
		-e MODEL_CACHE_DIR=/app/ai-service/model_cache \
		"$image"

	if [ $? -eq 0 ]; then
		log_success "Container started: $name"
		return 0
	else
		log_error "Failed to start container"
		return 1
	fi
}

# Stop container
stop_container() {
	local name="$1"

	log_info "Stopping container: $name"

	if ! docker ps --format '{{.Names}}' | grep -q "^${name}$"; then
		log_warning "Container not running: $name"
		return 0
	fi

	docker stop "$name"
	log_success "Container stopped: $name"
	return 0
}

# Restart container
restart_container() {
	local name="$1"

	log_info "Restarting container: $name"
	stop_container "$name"
	sleep 2
	start_container "$name" "$IMAGE_NAME" "$PORT"
	return 0
}

# Remove container
remove_container() {
	local name="$1"

	log_info "Removing container: $name"

	# Stop if running
	if docker ps --format '{{.Names}}' | grep -q "^${name}$"; then
		docker stop "$name"
	fi

	# Remove if exists
	if docker ps -a --format '{{.Names}}' | grep -q "^${name}$"; then
		docker rm "$name"
		log_success "Container removed: $name"
	else
		log_warning "Container not found: $name"
	fi

	return 0
}

# View container status
view_status() {
	local name="$1"

	log_info "Container status: $name"
	echo ""

	if docker ps --format '{{.Names}}' | grep -q "^${name}$"; then
		docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep "$name"
	elif docker ps -a --format '{{.Names}}' | grep -q "^${name}$"; then
		docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep "$name"
	else
		log_warning "Container not found: $name"
		return 1
	fi

	return 0
}

# View container logs
view_logs() {
	local name="$1"
	local lines="${2:-50}"

	log_info "Container logs (last $lines lines): $name"
	docker logs --tail "$lines" -f "$name" 2>/dev/null || log_error "Container not found"
}

# Display usage
show_help() {
	cat <<EOF
AI Service Container Management

USAGE:
  bash scripts/ai-service/container.sh [COMMAND] [OPTIONS]

COMMANDS:
  start       Start container (create if not exists)
  stop        Stop running container
  restart     Stop and start container
  remove      Remove container completely
  status      View container status
  logs        View container logs (real-time)
  help        Show this message

OPTIONS:
  --name NAME         Container name (default: sise-ai-service)
  --image IMAGE       Docker image (default: ai-service:1.0.0)
  --port PORT         Port mapping (default: 8001)
  --tail LINES        Lines of logs to show (default: 50)

EXAMPLES:
  # Start container
  bash scripts/ai-service/container.sh start

  # Stop container
  bash scripts/ai-service/container.sh stop

  # Restart container
  bash scripts/ai-service/container.sh restart

  # View logs
  bash scripts/ai-service/container.sh logs

  # View status
  bash scripts/ai-service/container.sh status

  # Custom image/port
  bash scripts/ai-service/container.sh start --image ai-service:dev --port 9001

EOF
}

# Parse global options
while [[ $# -gt 0 ]]; do
	case $1 in
		--name)
			CONTAINER_NAME="$2"
			shift 2
			;;
		--image)
			IMAGE_NAME="$2"
			shift 2
			;;
		--port)
			PORT="$2"
			shift 2
			;;
		*)
			break
			;;
	esac
done

# Get command
COMMAND="${1:-help}"
shift || true

# Main logic
echo ""

if ! check_docker; then
	exit 1
fi

case "$COMMAND" in
	start)
		start_container "$CONTAINER_NAME" "$IMAGE_NAME" "$PORT"
		;;
	stop)
		stop_container "$CONTAINER_NAME"
		;;
	restart)
		restart_container "$CONTAINER_NAME"
		;;
	remove)
		remove_container "$CONTAINER_NAME"
		;;
	status)
		view_status "$CONTAINER_NAME"
		;;
	logs)
		TAIL_LINES="${1:-50}"
		view_logs "$CONTAINER_NAME" "$TAIL_LINES"
		;;
	help)
		show_help
		;;
	*)
		log_error "Unknown command: $COMMAND"
		show_help
		exit 1
		;;
esac

exit $?

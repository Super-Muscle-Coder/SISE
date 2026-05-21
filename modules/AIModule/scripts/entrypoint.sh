#!/bin/bash
# =============================================================================
# AI Service Container Entry Point
# =============================================================================
# Purpose: Prepare environment and start FastAPI service
# Features:
#   1. Validate required env vars
#   2. Create model cache directory
#   3. Log startup information (without exposing secrets)
#   4. Start uvicorn with proper configuration
# =============================================================================

set -e  # Exit on any error

# Color codes for logging
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}[AI Service]${NC} Initializing container..."

# =============================================================================
# STEP 1: Validate Required Environment Variables
# =============================================================================
echo -e "${BLUE}[AI Service]${NC} Validating environment variables..."

REQUIRED_VARS=(
	"AI_SERVICE_PORT"
	"CLIP_MODEL_NAME"
	"DEVICE"
	"MODEL_CACHE_DIR"
)

for var in "${REQUIRED_VARS[@]}"; do
	if [ -z "${!var}" ]; then
		echo -e "${RED}[ERROR]${NC} Required env var not set: ${var}"
		exit 1
	else
		# Log var name only, never log value (security)
		echo -e "${GREEN}[OK]${NC} ${var} is set"
	fi
done

# =============================================================================
# STEP 2: Create and Verify Model Cache Directory
# =============================================================================
echo -e "${BLUE}[AI Service]${NC} Setting up model cache directory..."

if [ ! -d "$MODEL_CACHE_DIR" ]; then
	mkdir -p "$MODEL_CACHE_DIR"
	echo -e "${GREEN}[OK]${NC} Created: $MODEL_CACHE_DIR"
else
	echo -e "${GREEN}[OK]${NC} Cache directory exists: $MODEL_CACHE_DIR"
fi

# Verify write permissions
if [ ! -w "$MODEL_CACHE_DIR" ]; then
	echo -e "${RED}[ERROR]${NC} No write permissions for $MODEL_CACHE_DIR"
	exit 1
fi
echo -e "${GREEN}[OK]${NC} Write permissions verified"

# =============================================================================
# STEP 3: Log Startup Configuration (Secret-Safe)
# =============================================================================
echo -e "${BLUE}[AI Service]${NC} Startup configuration:"
echo -e "${BLUE}[AI Service]${NC}   - Service Port: $AI_SERVICE_PORT"
echo -e "${BLUE}[AI Service]${NC}   - CLIP Model: $CLIP_MODEL_NAME"
echo -e "${BLUE}[AI Service]${NC}   - Device: $DEVICE"
echo -e "${BLUE}[AI Service]${NC}   - Cache Dir: $MODEL_CACHE_DIR"
echo -e "${BLUE}[AI Service]${NC}   - Python: $(python --version)"
echo -e "${BLUE}[AI Service]${NC}   - App Path: $PYTHONPATH"

# =============================================================================
# STEP 4: Verify Python Dependencies
# =============================================================================
echo -e "${BLUE}[AI Service]${NC} Verifying Python dependencies..."

python -c "import fastapi; print('  FastAPI OK')" || {
	echo -e "${RED}[ERROR]${NC} FastAPI not installed"
	exit 1
}

python -c "import torch; print('  PyTorch OK')" || {
	echo -e "${RED}[ERROR]${NC} PyTorch not installed"
	exit 1
}

python -c "import open_clip; print('  OpenCLIP OK')" || {
	echo -e "${RED}[ERROR]${NC} OpenCLIP not installed"
	exit 1
}

# =============================================================================
# STEP 5: Start FastAPI Service
# =============================================================================
echo -e "${GREEN}[AI Service]${NC} Starting FastAPI service..."
echo -e "${YELLOW}[AI Service]${NC} Listening on 0.0.0.0:$AI_SERVICE_PORT"
echo -e "${YELLOW}[AI Service]${NC} Press Ctrl+C to stop"
echo ""

# Start uvicorn with environment variables
exec python -m uvicorn \
	ai_main:create_app \
	--host "0.0.0.0" \
	--port "$AI_SERVICE_PORT" \
	--log-level "${LOG_LEVEL:-info}" \
	"$@"

# Note: exec ensures the process replaces the shell (proper signal handling)
# Additional args can be passed to override defaults (e.g., --reload for dev)

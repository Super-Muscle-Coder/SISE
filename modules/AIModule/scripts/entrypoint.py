#!/usr/bin/env python3
"""
AI Service Container Entry Point
Purpose: Prepare environment and start FastAPI service
"""

import os
import sys
import subprocess
from pathlib import Path

# Color codes for logging
class Colors:
    BLUE = '\033[0;34m'
    GREEN = '\033[0;32m'
    RED = '\033[0;31m'
    YELLOW = '\033[1;33m'
    NC = '\033[0m'

def log_info(msg):
    print(f"{Colors.BLUE}[AI Service]{Colors.NC} {msg}")

def log_ok(msg):
    print(f"{Colors.GREEN}[OK]{Colors.NC} {msg}")

def log_error(msg):
    print(f"{Colors.RED}[ERROR]{Colors.NC} {msg}")
    sys.exit(1)

def log_warning(msg):
    print(f"{Colors.YELLOW}[WARN]{Colors.NC} {msg}")

# ===========================================================================
# STEP 1: Validate Required Environment Variables
# ===========================================================================
log_info("Validating environment variables...")

REQUIRED_VARS = [
    "AI_SERVICE_PORT",
    "CLIP_MODEL_NAME",
    "DEVICE",
    "MODEL_CACHE_DIR",
]

for var in REQUIRED_VARS:
    if not os.environ.get(var):
        log_error(f"Required env var not set: {var}")
    else:
        # Log var name only, never log value (security)
        log_ok(f"{var} is set")

# ===========================================================================
# STEP 2: Create and Verify Model Cache Directory
# ===========================================================================
log_info("Setting up model cache directory...")

model_cache_dir = os.environ.get("MODEL_CACHE_DIR")
cache_path = Path(model_cache_dir)

if not cache_path.exists():
    cache_path.mkdir(parents=True, exist_ok=True)
    log_ok(f"Created: {model_cache_dir}")
else:
    log_ok(f"Cache directory exists: {model_cache_dir}")

# Verify write permissions
if not os.access(model_cache_dir, os.W_OK):
    log_error(f"No write permissions for {model_cache_dir}")

log_ok("Write permissions verified")

# ===========================================================================
# STEP 3: Log Startup Configuration (Secret-Safe)
# ===========================================================================
log_info("Startup configuration:")
print(f"{Colors.BLUE}[AI Service]{Colors.NC}   - Service Port: {os.environ.get('AI_SERVICE_PORT')}")
print(f"{Colors.BLUE}[AI Service]{Colors.NC}   - CLIP Model: {os.environ.get('CLIP_MODEL_NAME')}")
print(f"{Colors.BLUE}[AI Service]{Colors.NC}   - Device: {os.environ.get('DEVICE')}")
print(f"{Colors.BLUE}[AI Service]{Colors.NC}   - Cache Dir: {model_cache_dir}")
print(f"{Colors.BLUE}[AI Service]{Colors.NC}   - Python: {sys.version.split()[0]}")
print(f"{Colors.BLUE}[AI Service]{Colors.NC}   - App Path: {os.environ.get('PYTHONPATH', 'Not set')}")

# ===========================================================================
# STEP 4: Verify Python Dependencies
# ===========================================================================
log_info("Verifying Python dependencies...")

try:
    import fastapi
    print("  FastAPI OK")
except ImportError:
    log_error("FastAPI not installed")

try:
    import torch
    print("  PyTorch OK")
except ImportError:
    log_error("PyTorch not installed")

try:
    import open_clip
    print("  OpenCLIP OK")
except ImportError:
    log_error("OpenCLIP not installed")

# ===========================================================================
# STEP 5: Start FastAPI Service
# ===========================================================================
log_ok("Starting FastAPI service...")
log_warning(f"Listening on 0.0.0.0:{os.environ.get('AI_SERVICE_PORT')}")
log_warning("Press Ctrl+C to stop")
print()

# Build uvicorn command
# Use factory pattern: uvicorn ai_main:create_app --factory
port = os.environ.get("AI_SERVICE_PORT", "8001")
log_level = os.environ.get("LOG_LEVEL", "info").lower()

cmd = [
    sys.executable,
    "-m",
    "uvicorn",
    "ai_main:create_app",
    "--factory",  # Tell uvicorn that create_app is a factory function
    "--host", "0.0.0.0",
    "--port", str(port),
    "--log-level", log_level,
]

# Pass through any additional arguments
if len(sys.argv) > 1:
    cmd.extend(sys.argv[1:])

# Start uvicorn (replaces this process)
os.execvp(cmd[0], cmd)

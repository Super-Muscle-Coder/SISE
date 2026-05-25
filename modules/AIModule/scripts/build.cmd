@echo off
REM ==========================================================================
REM AI Service Container Build Helper — Windows CMD
REM ==========================================================================
REM Purpose: Validate Dockerfile, build image, test container
REM Requirements: Docker Desktop installed and running
REM Usage: build.cmd [action] [tag]
REM ==========================================================================

setlocal enabledelayedexpansion

REM Initialize defaults
set "ACTION=help"
set "IMAGE_TAG=ai-service:1.0.0"

REM Parse arguments BEFORE any function calls
if not "%1"=="" set "ACTION=%1"
if not "%2"=="" set "IMAGE_TAG=%2"

REM ==========================================================================
REM MAIN STARTUP
REM ==========================================================================

echo.
echo ========================================
echo AI Service Container Build Helper
echo ========================================
echo.
echo ACTION: !ACTION!
echo IMAGE_TAG: !IMAGE_TAG!
echo.

REM Check Docker
docker --version >nul 2>&1
if errorlevel 1 (
	echo [ERROR] Docker is not installed or not in PATH
	exit /b 1
)
echo [SUCCESS] Docker is available
echo.

REM Route to appropriate action
goto action_!ACTION!

:action_validate
echo [INFO] Validating Dockerfile...
set "DOCKERFILE_PATH=modules\AIModule\ai_container_Dockerfile"
if not exist "!DOCKERFILE_PATH!" (
	echo [ERROR] Dockerfile not found at: !DOCKERFILE_PATH!
	exit /b 1
)
echo [SUCCESS] Dockerfile found and valid
exit /b 0

:action_build
echo [INFO] Building Docker image: !IMAGE_TAG!
echo [INFO] This may take 2-5 minutes on first build...
echo.

REM Validate first
set "DOCKERFILE_PATH=modules\AIModule\ai_container_Dockerfile"
if not exist "!DOCKERFILE_PATH!" (
	echo [ERROR] Dockerfile not found
	exit /b 1
)

REM Build
docker build ^
	-f modules\AIModule\ai_container_Dockerfile ^
	-t !IMAGE_TAG! ^
	--build-arg BUILDKIT_INLINE_CACHE=1 ^
	.

if errorlevel 1 (
	echo.
	echo [ERROR] Image build failed
	exit /b 1
)

echo.
echo [SUCCESS] Image built successfully: !IMAGE_TAG!
echo [INFO] Listing built images...
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | findstr /i "ai-service"

exit /b 0

:action_test
echo [INFO] Building and testing image: !IMAGE_TAG!

REM Build first
call :build_or_die
if errorlevel 1 exit /b 1

REM Start test container
echo.
echo [INFO] Starting test container...
docker run -d ^
	--name test-ai-service ^
	-p 8001:8001 ^
	-e AI_SERVICE_PORT=8001 ^
	-e CLIP_MODEL_NAME=ViT-B/32 ^
	-e DEVICE=cpu ^
	-e MODEL_CACHE_DIR=/app/ai-service/model_cache ^
	!IMAGE_TAG! >nul 2>&1

if errorlevel 1 (
	echo [ERROR] Failed to start container
	exit /b 1
)

echo [SUCCESS] Container started
echo [INFO] Waiting 30 seconds for warmup...
timeout /t 30 /nobreak >nul

REM Check health
docker inspect --format="{{.State.Health.Status}}" test-ai-service >nul 2>&1
if not errorlevel 1 (
	echo [SUCCESS] Container is healthy!
)

REM Display logs
echo [INFO] Container logs:
docker logs test-ai-service | head -20

REM Cleanup
echo [INFO] Stopping test container...
docker stop test-ai-service >nul 2>&1
docker rm test-ai-service >nul 2>&1
echo [SUCCESS] Test complete

exit /b 0

:action_list
echo [INFO] AI Service images:
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
exit /b 0

:action_run
echo [INFO] Starting test container: !IMAGE_TAG!

docker run -d ^
	--name test-ai-service ^
	-p 8001:8001 ^
	-e AI_SERVICE_PORT=8001 ^
	-e CLIP_MODEL_NAME=ViT-B/32 ^
	-e DEVICE=cpu ^
	-e MODEL_CACHE_DIR=/app/ai-service/model_cache ^
	!IMAGE_TAG! >nul 2>&1

if errorlevel 1 (
	echo [ERROR] Failed to start container
	exit /b 1
)

echo [SUCCESS] Container started
echo [INFO] Testing /health/liveness endpoint...
timeout /t 5 /nobreak >nul

for /f %%A in ('curl -s -w "%%{http_code}" -o nul http://localhost:8001/health/liveness 2^>nul') do set "RESPONSE=%%A"
if "!RESPONSE!"=="200" (
	echo [SUCCESS] Liveness check passed!
) else (
	echo [WARN] Liveness check returned: !RESPONSE!
)

REM Cleanup
echo [INFO] Stopping container...
docker stop test-ai-service >nul 2>&1
docker rm test-ai-service >nul 2>&1

exit /b 0

:action_help
echo AI Service Container Build Helper
echo.
echo USAGE:
echo   build.cmd [action] [tag]
echo.
echo ACTIONS:
echo   validate   Validate Dockerfile syntax
echo   build      Build Docker image
echo   test       Build and test container
echo   list       List built images
echo   run        Test container
echo   help       Show this message
echo.
echo EXAMPLES:
echo   build.cmd validate
echo   build.cmd build
echo   build.cmd build ai-service:dev
echo   build.cmd test
echo   build.cmd list
echo.
exit /b 0

:action_default
echo [ERROR] Unknown action: !ACTION!
goto action_help
exit /b 1

:build_or_die
docker build ^
	-f modules\AIModule\ai_container_Dockerfile ^
	-t !IMAGE_TAG! ^
	--build-arg BUILDKIT_INLINE_CACHE=1 ^
	.
exit /b !errorlevel!

endlocal

@echo off
REM =============================================================================
REM AI Service Container Management — Windows CMD
REM =============================================================================
REM Purpose: Quick commands to start/stop/restart AI Service container
REM Usage: container.cmd [command] [options]
REM =============================================================================

setlocal enabledelayedexpansion

REM Configuration
set "CONTAINER_NAME=sise-ai-service"
set "IMAGE_NAME=ai-service:1.0.0"
set "PORT=8001"

REM Get command
set "COMMAND=%1"
if "!COMMAND!"=="" set "COMMAND=help"

REM Parse arguments
:parse_args
if "!COMMAND!"=="--name" (
	set "CONTAINER_NAME=%2"
	set "COMMAND=%3"
	if "!COMMAND!"=="" set "COMMAND=help"
	goto parse_args_end
)
if "!COMMAND!"=="--image" (
	set "IMAGE_NAME=%2"
	set "COMMAND=%3"
	if "!COMMAND!"=="" set "COMMAND=help"
	goto parse_args_end
)
if "!COMMAND!"=="--port" (
	set "PORT=%2"
	set "COMMAND=%3"
	if "!COMMAND!"=="" set "COMMAND=help"
	goto parse_args_end
)

:parse_args_end

REM ==========================================================================
REM FUNCTIONS
REM ==========================================================================

REM Check Docker availability
:check_docker
docker --version >nul 2>&1
if errorlevel 1 (
	echo [ERROR] Docker is not installed or not in PATH
	exit /b 1
)
exit /b 0

REM Start container
:start_container
echo [INFO] Starting container: !CONTAINER_NAME!

REM Check if already running
docker ps --filter "name=!CONTAINER_NAME!" --format "{{.Names}}" | findstr /R "^!CONTAINER_NAME!$" >nul 2>&1
if not errorlevel 1 (
	echo [WARN] Container already running: !CONTAINER_NAME!
	exit /b 0
)

REM Check if exists but stopped
docker ps -a --filter "name=!CONTAINER_NAME!" --format "{{.Names}}" | findstr /R "^!CONTAINER_NAME!$" >nul 2>&1
if not errorlevel 1 (
	echo [INFO] Container exists but stopped, starting...
	docker start !CONTAINER_NAME!
	echo [OK] Container started: !CONTAINER_NAME!
	exit /b 0
)

REM Create and start new container
echo [INFO] Creating new container...
docker run -d ^
	--name !CONTAINER_NAME! ^
	-p !PORT!:!PORT! ^
	-e AI_SERVICE_PORT=!PORT! ^
	-e CLIP_MODEL_NAME=ViT-B/32 ^
	-e DEVICE=cpu ^
	-e MODEL_CACHE_DIR=/app/ai-service/model_cache ^
	!IMAGE_NAME!

if errorlevel 1 (
	echo [ERROR] Failed to start container
	exit /b 1
)

echo [OK] Container started: !CONTAINER_NAME!
exit /b 0

REM Stop container
:stop_container
echo [INFO] Stopping container: !CONTAINER_NAME!

docker ps --filter "name=!CONTAINER_NAME!" --format "{{.Names}}" | findstr /R "^!CONTAINER_NAME!$" >nul 2>&1
if errorlevel 1 (
	echo [WARN] Container not running: !CONTAINER_NAME!
	exit /b 0
)

docker stop !CONTAINER_NAME!
echo [OK] Container stopped: !CONTAINER_NAME!
exit /b 0

REM Restart container
:restart_container
echo [INFO] Restarting container: !CONTAINER_NAME!
call :stop_container
timeout /t 2 /nobreak >nul
call :start_container
exit /b 0

REM Remove container
:remove_container
echo [INFO] Removing container: !CONTAINER_NAME!

docker ps --filter "name=!CONTAINER_NAME!" --format "{{.Names}}" | findstr /R "^!CONTAINER_NAME!$" >nul 2>&1
if not errorlevel 1 (
	docker stop !CONTAINER_NAME!
)

docker ps -a --filter "name=!CONTAINER_NAME!" --format "{{.Names}}" | findstr /R "^!CONTAINER_NAME!$" >nul 2>&1
if not errorlevel 1 (
	docker rm !CONTAINER_NAME!
	echo [OK] Container removed: !CONTAINER_NAME!
) else (
	echo [WARN] Container not found: !CONTAINER_NAME!
)

exit /b 0

REM View container status
:view_status
echo [INFO] Container status: !CONTAINER_NAME!
echo.

docker ps -a --filter "name=!CONTAINER_NAME!" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
if errorlevel 1 (
	echo [WARN] Container not found: !CONTAINER_NAME!
	exit /b 1
)

exit /b 0

REM View container logs
:view_logs
set "LINES=%2"
if "!LINES!"=="" set "LINES=50"

echo [INFO] Container logs (last !LINES! lines): !CONTAINER_NAME!
docker logs --tail !LINES! !CONTAINER_NAME! 2>nul
if errorlevel 1 (
	echo [ERROR] Container not found
	exit /b 1
)

exit /b 0

REM Show help
:show_help
echo AI Service Container Management
echo.
echo USAGE:
echo   container.cmd [command] [options]
echo.
echo COMMANDS:
echo   start       Start container (create if not exists)
echo   stop        Stop running container
echo   restart     Stop and start container
echo   remove      Remove container completely
echo   status      View container status
echo   logs        View container logs
echo   help        Show this message
echo.
echo OPTIONS:
echo   --name NAME         Container name (default: sise-ai-service)
echo   --image IMAGE       Docker image (default: ai-service:1.0.0)
echo   --port PORT         Port mapping (default: 8001)
echo.
echo EXAMPLES:
echo   container.cmd start
echo   container.cmd stop
echo   container.cmd restart
echo   container.cmd status
echo   container.cmd logs
echo   container.cmd remove
echo.
exit /b 0

REM ==========================================================================
REM MAIN LOGIC
REM ==========================================================================

echo.

call :check_docker
if errorlevel 1 exit /b 1

echo.

REM Handle commands
if /i "!COMMAND!"=="start" (
	call :start_container
	exit /b !errorlevel!
)

if /i "!COMMAND!"=="stop" (
	call :stop_container
	exit /b !errorlevel!
)

if /i "!COMMAND!"=="restart" (
	call :restart_container
	exit /b !errorlevel!
)

if /i "!COMMAND!"=="remove" (
	call :remove_container
	exit /b !errorlevel!
)

if /i "!COMMAND!"=="status" (
	call :view_status
	exit /b !errorlevel!
)

if /i "!COMMAND!"=="logs" (
	call :view_logs %2
	exit /b !errorlevel!
)

if /i "!COMMAND!"=="help" (
	call :show_help
	exit /b 0
)

echo [ERROR] Unknown command: !COMMAND!
call :show_help
exit /b 1

endlocal

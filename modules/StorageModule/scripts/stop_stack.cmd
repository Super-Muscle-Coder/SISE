@echo off
REM =====================================================================
REM StorageModule Docker Stack Shutdown Script
REM Usage: stop_stack.cmd [--remove-volumes] [--remove-images]
REM =====================================================================

setlocal enabledelayedexpansion
cd /d "%~dp0.."

echo.
echo =====================================================================
echo Stopping StorageModule Docker Stack
echo =====================================================================
echo.

set REMOVE_VOLUMES=0
set REMOVE_IMAGES=0

REM Parse command line arguments
if "%1"=="--remove-volumes" set REMOVE_VOLUMES=1
if "%2"=="--remove-volumes" set REMOVE_VOLUMES=1
if "%1"=="--remove-images" set REMOVE_IMAGES=1
if "%2"=="--remove-images" set REMOVE_IMAGES=1

echo [INFO] Stopping containers...
docker compose -f infra_compose_storage.yml down

if %REMOVE_VOLUMES%==1 (
	echo [INFO] Removing volumes...
	docker compose -f infra_compose_storage.yml down --volumes
)

if %REMOVE_IMAGES%==1 (
	echo [INFO] Removing images...
	docker compose -f infra_compose_storage.yml down --rmi all
)

echo [OK] Docker stack stopped successfully
echo.

if %REMOVE_VOLUMES%==1 echo [WARN] All volumes have been removed (data lost)
if %REMOVE_IMAGES%==1 echo [WARN] All images have been removed

endlocal

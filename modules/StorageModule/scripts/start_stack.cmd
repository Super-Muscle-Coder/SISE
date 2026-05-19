@echo off
REM =====================================================================
REM StorageModule Docker Stack Startup Script
REM Usage: start_stack.cmd
REM =====================================================================

setlocal enabledelayedexpansion
cd /d "%~dp0.."

echo.
echo =====================================================================
echo Starting StorageModule Docker Stack
echo =====================================================================
echo.

echo [INFO] Loading environment variables from configs/storage.env.local...
if not exist "configs\storage.env.local" (
	echo [ERROR] configs/storage.env.local not found. Please create it first.
	exit /b 1
)

echo [INFO] Pulling latest images...
docker compose -f infra_compose_storage.yml pull
if errorlevel 1 (
	echo [ERROR] Failed to pull Docker images
	exit /b 1
)

echo [INFO] Starting Docker Compose stack...
docker compose -f infra_compose_storage.yml up -d --remove-orphans
if errorlevel 1 (
	echo [ERROR] Failed to start Docker stack
	exit /b 1
)

echo [OK] Docker stack started successfully
echo.
echo [INFO] Waiting 10 seconds for services to initialize...
timeout /t 10 /nobreak

echo.
echo =====================================================================
echo Service Status
echo =====================================================================
docker compose -f infra_compose_storage.yml ps

echo.
echo =====================================================================
echo Connection Endpoints
echo =====================================================================
echo.
echo PostgreSQL:   localhost:5432
echo   - User: sise
echo   - Password: sise_password
echo   - Database: sise
echo.
echo MinIO S3 API:   localhost:9000
echo   - Access Key: minioadmin
echo   - Secret Key: minioadmin
echo.
echo MinIO Web Console:   http://localhost:9001
echo   - Credentials: minioadmin / minioadmin
echo.
echo Milvus Vector DB:   localhost:19530
echo.
echo Redis Cache:   localhost:6379
echo.
echo etcd:   localhost:2379
echo.

endlocal

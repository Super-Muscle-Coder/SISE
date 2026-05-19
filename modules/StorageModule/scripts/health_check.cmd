@echo off
REM =====================================================================
REM StorageModule Health Check Script
REM Usage: health_check.cmd
REM =====================================================================

setlocal enabledelayedexpansion
cd /d "%~dp0.."

echo.
echo =====================================================================
echo StorageModule Health Check
echo =====================================================================
echo.

REM Check Docker Compose status
echo [INFO] Checking Docker Compose status...
docker compose -f infra_compose_storage.yml ps
echo.

REM Check individual services
echo [INFO] Checking service connectivity...
echo.

REM PostgreSQL
echo [Check] PostgreSQL (port 5432)...
docker exec sise-postgres pg_isready -U sise -d sise >nul 2>&1
if %errorlevel%==0 (
	echo   [OK] PostgreSQL is healthy
) else (
	echo   [FAIL] PostgreSQL is not responding
)

REM Redis
echo [Check] Redis (port 6379)...
docker exec sise-redis redis-cli ping >nul 2>&1
if %errorlevel%==0 (
	echo   [OK] Redis is healthy
) else (
	echo   [FAIL] Redis is not responding
)

REM etcd
echo [Check] etcd (port 2379)...
docker exec sise-etcd etcdctl endpoint health >nul 2>&1
if %errorlevel%==0 (
	echo   [OK] etcd is healthy
) else (
	echo   [FAIL] etcd is not responding
)

REM MinIO
echo [Check] MinIO (port 9000)...
docker exec sise-minio mc ready local >nul 2>&1
if %errorlevel%==0 (
	echo   [OK] MinIO is healthy
) else (
	echo   [FAIL] MinIO is not responding
)

REM Milvus
echo [Check] Milvus (port 19530)...
docker exec sise-milvus curl -s -f http://localhost:9091/healthz >nul 2>&1
if %errorlevel%==0 (
	echo   [OK] Milvus is healthy
) else (
	echo   [FAIL] Milvus is not responding
)

echo.
echo =====================================================================
echo Health Check Complete
echo =====================================================================
echo.

endlocal

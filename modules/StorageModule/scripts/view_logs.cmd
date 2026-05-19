@echo off
REM =====================================================================
REM StorageModule View Logs Script
REM Usage: view_logs.cmd [service_name]
REM          service_name can be: postgres, redis, etcd, minio, milvus
REM =====================================================================

setlocal enabledelayedexpansion
cd /d "%~dp0.."

if "%1"=="" (
	echo.
	echo =====================================================================
	echo Showing logs for all services (last 50 lines)
	echo =====================================================================
	echo.
	docker compose -f infra_compose_storage.yml logs --tail=50
) else (
	echo.
	echo =====================================================================
	echo Showing logs for %1 (last 100 lines)
	echo =====================================================================
	echo.
	docker compose -f infra_compose_storage.yml logs --tail=100 %1
)

endlocal

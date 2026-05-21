@echo off
REM ==========================================================================
REM AI Service Test Endpoints — Windows Batch Script
REM ==========================================================================
REM Purpose: Test AI Service endpoints (embed image, embed text, batch embed)
REM Requirements: curl installed and in PATH
REM Usage: scripts\ai-service\test-endpoints.bat [OPTIONS]
REM ==========================================================================

setlocal enabledelayedexpansion
cd /d "%~dp0"

REM Configuration
set HOST=localhost
set PORT=8001
set SAMPLE_IMAGE=sample.jpg
set SAMPLE_TEXT=a cat on the table

REM Color codes (using echo with special characters)
set BLUE=[36m
set GREEN=[32m
set YELLOW=[33m
set RED=[31m
set NC=[0m

REM Helper functions
:log_info
echo [INFO] %~1
exit /b 0

:log_success
echo [SUCCESS] %~1
exit /b 0

:log_error
echo [ERROR] %~1
exit /b 1

REM Parse arguments
:parse_args
if "%~1"=="" goto parse_done
if "%~1"=="--host" (
	set HOST=%~2
	shift
	shift
	goto parse_args
)
if "%~1"=="--port" (
	set PORT=%~2
	shift
	shift
	goto parse_args
)
if "%~1"=="--help" (
	call :show_help
	exit /b 0
)
shift
goto parse_args

:parse_done

echo.
echo Testing AI Service Endpoints
echo Host: %HOST%
echo Port: %PORT%
echo.

REM Test liveness
echo [TEST 1] GET /health/liveness
curl -s http://%HOST%:%PORT%/health/liveness
if !ERRORLEVEL! equ 0 (
	echo [OK] Liveness check passed
) else (
	echo [FAIL] Liveness check failed
	exit /b 1
)

echo.
echo [TEST 2] GET /health/readiness
curl -s http://%HOST%:%PORT%/health/readiness
if !ERRORLEVEL! equ 0 (
	echo [OK] Readiness check passed
) else (
	echo [WARN] Readiness check not yet passing (may be warming up)
)

echo.
echo [TEST 3] POST /inference/embed/text
curl -X POST http://%HOST%:%PORT%/inference/embed/text ^
  -H "Content-Type: application/json" ^
  -d "{\"text\":\"%SAMPLE_TEXT%\"}" ^
  -s | findstr /C:"vector" >nul
if !ERRORLEVEL! equ 0 (
	echo [OK] Text embedding passed
) else (
	echo [FAIL] Text embedding failed
)

echo.
echo [NOTE] Image embedding test requires actual image file
echo   Usage: curl -X POST http://%HOST%:%PORT%/inference/embed/image ^
  -F "file=@image.jpg" ^
  -F "content_type=image/jpeg"

echo.
echo All basic tests completed
exit /b 0

:show_help
echo AI Service Endpoint Tests
echo.
echo USAGE:
echo   scripts\ai-service\test-endpoints.bat [OPTIONS]
echo.
echo OPTIONS:
echo   --host HOST     Service host (default: localhost)
echo   --port PORT     Service port (default: 8001)
echo   --help          Show this message
echo.
echo EXAMPLES:
echo   scripts\ai-service\test-endpoints.bat
echo   scripts\ai-service\test-endpoints.bat --host 192.168.1.100 --port 8001
echo.
exit /b 0

@echo off
REM =============================================================================
REM AI Service Health Check — Windows CMD
REM =============================================================================
REM Purpose: Monitor health of AI Service container
REM Usage: health-check.cmd [options]
REM =============================================================================

setlocal enabledelayedexpansion

REM Configuration
set "HOST=localhost"
set "PORT=8001"
set "TIMEOUT=10"
set "RETRIES=3"
set "CHECK_MODE=both"

REM Parse arguments
:parse_args
if "!CHECK_MODE!"=="both" (
	if "%1"=="" goto parse_args_done
	if /i "%1"=="--host" (
		set "HOST=%2"
		shift & shift
		goto parse_args
	)
	if /i "%1"=="--port" (
		set "PORT=%2"
		shift & shift
		goto parse_args
	)
	if /i "%1"=="--timeout" (
		set "TIMEOUT=%2"
		shift & shift
		goto parse_args
	)
	if /i "%1"=="--retries" (
		set "RETRIES=%2"
		shift & shift
		goto parse_args
	)
	if /i "%1"=="--liveness" (
		set "CHECK_MODE=liveness"
		shift
		goto parse_args
	)
	if /i "%1"=="--readiness" (
		set "CHECK_MODE=readiness"
		shift
		goto parse_args
	)
	if /i "%1"=="--help" (
		goto show_help
	)
)

:parse_args_done

REM ==========================================================================
REM FUNCTIONS
REM ==========================================================================

REM Check liveness
:check_liveness
echo [INFO] Checking /health/liveness...

for /f %%A in ('curl -s -w "%%{http_code}" -o nul http://!HOST!:!PORT!/health/liveness 2^>nul') do set "RESPONSE=%%A"
if "!RESPONSE!"=="" set "RESPONSE=000"

if "!RESPONSE!"=="200" (
	echo [OK] Liveness probe passed (HTTP 200)
	exit /b 0
) else (
	echo [ERROR] Liveness probe failed (HTTP !RESPONSE!)
	exit /b 1
)

REM Check readiness
:check_readiness
echo [INFO] Checking /health/readiness...

for /f %%A in ('curl -s -w "%%{http_code}" -o nul http://!HOST!:!PORT!/health/readiness 2^>nul') do set "RESPONSE=%%A"
if "!RESPONSE!"=="" set "RESPONSE=000"

if "!RESPONSE!"=="200" (
	echo [OK] Readiness probe passed (HTTP 200)
	exit /b 0
) else (
	echo [WARN] Readiness probe not yet passing (HTTP !RESPONSE!)
	exit /b 1
)

REM Retry with backoff
:retry_with_backoff
set "ATTEMPT=1"
set "DELAY=2"

:retry_loop
if !ATTEMPT! GTR !RETRIES! (
	exit /b 1
)

echo [INFO] Attempt !ATTEMPT!/!RETRIES!...

call :check_readiness
if errorlevel 0 exit /b 0

if !ATTEMPT! LSS !RETRIES! (
	echo [WARN] Retrying in !DELAY!s...
	timeout /t !DELAY! /nobreak >nul
	set /a "DELAY=!DELAY! * 2"
)

set /a "ATTEMPT=!ATTEMPT! + 1"
goto retry_loop

REM Show help
:show_help
echo AI Service Health Check
echo.
echo USAGE:
echo   health-check.cmd [options]
echo.
echo OPTIONS:
echo   --host HOST         Service host (default: localhost)
echo   --port PORT         Service port (default: 8001)
echo   --timeout SECONDS   Curl timeout (default: 10)
echo   --retries COUNT     Number of retries (default: 3)
echo   --liveness          Check only liveness (quick)
echo   --readiness         Check only readiness (detailed, with retries)
echo   --help              Show this message
echo.
echo EXAMPLES:
echo   health-check.cmd --liveness
echo   health-check.cmd --readiness
echo   health-check.cmd --host localhost --port 8001
echo.
exit /b 0

REM ==========================================================================
REM MAIN LOGIC
REM ==========================================================================

echo.
echo [INFO] AI Service Health Check
echo [INFO] Target: http://!HOST!:!PORT!
echo.

if /i "!CHECK_MODE!"=="liveness" (
	call :check_liveness
	exit /b !errorlevel!
)

if /i "!CHECK_MODE!"=="readiness" (
	call :retry_with_backoff
	exit /b !errorlevel!
)

if /i "!CHECK_MODE!"=="both" (
	call :check_liveness
	if errorlevel 1 exit /b 1
	echo.
	call :retry_with_backoff
	exit /b !errorlevel!
)

exit /b 1

endlocal

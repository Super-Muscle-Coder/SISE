#!/usr/bin/env pwsh
<#
.SYNOPSIS
	Complete StorageModule workflow testing and validation

.DESCRIPTION
	This script provides step-by-step guidance for testing StorageModule workflows:
	1. Verify Python environment
	2. Check storage services
	3. Run isolated workflow tests
	4. Validate end-to-end execution

.EXAMPLE
	.\run_storage_tests.ps1
#>

$ErrorActionPreference = "Continue"

# Colors for output
$colors = @{
	Success = "Green"
	Warning = "Yellow"
	Error = "Red"
	Info = "Cyan"
	Step = "Magenta"
}

function Write-Step {
	param([string]$Message, [int]$StepNumber)
	Write-Host ""
	Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $colors.Step
	Write-Host "STEP $StepNumber - $Message" -ForegroundColor $colors.Step
	Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $colors.Step
	Write-Host ""
}

function Write-Result {
	param([string]$Message, [string]$Status)
	$symbol = if ($Status -eq "success") { "✓" } else { "✗" }
	$color = if ($Status -eq "success") { $colors.Success } else { $colors.Error }
	Write-Host "$symbol $Message" -ForegroundColor $color
}

function Test-DockerCompose {
	$result = docker-compose --version 2>&1
	if ($LASTEXITCODE -eq 0) {
		Write-Result "Docker Compose is installed" "success"
		Write-Host "  $result" -ForegroundColor $colors.Info
		return $true
	} else {
		Write-Result "Docker Compose is NOT installed or not in PATH" "error"
		Write-Host "  Please install Docker Desktop or Docker Engine" -ForegroundColor $colors.Warning
		return $false
	}
}

function Test-Services {
	Write-Host ""
	Write-Host "Checking running services:" -ForegroundColor $colors.Info

	$services = @{
		"PostgreSQL (5432)" = "localhost:5432"
		"MinIO API (9000)" = "localhost:9000"
		"MinIO Console (9001)" = "localhost:9001"
		"Milvus (19530)" = "localhost:19530"
		"etcd (2379)" = "localhost:2379"
		"Redis (6379)" = "localhost:6379"
	}

	$allRunning = $true
	foreach ($name in $services.Keys) {
		$port = $services[$name].Split(":")[1]
		$test = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
		if ($test.TcpTestSucceeded) {
			Write-Result "$name is running" "success"
		} else {
			Write-Result "$name is NOT running" "error"
			$allRunning = $false
		}
	}

	return $allRunning
}

function Run-WorkflowTest {
	param([string]$WorkflowName, [string]$TestScript)

	Write-Host ""
	Write-Host "Running: $TestScript" -ForegroundColor $colors.Info
	Write-Host "Command: py -3.13 $TestScript" -ForegroundColor $colors.Info
	Write-Host ""

	$startTime = Get-Date

	& py -3.13 $TestScript

	$endTime = Get-Date
	$duration = ($endTime - $startTime).TotalSeconds

	Write-Host ""
	if ($LASTEXITCODE -eq 0) {
		Write-Result "$WorkflowName workflow test PASSED" "success"
	} else {
		Write-Result "$WorkflowName workflow test FAILED (exit code: $LASTEXITCODE)" "error"
	}
	Write-Host "Duration: $duration seconds" -ForegroundColor $colors.Info
}

# ============================================================================
# Main execution
# ============================================================================

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor $colors.Step
Write-Host "║     StorageModule Workflow Testing & Validation Suite         ║" -ForegroundColor $colors.Step
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor $colors.Step

# Step 1: Verify Python 3.13
Write-Step "Verify Python 3.13 Environment" 1

$pythonVersion = py -3.13 --version 2>&1
if ($LASTEXITCODE -eq 0) {
	Write-Result "Python 3.13 is available" "success"
	Write-Host "  $pythonVersion" -ForegroundColor $colors.Info
} else {
	Write-Result "Python 3.13 is NOT available" "error"
	Write-Host "  Please install Python 3.13" -ForegroundColor $colors.Warning
	exit 1
}

# Step 2: Verify Docker & Docker Compose
Write-Step "Verify Docker Compose Installation" 2

if (-not (Test-DockerCompose)) {
	Write-Host ""
	Write-Host "⚠️  Docker Compose is required to run storage services" -ForegroundColor $colors.Warning
	Write-Host "   Proceeding with structural validation only..." -ForegroundColor $colors.Warning
}

# Step 3: Check Storage Services Status
Write-Step "Check Storage Services Status" 3

$servicesReady = Test-Services

if (-not $servicesReady) {
	Write-Host ""
	Write-Host "⚠️  NOT ALL SERVICES ARE RUNNING" -ForegroundColor $colors.Warning
	Write-Host ""
	Write-Host "To start services, run:" -ForegroundColor $colors.Info
	Write-Host "  .\modules\StorageModule\start_storage_stack.ps1 -Action up" -ForegroundColor $colors.Info
	Write-Host ""
	Write-Host "Then wait 10-30 seconds for all services to be healthy." -ForegroundColor $colors.Info
	Write-Host ""
	$response = Read-Host "Continue with structural tests only? (y/n)"
	if ($response -ne "y") {
		exit 1
	}
}

# Step 4: Run Workflow Tests
Write-Step "Run Isolated Workflow Tests" 4

$testsDir = "modules\StorageModule\tests"
$workflows = @(
	@{ Name = "Schema"; Script = "test_schema_workflow.py" },
	@{ Name = "Collection"; Script = "test_collection_workflow.py" },
	@{ Name = "Bucket"; Script = "test_bucket_workflow.py" },
	@{ Name = "Seed"; Script = "test_seed_workflow.py" }
)

$results = @()

foreach ($workflow in $workflows) {
	$testPath = Join-Path $testsDir $workflow.Script
	if (Test-Path $testPath) {
		Run-WorkflowTest $workflow.Name $testPath
		$results += @{
			Name = $workflow.Name
			Status = if ($LASTEXITCODE -eq 0) { "PASS" } else { "FAIL" }
		}
	} else {
		Write-Result "Test file not found: $testPath" "error"
		$results += @{ Name = $workflow.Name; Status = "SKIP" }
	}
}

# Step 5: Summary Report
Write-Step "Test Summary Report" 5

Write-Host "Workflow Test Results:" -ForegroundColor $colors.Info
Write-Host ""

$passCount = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
$skipCount = ($results | Where-Object { $_.Status -eq "SKIP" }).Count

foreach ($result in $results) {
	$color = switch ($result.Status) {
		"PASS" { $colors.Success }
		"FAIL" { $colors.Error }
		"SKIP" { $colors.Warning }
	}
	$symbol = switch ($result.Status) {
		"PASS" { "✓" }
		"FAIL" { "✗" }
		"SKIP" { "⊘" }
	}
	Write-Host "$symbol [$($result.Status)] $($result.Name) Workflow" -ForegroundColor $color
}

Write-Host ""
Write-Host "Summary:" -ForegroundColor $colors.Info
Write-Host "  ✓ Passed: $passCount" -ForegroundColor $colors.Success
Write-Host "  ✗ Failed: $failCount" -ForegroundColor $colors.Error
Write-Host "  ⊘ Skipped: $skipCount" -ForegroundColor $colors.Warning

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor $colors.Step

if ($failCount -gt 0) {
	Write-Host ""
	Write-Host "❌ Some tests failed. Please review the output above for details." -ForegroundColor $colors.Error
} else {
	Write-Host ""
	Write-Host "✅ All available tests completed successfully!" -ForegroundColor $colors.Success
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor $colors.Info
if (-not $servicesReady) {
	Write-Host "  1. Start storage services: .\modules\StorageModule\start_storage_stack.ps1 -Action up" -ForegroundColor $colors.Info
	Write-Host "  2. Wait for services to be healthy (30-60 seconds)" -ForegroundColor $colors.Info
	Write-Host "  3. Run this script again: .\run_storage_tests.ps1" -ForegroundColor $colors.Info
} else {
	Write-Host "  1. Review any failing workflow tests" -ForegroundColor $colors.Info
	Write-Host "  2. Check .knowledge/agent02/Skill_02.md for known issues and resolutions" -ForegroundColor $colors.Info
	Write-Host "  3. Document new issues in .knowledge/agent02/Log_02.md" -ForegroundColor $colors.Info
}

Write-Host ""

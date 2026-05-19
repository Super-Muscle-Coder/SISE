# StorageModule Docker Stack Management Script
# Usage: ./scripts/start_storage_stack.ps1

param(
	[string]$Env = "local",
	[switch]$Rebuild = $false,
	[switch]$Verbose = $false
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Status {
	param([string]$Message, [string]$Color = "White")
	$Timestamp = (Get-Date).ToString('HH:mm:ss')
	Write-Host "[$Timestamp] $Message"
}

function Get-ModuleRoot {
	return (Split-Path -Parent $PSScriptRoot)
}

function Get-EnvFile {
	param([string]$Env)
	$Module = Get-ModuleRoot
	$EnvFile = Join-Path $Module ".env.$Env"
	if (-not (Test-Path $EnvFile)) {
		Write-Status "[WARN] .env.$Env not found, using .env.example"
		$EnvFile = Join-Path $Module ".env.example"
	}
	return $EnvFile
}

# Main Script
function Start-StorageStack {
	Write-Host ""
	Write-Host "========================================================================"
	Write-Host "Starting StorageModule Docker Stack"
	Write-Host "========================================================================"
	Write-Host ""

	$Module = Get-ModuleRoot
	$ComposeFile = Join-Path $Module "infra_compose_storage.yml"
	$EnvFile = Get-EnvFile $Env

	if (-not (Test-Path $ComposeFile)) {
		Write-Status "[ERROR] infra_compose_storage.yml not found at $ComposeFile"
		exit 1
	}

	Write-Status "[INFO] Module root: $Module"
	Write-Status "[INFO] Compose file: $ComposeFile"
	Write-Status "[INFO] Env file: $EnvFile"

	# Load env file
	Write-Status "[INFO] Loading environment variables..."
	if (Test-Path $EnvFile) {
		Get-Content $EnvFile | Where-Object { $_ -and -not $_.StartsWith('#') } | ForEach-Object {
			$Name, $Value = $_ -split '=', 2
			[System.Environment]::SetEnvironmentVariable($Name.Trim(), $Value.Trim(), 'Process')
		}
		Write-Status "[OK] Environment variables loaded"
	}

	# Check Docker
	Write-Status "[INFO] Checking Docker installation..."
	try {
		$DockerVersion = docker --version
		Write-Status "[OK] Docker found: $DockerVersion"
	}
	catch {
		Write-Status "[ERROR] Docker not found or not in PATH"
		exit 1
	}

	# Stop existing containers if Rebuild flag is set
	if ($Rebuild) {
		Write-Status "[INFO] Stopping and removing existing containers..."
		docker compose -f $ComposeFile --env-file $EnvFile down 2>&1 | Out-Null
		Start-Sleep -Seconds 2
	}

	# Start stack
	Write-Status "[INFO] Starting Docker Compose stack..."
	docker compose -f $ComposeFile --env-file $EnvFile up -d

	if ($LASTEXITCODE -eq 0) {
		Write-Status "[OK] Docker stack started successfully"
	}
	else {
		Write-Status "[ERROR] Failed to start Docker stack"
		exit 1
	}

	# Wait for services to be ready
	Write-Status "[INFO] Waiting for services to become healthy (30 seconds)..."
	Start-Sleep -Seconds 5

	# Check service health
	Write-Host ""
	Write-Host "========================================================================"
	Write-Host "Service Health Status"
	Write-Host "========================================================================"

	$Services = @('sise-postgres', 'sise-etcd', 'sise-minio', 'sise-milvus', 'sise-redis')
	$HealthyServices = 0

	foreach ($Service in $Services) {
		$Status = docker ps --filter "name=$Service" --format "{{.Status}}"
		if ($Status -match "healthy|running") {
			Write-Status "[OK] $Service : $Status"
			$HealthyServices++
		}
		else {
			Write-Status "[WARN] $Service : $Status"
		}
	}

	Write-Status "[INFO] Healthy services: $HealthyServices/5"

	# Display connection info
	Write-Host ""
	Write-Host "========================================================================"
	Write-Host "Connection Information"
	Write-Host "========================================================================"
	Write-Status "PostgreSQL  : localhost:5432  (User: sise, Pass: sise_password)"
	Write-Status "MinIO S3    : localhost:9000  (User: minioadmin, Pass: minioadmin)"
	Write-Status "MinIO Web   : http://localhost:9001"
	Write-Status "Milvus      : localhost:19530"
	Write-Status "Redis       : localhost:6379"
	Write-Status "etcd        : localhost:2379"

	Write-Host ""
	Write-Host "========================================================================"
	Write-Host "Storage Stack Ready!"
	Write-Host "========================================================================"
	Write-Status "[NEXT] Run: pwsh .\scripts\check_storage_health.ps1"
	Write-Status "[NEXT] Then: pwsh .\scripts\run_storage_tests.ps1"
	Write-Host ""
}

# Execute
Start-StorageStack

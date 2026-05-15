#!/usr/bin/env pwsh
<#
.SYNOPSIS
	Start the StorageModule infrastructure stack (PostgreSQL, MinIO, Milvus, Redis, etcd)

.DESCRIPTION
	This script brings up all storage services required for StorageModule testing and execution.
	It uses Docker Compose to orchestrate the services.

.PARAMETER Action
	Action to perform: 'up', 'down', 'status', or 'logs'

.EXAMPLE
	.\start_storage_stack.ps1 -Action up
	.\start_storage_stack.ps1 -Action down
	.\start_storage_stack.ps1 -Action logs
#>

param(
	[ValidateSet('up', 'down', 'status', 'logs')]
	[string]$Action = 'up'
)

$scriptPath = $PSScriptRoot
$composePath = Join-Path $scriptPath "infra_compose_storage.yml"
$envFile = Join-Path $scriptPath "configs" "storage.env.local"

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "StorageModule Infrastructure Stack Manager" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# Verify compose file exists
if (-not (Test-Path $composePath)) {
	Write-Host "❌ Error: Docker Compose file not found at $composePath" -ForegroundColor Red
	exit 1
}

Write-Host "📁 Script Directory: $scriptPath" -ForegroundColor Green
Write-Host "📋 Compose File: $composePath" -ForegroundColor Green
Write-Host "⚙️  Config File: $envFile" -ForegroundColor Green
Write-Host ""

# Load environment if exists
if (Test-Path $envFile) {
	Write-Host "✓ Loading environment from $envFile" -ForegroundColor Green
	# Source the .env file (PowerShell style)
	Get-Content $envFile | ForEach-Object {
		if ($_ -match '^\s*([^#=]+)=(.*)$') {
			$key = $matches[1].Trim()
			$value = $matches[2].Trim()
			[System.Environment]::SetEnvironmentVariable($key, $value)
		}
	}
} else {
	Write-Host "⚠️  Warning: Config file not found at $envFile" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Executing: docker-compose -f $composePath $Action" -ForegroundColor Cyan
Write-Host ""

# Execute docker-compose command
switch ($Action) {
	'up' {
		Write-Host "🚀 Starting storage services..." -ForegroundColor Cyan
		docker-compose -f $composePath up -d

		Write-Host ""
		Write-Host "⏳ Waiting for services to be healthy..." -ForegroundColor Yellow
		Start-Sleep -Seconds 5

		Write-Host ""
		Write-Host "Checking service status:" -ForegroundColor Cyan
		docker-compose -f $composePath ps

		Write-Host ""
		Write-Host "✅ Storage services started!" -ForegroundColor Green
		Write-Host ""
		Write-Host "Available services:" -ForegroundColor Green
		Write-Host "  📦 PostgreSQL: postgresql://sise:sise_password@localhost:5432/sise" -ForegroundColor Cyan
		Write-Host "  🪣  MinIO (API): http://minioadmin:minioadmin@localhost:9000" -ForegroundColor Cyan
		Write-Host "  🪣  MinIO (Console): http://localhost:9001" -ForegroundColor Cyan
		Write-Host "  🔍 Milvus: localhost:19530" -ForegroundColor Cyan
		Write-Host "  📝 etcd: localhost:2379" -ForegroundColor Cyan
		Write-Host "  💾 Redis: redis://localhost:6379" -ForegroundColor Cyan
		Write-Host ""
	}

	'down' {
		Write-Host "🛑 Stopping storage services..." -ForegroundColor Yellow
		docker-compose -f $composePath down
		Write-Host "✅ Storage services stopped!" -ForegroundColor Green
	}

	'status' {
		Write-Host "📊 Service Status:" -ForegroundColor Cyan
		docker-compose -f $composePath ps
	}

	'logs' {
		Write-Host "📜 Service Logs:" -ForegroundColor Cyan
		docker-compose -f $composePath logs -f
	}
}

Write-Host ""

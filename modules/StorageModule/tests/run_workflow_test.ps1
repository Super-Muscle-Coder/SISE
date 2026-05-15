# Load environment variables from storage.env.local
$envFile = "modules/StorageModule/configs/storage.env.local"
if (Test-Path $envFile) {
	Get-Content $envFile | ForEach-Object {
		$line = $_.Trim()
		# Skip empty lines and comments
		if ($line -and -not $line.StartsWith("#")) {
			$parts = $line -split "=", 2
			if ($parts.Length -eq 2) {
				$key = $parts[0].Trim()
				$value = $parts[1].Trim()
				if ($value) {
					Set-Item -Path "env:$key" -Value $value
				}
			}
		}
	}
	Write-Host "✓ Environment variables loaded from $envFile"
} else {
	Write-Host "✗ File not found: $envFile"
	exit 1
}

# Set default values for empty env vars
if (-not $env:DATABASE_URL) {
	$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/sise"
	Write-Host "  DATABASE_URL set to default: $env:DATABASE_URL"
}
if (-not $env:MINIO_ENDPOINT) {
	$env:MINIO_ENDPOINT = "localhost:9000"
	Write-Host "  MINIO_ENDPOINT set to default: $env:MINIO_ENDPOINT"
}
if (-not $env:MINIO_ACCESS_KEY) {
	$env:MINIO_ACCESS_KEY = "minioadmin"
	Write-Host "  MINIO_ACCESS_KEY set to default"
}
if (-not $env:MINIO_SECRET_KEY) {
	$env:MINIO_SECRET_KEY = "minioadmin"
	Write-Host "  MINIO_SECRET_KEY set to default"
}
if (-not $env:MILVUS_HOST) {
	$env:MILVUS_HOST = "localhost"
	Write-Host "  MILVUS_HOST set to default: $env:MILVUS_HOST"
}
if (-not $env:MILVUS_PORT) {
	$env:MILVUS_PORT = "19530"
	Write-Host "  MILVUS_PORT set to default: $env:MILVUS_PORT"
}
if (-not $env:REDIS_URL) {
	$env:REDIS_URL = "redis://localhost:6379"
	Write-Host "  REDIS_URL set to default: $env:REDIS_URL"
}

Write-Host ""
Write-Host "=== Testing StorageModule Workflows with Python 3.13 ===" -ForegroundColor Cyan
Write-Host ""

# Test schema workflow
Write-Host "1. Testing SCHEMA workflow..." -ForegroundColor Yellow
py -3.13 .\modules\StorageModule\storage_main.py schema
Write-Host "   Result: $LASTEXITCODE" -ForegroundColor Green
Write-Host ""

# Test collection workflow
Write-Host "2. Testing COLLECTION workflow..." -ForegroundColor Yellow
py -3.13 .\modules\StorageModule\storage_main.py collection
Write-Host "   Result: $LASTEXITCODE" -ForegroundColor Green
Write-Host ""

# Test bucket workflow
Write-Host "3. Testing BUCKET workflow..." -ForegroundColor Yellow
py -3.13 .\modules\StorageModule\storage_main.py bucket
Write-Host "   Result: $LASTEXITCODE" -ForegroundColor Green
Write-Host ""

# Test seed workflow
Write-Host "4. Testing SEED workflow..." -ForegroundColor Yellow
py -3.13 .\modules\StorageModule\storage_main.py seed
Write-Host "   Result: $LASTEXITCODE" -ForegroundColor Green
Write-Host ""

Write-Host "=== Workflow Testing Complete ===" -ForegroundColor Cyan

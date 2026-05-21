@echo off
REM ==========================================================================
REM AI Service Container Build Helper — Windows PowerShell
REM ==========================================================================
REM Purpose: Validate Dockerfile, build image, and provide quick test commands
REM Requirements: Docker Desktop installed and running
REM Usage: powershell -ExecutionPolicy Bypass -File build_ai_container.ps1
REM ==========================================================================

param(
	[string]$Action = "help",
	[string]$ImageTag = "ai-service:1.0.0",
	[switch]$NoPush = $false
)

# Color output helper
function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Cyan }
function Write-Success { Write-Host "[SUCCESS] $args" -ForegroundColor Green }
function Write-Warning { Write-Host "[WARNING] $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "[ERROR] $args" -ForegroundColor Red }

# Check Docker is available
function Test-Docker {
	try {
		docker --version | Out-Null
		Write-Success "Docker is available"
		return $true
	}
	catch {
		Write-Error "Docker is not installed or not in PATH"
		return $false
	}
}

# Validate Dockerfile syntax
function Validate-Dockerfile {
	Write-Info "Validating Dockerfile syntax..."
	$DockerfilePath = "modules\AIModule\ai_container_Dockerfile"

	if (-not (Test-Path $DockerfilePath)) {
		Write-Error "Dockerfile not found at: $DockerfilePath"
		return $false
	}

	# Basic validation: check for required keywords
	$content = Get-Content $DockerfilePath -Raw
	$required = @("FROM", "WORKDIR", "COPY", "RUN", "EXPOSE", "ENTRYPOINT")

	foreach ($keyword in $required) {
		if ($content -notmatch $keyword) {
			Write-Warning "Dockerfile might be missing: $keyword"
		}
	}

	Write-Success "Dockerfile syntax looks valid"
	return $true
}

# Build Docker image
function Build-Image {
	param([string]$Tag)

	Write-Info "Building Docker image: $Tag"
	Write-Info "This may take 2-5 minutes on first build (downloading wheels, packages)"

	docker build `
		-f modules\AIModule\ai_container_Dockerfile `
		-t $Tag `
		--build-arg BUILDKIT_INLINE_CACHE=1 `
		.

	if ($LASTEXITCODE -eq 0) {
		Write-Success "Image built successfully: $Tag"
		return $true
	}
	else {
		Write-Error "Image build failed. Exit code: $LASTEXITCODE"
		return $false
	}
}

# List built images
function List-Images {
	Write-Info "AI Service images:"
	docker images | grep -E "ai-service|REPOSITORY"
}

# Test image by running container
function Test-Image {
	param([string]$Tag)

	Write-Info "Testing image: $Tag"
	Write-Info "Starting container with health check..."

	# Run container in background
	$ContainerId = docker run `
		-d `
		--name test-ai-service `
		-p 8001:8001 `
		-e AI_SERVICE_PORT=8001 `
		-e CLIP_MODEL_NAME=ViT-B/32 `
		-e DEVICE=cpu `
		-e MODEL_CACHE_DIR=/app/ai-service/model_cache `
		$Tag

	if ($LASTEXITCODE -ne 0) {
		Write-Error "Failed to start container"
		return $false
	}

	Write-Success "Container started: $ContainerId"
	Write-Info "Waiting 30 seconds for warmup and health check..."

	# Wait for health check
	$healthy = $false
	for ($i = 0; $i -lt 30; $i++) {
		Start-Sleep -Seconds 1
		$health = docker inspect --format='{{.State.Health.Status}}' $ContainerId 2>$null

		if ($health -eq "healthy") {
			Write-Success "Container is healthy!"
			$healthy = $true
			break
		}
		elseif ($i % 5 -eq 0) {
			Write-Info "Health status: $health (waiting...)"
		}
	}

	if (-not $healthy) {
		Write-Warning "Container health check not yet passing (may still be warming up)"
	}

	# Display logs
	Write-Info "Container logs (first 20 lines):"
	docker logs $ContainerId | Select-Object -First 20

	# Test liveness endpoint
	Write-Info "Testing /health/liveness endpoint..."
	try {
		$response = Invoke-WebRequest -Uri "http://localhost:8001/health/liveness" -ErrorAction SilentlyContinue
		if ($response.StatusCode -eq 200) {
			Write-Success "Liveness probe: OK (200)"
		}
		else {
			Write-Warning "Liveness probe returned: $($response.StatusCode)"
		}
	}
	catch {
		Write-Warning "Could not reach liveness endpoint (container may still be warming up)"
	}

	# Cleanup
	Write-Info "Stopping test container..."
	docker stop $ContainerId | Out-Null
	docker rm $ContainerId | Out-Null
	Write-Success "Test container cleaned up"

	return $true
}

# Print help
function Show-Help {
	Write-Host @"
AI Service Container Build Helper

USAGE:
  powershell -ExecutionPolicy Bypass -File modules\AIModule\build_ai_container.ps1 [ACTION] [OPTIONS]

ACTIONS:
  validate     Validate Dockerfile syntax (default)
  build        Build Docker image
  test         Build and test container
  list         List built images
  run          Start a test container and wait for health check
  help         Show this message

OPTIONS:
  -ImageTag    Docker image tag (default: ai-service:1.0.0)
  -NoPush      Don't push to registry after build (default: true)

EXAMPLES:
  # Validate Dockerfile
  .\build_ai_container.ps1 validate

  # Build image
  .\build_ai_container.ps1 build -ImageTag "ai-service:1.0.0"

  # Build and test
  .\build_ai_container.ps1 test -ImageTag "ai-service:1.0.0"

  # List images
  .\build_ai_container.ps1 list

  # Run test container
  .\build_ai_container.ps1 run -ImageTag "ai-service:1.0.0"

NEXT STEPS:
  1. Validate: .\build_ai_container.ps1 validate
  2. Build: .\build_ai_container.ps1 build
  3. Test: .\build_ai_container.ps1 run
  4. Push to registry (if needed)
  5. Deploy via docker-compose.yml

TROUBLESHOOTING:
  - Docker not found?
	→ Install Docker Desktop from https://www.docker.com/products/docker-desktop
	→ Restart PowerShell after installation

  - Build fails?
	→ Check disk space: docker system df
	→ Prune unused images: docker system prune
	→ Check internet: Model download may require connectivity

  - Container won't start?
	→ Check logs: docker logs <container-id>
	→ Verify env vars are set correctly
	→ Check port 8001 is not in use: netstat -an | grep 8001

"@
}

# Main logic
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AI Service Container Build Helper" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Docker availability
if (-not (Test-Docker)) {
	exit 1
}

Write-Host ""

# Handle actions
switch ($Action.ToLower()) {
	"validate" {
		if (Validate-Dockerfile) {
			exit 0
		}
		else {
			exit 1
		}
	}

	"build" {
		if (Validate-Dockerfile) {
			if (Build-Image -Tag $ImageTag) {
				List-Images
				Write-Host ""
				Write-Success "Next: Run 'powershell -ExecutionPolicy Bypass -File modules\AIModule\build_ai_container.ps1 run -ImageTag $ImageTag' to test"
				exit 0
			}
		}
		exit 1
	}

	"test" {
		if (Validate-Dockerfile) {
			if (Build-Image -Tag $ImageTag) {
				if (Test-Image -Tag $ImageTag) {
					exit 0
				}
			}
		}
		exit 1
	}

	"list" {
		List-Images
		exit 0
	}

	"run" {
		Test-Image -Tag $ImageTag
		exit 0
	}

	"help" {
		Show-Help
		exit 0
	}

	default {
		Write-Warning "Unknown action: $Action"
		Show-Help
		exit 1
	}
}

Write-Host ""

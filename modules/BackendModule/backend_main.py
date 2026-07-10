"""
Runtime entrypoint for BackendModule.
Responsible for environment loading, dependency wait checks, and launching uvicorn.
"""

from __future__ import annotations

import os
import socket
import subprocess
import time
from pathlib import Path
from urllib.parse import urlparse

import uvicorn
from dotenv import load_dotenv


def _load_environment() -> None:
    env_file = os.getenv("BACKEND_ENV_FILE", str(Path(__file__).parent / "configs" / "backend.env.local"))
    load_dotenv(env_file)


def _parse_host_port_from_url(raw_url: str, default_port: int) -> tuple[str, int]:
    parsed = urlparse(raw_url)
    if not parsed.hostname:
        raise ValueError(f"Invalid URL (missing hostname): {raw_url}")
    return parsed.hostname, parsed.port or default_port


def _parse_host_port_from_endpoint(raw_endpoint: str, default_port: int) -> tuple[str, int]:
    endpoint = raw_endpoint.strip()
    if not endpoint:
        raise ValueError("Endpoint is empty")
    if "://" not in endpoint:
        endpoint = f"tcp://{endpoint}"
    parsed = urlparse(endpoint)
    if not parsed.hostname:
        raise ValueError(f"Invalid endpoint (missing hostname): {raw_endpoint}")
    return parsed.hostname, parsed.port or default_port


def _wait_for_tcp(name: str, host: str, port: int, timeout_sec: int, retry_interval_sec: int) -> None:
    deadline = time.monotonic() + timeout_sec
    last_error: Exception | None = None

    while time.monotonic() < deadline:
        try:
            with socket.create_connection((host, port), timeout=3):
                print(f"[WAIT] {name} reachable at {host}:{port}")
                return
        except OSError as exc:
            last_error = exc
            print(f"[WAIT] {name} not ready at {host}:{port}: {exc}. Retrying in {retry_interval_sec}s...")
            time.sleep(retry_interval_sec)

    raise RuntimeError(
        f"[WAIT] Timeout after {timeout_sec}s: cannot connect to {name} at {host}:{port}. "
        f"Last error: {last_error}"
    )


def _wait_for_dependencies() -> None:
    timeout_sec = int(os.getenv("DEPENDENCY_WAIT_TIMEOUT_SEC", "30"))
    retry_interval_sec = int(os.getenv("DEPENDENCY_WAIT_INTERVAL_SEC", "2"))

    database_url = os.getenv("DATABASE_URL", "").strip()
    minio_endpoint = os.getenv("MINIO_ENDPOINT", "").strip()
    redis_url = os.getenv("REDIS_URL", "").strip()

    if not database_url:
        raise ValueError("DATABASE_URL is required for dependency wait check")
    if not minio_endpoint:
        raise ValueError("MINIO_ENDPOINT is required for dependency wait check")
    if not redis_url:
        raise ValueError("REDIS_URL is required for dependency wait check")

    postgres_host, postgres_port = _parse_host_port_from_url(database_url, 5432)
    minio_host, minio_port = _parse_host_port_from_endpoint(minio_endpoint, 9000)
    redis_host, redis_port = _parse_host_port_from_url(redis_url, 6379)

    _wait_for_tcp("postgres", postgres_host, postgres_port, timeout_sec, retry_interval_sec)
    _wait_for_tcp("minio", minio_host, minio_port, timeout_sec, retry_interval_sec)
    _wait_for_tcp("redis", redis_host, redis_port, timeout_sec, retry_interval_sec)


def _start_celery_worker() -> subprocess.Popen:
    concurrency = os.getenv("CELERY_WORKER_CONCURRENCY", "4")
    cmd = [
        "celery",
        "-A",
        "app.tasks.indexing_celery_tasks",
        "worker",
        "--loglevel=info",
        f"--concurrency={concurrency}",
    ]
    try:
        process = subprocess.Popen(cmd)
        print(f"[CELERY] Started worker with PID={process.pid}")
        return process
    except FileNotFoundError as exc:
        raise RuntimeError(
            "Celery CLI not found in PATH. Ensure 'celery' package is installed in the runtime image."
        ) from exc


def main() -> None:
    _load_environment()
    _wait_for_dependencies()

    celery_process = _start_celery_worker()

    host = os.getenv("BACKEND_HOST", "0.0.0.0")
    port = int(os.getenv("BACKEND_PORT", "8000"))
    debug = os.getenv("DEBUG", "False").lower() == "true"

    try:
        uvicorn.run(
            "app:app",
            host=host,
            port=port,
            reload=debug,
        )
    finally:
        celery_process.terminate()
        try:
            celery_process.wait(timeout=10)
            print("[CELERY] Worker terminated gracefully")
        except subprocess.TimeoutExpired:
            celery_process.kill()
            celery_process.wait()
            print("[CELERY] Worker killed after timeout")


if __name__ == "__main__":
    main()
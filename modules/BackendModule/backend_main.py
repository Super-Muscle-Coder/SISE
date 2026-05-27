"""
Backend Module Entry Point.
Provides the FastAPI application instance for production deployment.
"""

from app.main import app

__all__ = ["app"]

if __name__ == "__main__":
    import uvicorn
    import os

    # Load configuration from environment
    host = os.getenv("BACKEND_HOST", "0.0.0.0")
    port = int(os.getenv("BACKEND_PORT", "8000"))
    debug = os.getenv("DEBUG", "False").lower() == "true"

    # Run development server
    uvicorn.run(
        app,
        host=host,
        port=port,
        reload=debug,
    )

FROM python:3.13-slim

LABEL org.opencontainers.image.title="SISE BackendModule"
LABEL org.opencontainers.image.version="1.2.0"
LABEL org.opencontainers.image.description="Backend API Service for SISE (AG-03)"

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY backend_requirements.txt /app/backend_requirements.txt
RUN pip install --no-cache-dir -r /app/backend_requirements.txt

COPY app/ /app/app/
COPY backend_main.py /app/backend_main.py

ENTRYPOINT ["python", "backend_main.py"]
# 🚀 StorageModule Deployment Guide
## For Colleagues & Team Development

**Last Updated**: 2026-05-13  
**Version**: 1.0.0

---

## Quick Start (5 minutes)

### Prerequisites
- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v2.0+
- Git
- Python 3.13 (for workflow testing, optional initially)

### Step 1: Clone & Navigate
```bash
git clone https://github.com/Super-Muscle-Coder/SISE.git
cd SISE/modules/StorageModule
```

### Step 2: Setup Configuration
```bash
# Copy example environment
cp configs/storage.env.example configs/storage.env.local

# No edits needed for local dev (defaults work!)
# Edit if you need custom ports or credentials
```

### Step 3: Start Stack
```bash
# Windows (Batch script)
.\scripts\start_stack.cmd

# Linux/Mac
docker compose -f infra_compose_storage.yml up -d
```

### Step 4: Verify Health
```bash
# Windows
.\scripts\health_check.cmd

# Linux/Mac
docker ps -a --filter "name=sise-" --format "table {{.Names}}\t{{.Status}}"
```

**Expected Result**:
```
NAMES           STATUS
sise-postgres   Up N seconds (healthy)
sise-redis      Up N seconds (healthy)
sise-etcd       Up N seconds (healthy)
sise-minio      Up N seconds (healthy)
sise-milvus     Up N seconds (healthy)
```

✅ **Done!** Your storage stack is running.

---

## Service Endpoints

### Connection Strings for Applications

```
PostgreSQL:
  Host: localhost
  Port: 5432
  User: sise
  Password: sise_password
  Database: sise
  URL: postgresql://sise:sise_password@localhost:5432/sise

MinIO S3 API:
  Host: localhost
  Port: 9000
  Access Key: minioadmin
  Secret Key: minioadmin
  URL: http://localhost:9000

MinIO Web Console:
  URL: http://localhost:9001
  User: minioadmin
  Password: minioadmin

Milvus Vector DB:
  Host: localhost
  Port: 19530
  Connection: localhost:19530

Redis Cache:
  Host: localhost
  Port: 6379
  URL: redis://localhost:6379

etcd (Metadata):
  Host: localhost
  Port: 2379
```

### How to Use Endpoints

#### PostgreSQL (SQL)
```python
from sqlalchemy import create_engine
engine = create_engine("postgresql://sise:sise_password@localhost:5432/sise")
```

#### MinIO (S3-compatible)
```python
from minio import Minio
client = Minio(
	"localhost:9000",
	access_key="minioadmin",
	secret_key="minioadmin",
	secure=False
)
```

#### Milvus (Vector Search)
```python
from pymilvus import connections
connections.connect(
	alias="default",
	host="localhost",
	port=19530
)
```

#### Redis (Caching)
```python
import redis
r = redis.Redis(host='localhost', port=6379, decode_responses=True)
```

---

## Management Commands

### Windows (Batch Scripts)

#### Start Stack
```bash
.\scripts\start_stack.cmd
```
- Pulls latest images
- Starts all containers
- Waits for services to initialize
- Displays connection info

#### Stop Stack
```bash
.\scripts\stop_stack.cmd
```
Options:
```bash
.\scripts\stop_stack.cmd --remove-volumes        # Delete data
.\scripts\stop_stack.cmd --remove-images         # Delete images
.\scripts\stop_stack.cmd --remove-volumes --remove-images  # Full cleanup
```

#### Health Check
```bash
.\scripts\health_check.cmd
```
- Tests each service
- Shows status
- Diagnoses connection issues

#### View Logs
```bash
.\scripts\view_logs.cmd              # All services
.\scripts\view_logs.cmd postgres    # Specific service
```

### Linux/Mac (Manual Docker Commands)

#### Start
```bash
docker compose -f infra_compose_storage.yml up -d
```

#### Stop
```bash
docker compose -f infra_compose_storage.yml down
```

#### Stop & Delete Volumes
```bash
docker compose -f infra_compose_storage.yml down --volumes
```

#### View Logs
```bash
# All services
docker compose -f infra_compose_storage.yml logs --tail 50

# Specific service
docker compose -f infra_compose_storage.yml logs --tail 100 postgres
```

#### Container Status
```bash
docker ps -a --filter "name=sise-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

---

## Troubleshooting

### Issue: Port Already in Use

**Symptom**: `Error: bind: address already in use` or `Trying to connect to Docker daemon...`

**Solution**:
```bash
# Find what's using the port
# Windows:
netstat -ano | findstr :5432

# Linux/Mac:
lsof -i :5432

# Kill the process
# Windows:
taskkill /PID <PID> /F

# Linux/Mac:
kill -9 <PID>

# Then restart
.\scripts\start_stack.cmd
```

**Alternative**: Use different ports
```bash
# Edit infra_compose_storage.yml
# Change port mapping: "5432:5432" to "5433:5432"
# Then use localhost:5433 in connection strings
```

---

### Issue: Container Exits Immediately

**Symptom**: `Exited (code) N seconds ago`

**Check Logs**:
```bash
docker logs --tail 100 sise-milvus
```

**Common Causes**:
- **Milvus**: etcd not healthy yet (wait 30-60 sec)
- **PostgreSQL**: Disk space or permission issue
- **MinIO**: Port conflict

**Solution**:
```bash
# Restart the stack
.\scripts\stop_stack.cmd
Start-Sleep -Seconds 10
.\scripts\start_stack.cmd
```

---

### Issue: Milvus Shows "Unhealthy"

**Symptom**: `Status: Up 1 min (unhealthy)`

**Why**: Milvus needs 60-180 seconds to initialize all components.

**Solution**:
```bash
# Wait 2-3 minutes, then check again
Start-Sleep -Seconds 120
docker ps --filter "name=sise-milvus"

# If still unhealthy after 3+ min, check logs
docker logs --tail 50 sise-milvus
```

**Normal Log Message** (while initializing):
```
find no available datacoord, check datacoord state
```
This is expected! Don't panic.

---

### Issue: Cannot Connect from Python Code

**Symptom**: `Connection refused` or `timeout`

**Check**:
1. Container is running: `docker ps`
2. Port is accessible: `telnet localhost 5432`
3. Environment variables set: `echo $DATABASE_URL`
4. Connection string is correct

**Debug**:
```python
import socket

# Test port availability
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
result = sock.connect_ex(('localhost', 5432))
if result == 0:
	print("Port 5432 is open ✓")
else:
	print("Port 5432 is closed ✗")
sock.close()
```

---

### Issue: Data Persistence

**Question**: Will my data survive container restart?

**Answer**: ✅ **Yes** - All services use Docker volumes:
```
sise-postgres_data     (PostgreSQL data)
sise-etcd_data         (etcd snapshots)
sise-minio_data        (MinIO buckets)
sise-milvus_data       (Vector indexes)
sise-redis_data        (Redis persistence)
```

**However**: These volumes are LOCAL to your machine.

**To Backup**:
```bash
# Copy volume data
docker run --rm -v sise-postgres_data:/data -v $(pwd):/backup \
  ubuntu tar czf /backup/postgres_backup.tar.gz -C /data .

# Restore later
docker run --rm -v sise-postgres_data:/data -v $(pwd):/backup \
  ubuntu tar xzf /backup/postgres_backup.tar.gz -C /data
```

---

## Environment Configuration

### Custom Configuration

Edit `configs/storage.env.local`:

```bash
# Database (default works)
DATABASE_URL=postgresql://sise:sise_password@localhost:5432/sise

# Schema Workflow
SCHEMA_MIGRATION_TOOL=alembic
SCHEMA_TARGET_REVISION=head
SCHEMA_DOWNGRADE_REVISION=base

# Collection Workflow
COLLECTION_VECTOR_DIM=512
COLLECTION_METRIC_TYPE=COSINE
COLLECTION_INDEX_M=16
COLLECTION_INDEX_EF_CONSTRUCTION=200

# Bucket Workflow
BUCKET_RAW_IMAGES=raw-images
BUCKET_THUMBNAILS=thumbnails

# Seed Workflow (for testing)
SEED_USER_COUNT=10
SEED_IMAGE_COUNT=100
```

**Then restart**:
```bash
.\scripts\start_stack.cmd
```

---

## Testing Workflows

### Run Individual Workflow Tests

```bash
# Python 3.13 required
py -3.13 tests/test_schema_workflow.py
py -3.13 tests/test_collection_workflow.py
py -3.13 tests/test_bucket_workflow.py
py -3.13 tests/test_seed_workflow.py
```

### Expected Output
```
✓ Load environment variables
✓ All imports successful
✓ Entities created
✓ Adapters available
✓ Router initialized
✓ Storage operations (if DB running)
```

### If Tests Fail

1. **Check containers are healthy**: `.\scripts\health_check.cmd`
2. **Check logs**: `docker logs sise-postgres`
3. **Check Python version**: `py -3.13 --version`
4. **Check dependencies**: `py -3.13 -m pip list | findstr minio`

---

## Network Sharing (Colleagues on Same Network)

### Option 1: Access Local Stack from Another Machine

**Machine A** (Running StorageModule):
```bash
# Start stack (listens on all network interfaces by default)
.\scripts\start_stack.cmd

# Get your IP address
ipconfig | findstr "IPv4"
# Example: 192.168.1.100
```

**Machine B** (Colleague):
```bash
# Use Machine A's IP instead of localhost
DATABASE_URL=postgresql://sise:sise_password@192.168.1.100:5432/sise
```

**Considerations**:
- ✅ Simple setup
- ⚠️ Port 5432, 9000, 19530 must be open
- ⚠️ No authentication (MinIO, PostgreSQL)
- ⚠️ All changes visible to all users

---

### Option 2: Central Server (Recommended for Teams)

Setup one central machine:
```
Team Server (Linux):
├── Docker Compose running 24/7
├── All team connects to it
├── Central data store
└── Easy scaling
```

**Colleague Setup**:
```bash
# Point to server
DATABASE_URL=postgresql://sise:sise_password@team-server.local:5432/sise
MINIO_ENDPOINT=team-server.local:9000
MILVUS_HOST=team-server.local
```

**Benefits**:
- ✅ Single source of truth
- ✅ Shared data
- ✅ Better resource usage
- ✅ Easier backups

**Setup Guide**: See "Deployment to Server" below

---

## Deployment to Server (Linux)

### Prerequisites
- Linux server (Ubuntu 20.04+)
- Docker installed: `curl -fsSL https://get.docker.com | sh`
- Git installed: `sudo apt install git`
- 20GB disk space

### Step 1: Clone & Setup
```bash
sudo mkdir -p /opt/sise
cd /opt/sise
git clone https://github.com/Super-Muscle-Coder/SISE.git
cd SISE/modules/StorageModule

# Copy env (customize ports/credentials if needed)
cp configs/storage.env.example configs/storage.env.local
nano configs/storage.env.local
```

### Step 2: Start (Background)
```bash
docker compose -f infra_compose_storage.yml up -d

# Verify
docker ps
```

### Step 3: Firewall (if needed)
```bash
sudo ufw allow 5432/tcp
sudo ufw allow 9000/tcp
sudo ufw allow 19530/tcp
sudo ufw allow 6379/tcp
sudo ufw reload
```

### Step 4: Get Server IP
```bash
hostname -I
# Example: 192.168.1.100
```

### Step 5: Team Connects
```
DATABASE_URL=postgresql://sise:sise_password@192.168.1.100:5432/sise
MINIO_ENDPOINT=192.168.1.100:9000
MILVUS_HOST=192.168.1.100
```

---

## Monitoring & Maintenance

### Regular Health Checks
```bash
# Daily
.\scripts\health_check.cmd

# Watch logs
docker compose -f infra_compose_storage.yml logs -f
```

### Backup Strategy

**PostgreSQL**:
```bash
# Daily backup
pg_dump -U sise -d sise > backup_$(date +%Y%m%d).sql
```

**MinIO Buckets**:
```bash
# Mirror to external location
mc mirror --watch local/ s3/backup-bucket/
```

---

## Performance Tuning

### For Heavy Workloads

**Increase resources**:
```yaml
# Edit infra_compose_storage.yml
services:
  postgres:
	deploy:
	  resources:
		limits:
		  cpus: '2'
		  memory: 4G
```

**Milvus tuning**:
```env
# in storage.env.local
COLLECTION_INDEX_EF_CONSTRUCTION=300  # Higher = better accuracy, slower
COLLECTION_SEARCH_EF=200             # Query-time parameter
```

---

## Security (Production Readiness)

⚠️ **Warning**: Default credentials in this setup are **NOT SECURE**.

### For Production:

1. **Change PostgreSQL Password**:
```bash
docker exec sise-postgres psql -U sise -d sise \
  -c "ALTER USER sise PASSWORD 'strong_password_here';"
```

2. **Change MinIO Credentials**:
```bash
# Remove and recreate container with custom values
docker compose down
# Edit infra_compose_storage.yml or storage.env.local
docker compose up -d
```

3. **Enable TLS** (MinIO):
```bash
# Place certificate in volume
docker cp cert.pem sise-minio:/etc/minio/certs/
```

4. **Setup Redis Authentication**:
```bash
# Add password to redis config
requirepass your_password
```

---

## Troubleshooting Advanced Issues

### Logs Show Errors

```bash
# Get full logs
docker compose -f infra_compose_storage.yml logs > debug.log

# Search for errors
docker logs sise-postgres 2>&1 | grep -i "error\|fatal"
```

### Database Corruption

```bash
# Nuke and restart
.\scripts\stop_stack.cmd --remove-volumes
.\scripts\start_stack.cmd
```

### Milvus Won't Recover

```bash
# etcd might be stuck
docker exec sise-etcd etcdctl endpoint health

# If stuck, full reset
.\scripts\stop_stack.cmd --remove-volumes --remove-images
.\scripts\start_stack.cmd
```

---

## FAQ

**Q: Can I run multiple instances?**  
A: Yes, use different ports in compose override:
```yaml
ports:
  - "5433:5432"  # Different host port
```

**Q: How do I access MinIO from outside?**  
A: Use endpoint IP:9000, enable CORS if needed

**Q: Can I use this for production?**  
A: Not yet. Add TLS, auth, backups, monitoring first

**Q: How much disk space do I need?**  
A: ~20GB for all services + data

**Q: What if Docker daemon crashes?**  
A: Containers auto-restart after docker restarts (unless removed)

---

## Getting Help

1. **Check health**: `.\scripts\health_check.cmd`
2. **Check logs**: `.\scripts\view_logs.cmd <service>`
3. **Verify connectivity**: Try connecting with `telnet localhost 5432`
4. **Read docs**: `.knowledge/agent02/Skill_02.md` (troubleshooting section)
5. **Ask team**: Refer to GitHub issues

---

## Next Steps

✅ Stack running?  
→ Run: `py -3.13 tests/test_schema_workflow.py`  
→ Check AG-02 knowledge base for workflow details

✅ Tests passing?  
→ Ready for development!  
→ Refer to individual workflow documentation

✅ Need to share with team?  
→ Follow "Network Sharing" or "Server Deployment" sections above

---

**Questions?** Check `.knowledge/agent02/` directory for detailed documentation.

**Last Updated**: 2026-05-13  
**Maintained By**: AG-02 StorageModuleAgent


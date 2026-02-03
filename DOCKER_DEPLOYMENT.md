# Spektr Docker Deployment Guide

Complete guide for deploying Spektr using Docker and Docker Compose.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Services](#services)
- [Deployment Options](#deployment-options)
- [Maintenance](#maintenance)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 2GB RAM minimum
- 10GB disk space minimum

```bash
# Check Docker version
docker --version
docker-compose --version
```

## Quick Start

### 1. Clone and Configure

```bash
cd /path/to/spektr

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 2. Set Environment Variables

**Minimum Required (`.env`):**

```bash
# Database
POSTGRES_PASSWORD=your_secure_password_here

# Change these for production!
POSTGRES_DB=spektr
POSTGRES_USER=spektr_user
```

### 3. Build and Start

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 4. Access Application

- **Frontend:** http://localhost (port 80)
- **Backend API:** http://localhost:8080
- **Database:** localhost:5432

### 5. Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v
```

## Configuration

### Environment Variables

**Full `.env` Configuration:**

```bash
# === Database Configuration ===
POSTGRES_DB=spektr
POSTGRES_USER=spektr_user
POSTGRES_PASSWORD=CHANGE_THIS_PASSWORD
POSTGRES_PORT=5432

# === Spring Boot Configuration ===
SPRING_PROFILES_ACTIVE=prod
HIBERNATE_DDL_AUTO=update

# DDL Auto Options:
#   - update: Auto-update schema (development/testing)
#   - validate: Only validate schema (production)
#   - create: Drop and recreate schema (⚠️ data loss)
#   - none: No schema management

# === Port Mappings ===
BACKEND_PORT=8080
FRONTEND_PORT=80

# To use different ports:
# BACKEND_PORT=3000
# FRONTEND_PORT=8000
```

### Security Recommendations

**Production Checklist:**

- [ ] Change `POSTGRES_PASSWORD` to a strong password (20+ chars)
- [ ] Set `HIBERNATE_DDL_AUTO=validate` for production
- [ ] Use firewall rules to restrict database port (5432)
- [ ] Enable HTTPS with reverse proxy (nginx/Caddy)
- [ ] Regular database backups
- [ ] Monitor logs for errors

## Services

### Service Architecture

```
┌─────────────┐
│   Frontend  │ :80 (nginx)
│   (React)   │
└──────┬──────┘
       │ API Proxy
       │ /api/* → backend:8080
       ▼
┌─────────────┐
│   Backend   │ :8080 (Spring Boot)
│   (Java)    │
└──────┬──────┘
       │ JDBC
       ▼
┌─────────────┐
│  Database   │ :5432 (PostgreSQL 15)
│ (Postgres)  │
└─────────────┘
```

### 1. Frontend Service

**Image:** Custom (built from `frontend/Dockerfile`)

**Features:**
- React 18 SPA
- Nginx web server
- Auto-proxies `/api/*` to backend
- Health check: `GET /health`

**Files:**
- `frontend/Dockerfile` - Multi-stage build
- `frontend/nginx.conf` - Nginx configuration

### 2. Backend Service

**Image:** Custom (built from `Dockerfile`)

**Features:**
- Spring Boot 3.2.0
- Java 17 JRE
- Pcap4J for RADIUS packet parsing (requires libpcap)
- Health check: `GET /`

**Files:**
- `Dockerfile` - Multi-stage Maven build
- `src/main/resources/application-prod.properties`

### 3. Database Service

**Image:** `postgres:15-alpine`

**Features:**
- PostgreSQL 15
- JSONB support for vendor data
- Persistent volume for data
- Health check: `pg_isready`

**Volume:** `postgres_data` (persistent)

## Deployment Options

### Option 1: Development

Quick setup for local development/testing:

```bash
# Use default settings
docker-compose up

# Hot reload backend (use local Maven)
# Only run database in Docker
docker-compose up database

# In another terminal
mvn spring-boot:run

# Frontend
cd frontend && npm start
```

### Option 2: Production

Secure production deployment:

```bash
# 1. Configure environment
nano .env
# Set POSTGRES_PASSWORD, HIBERNATE_DDL_AUTO=validate

# 2. Build with --no-cache for fresh build
docker-compose build --no-cache

# 3. Start in detached mode
docker-compose up -d

# 4. Check logs
docker-compose logs -f backend

# 5. Test
curl http://localhost/health
```

### Option 3: Custom Ports

Run on non-standard ports:

```bash
# Edit .env
FRONTEND_PORT=8000
BACKEND_PORT=3000
POSTGRES_PORT=5433

# Start
docker-compose up -d

# Access on http://localhost:8000
```

### Option 4: Behind Reverse Proxy

Use with nginx/Caddy reverse proxy:

**Example nginx config:**

```nginx
server {
    listen 80;
    server_name spektr.example.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Maintenance

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f database

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Database Backup

```bash
# Create backup
docker exec spektr-database pg_dump -U spektr_user spektr > backup_$(date +%Y%m%d).sql

# Restore backup
cat backup_20240203.sql | docker exec -i spektr-database psql -U spektr_user spektr
```

### Update Application

```bash
# 1. Pull latest code
git pull

# 2. Rebuild images
docker-compose build

# 3. Restart with new images
docker-compose up -d

# 4. Check status
docker-compose ps
```

### Database Migrations

```bash
# Check current schema
docker exec spektr-database psql -U spektr_user -d spektr -c "\dt"

# Run manual migration (if HIBERNATE_DDL_AUTO=none)
cat migration.sql | docker exec -i spektr-database psql -U spektr_user spektr
```

### Scale Services

```bash
# Run multiple backend instances (requires load balancer)
docker-compose up -d --scale backend=3

# Note: Database and frontend should not be scaled
```

### Resource Limits

Add to `docker-compose.yml` under each service:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## Troubleshooting

### Backend Fails to Start

**Symptom:** Backend exits immediately

```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. Database not ready
#    Solution: Wait 30s, backend will retry

# 2. Wrong credentials
#    Solution: Check .env POSTGRES_* variables match

# 3. Port conflict
#    Solution: Change BACKEND_PORT in .env
```

### Database Connection Refused

**Symptom:** `Connection refused: database:5432`

```bash
# Check database is running
docker-compose ps database

# Check database logs
docker-compose logs database

# Restart database
docker-compose restart database

# Verify network
docker network ls
docker network inspect spektr_spektr-network
```

### Frontend Can't Reach Backend

**Symptom:** API calls fail from browser

```bash
# 1. Check backend is running
curl http://localhost:8080/api/auth/me

# 2. Check nginx proxy config
docker exec spektr-frontend cat /etc/nginx/conf.d/default.conf

# 3. Check nginx logs
docker-compose logs frontend

# 4. Verify network connectivity
docker exec spektr-frontend ping backend
```

### PCAP Upload Fails (ARM Mac)

**Symptom:** `UnsatisfiedLinkError` for libpcap

**Cause:** Running on Apple Silicon without Rosetta

**Solution:**
```bash
# Force x86 platform
docker-compose build --build-arg PLATFORM=linux/amd64
docker-compose up -d

# Or use Rosetta 2 in Docker Desktop settings
```

### Out of Disk Space

```bash
# Clean up unused images
docker system prune -a

# Remove old volumes (⚠️ deletes data)
docker volume prune

# Check disk usage
docker system df
```

### Permission Denied

```bash
# Fix ownership (Linux)
sudo chown -R $USER:$USER .

# Or run with sudo
sudo docker-compose up -d
```

### Reset Everything

```bash
# Stop all containers
docker-compose down

# Remove volumes (⚠️ deletes database)
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Clean Docker system
docker system prune -a --volumes

# Start fresh
docker-compose up -d
```

## Performance Tuning

### Database Tuning

Add to `docker-compose.yml`:

```yaml
database:
  command: postgres -c shared_buffers=256MB -c max_connections=200
```

### Backend JVM Tuning

```yaml
backend:
  environment:
    JAVA_OPTS: "-Xmx1024m -Xms512m -XX:+UseG1GC"
```

### Frontend Caching

Already configured in `nginx.conf`:
- Static files: 1 year cache
- API responses: No cache
- Service worker: No cache

## Monitoring

### Health Checks

```bash
# Frontend
curl http://localhost/health

# Backend (requires network access)
curl http://localhost:8080/

# Database
docker exec spektr-database pg_isready -U spektr_user
```

### Docker Stats

```bash
# Real-time resource usage
docker stats

# Specific container
docker stats spektr-backend
```

### Container Inspection

```bash
# Inspect configuration
docker inspect spektr-backend

# Check environment variables
docker exec spektr-backend env | grep SPRING
```

## Advanced Configuration

### Custom Network

```yaml
networks:
  spektr-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16
```

### External Database

Use existing PostgreSQL:

```yaml
# Remove database service from docker-compose.yml

# Update backend environment
backend:
  environment:
    SPRING_DATASOURCE_URL: jdbc:postgresql://external-db:5432/spektr
```

### SSL/TLS Certificates

Mount certificates for HTTPS:

```yaml
frontend:
  volumes:
    - ./certs:/etc/nginx/certs:ro
```

Update `nginx.conf` for HTTPS.

## Production Checklist

- [ ] Strong database password set
- [ ] `HIBERNATE_DDL_AUTO=validate` in production
- [ ] Regular automated backups configured
- [ ] Monitoring/alerting setup
- [ ] Log aggregation (ELK, Loki, etc.)
- [ ] Firewall rules configured
- [ ] HTTPS with valid certificates
- [ ] Container restart policy: `unless-stopped`
- [ ] Resource limits defined
- [ ] Health checks working
- [ ] Tested disaster recovery process

## Support

For issues:
1. Check logs: `docker-compose logs -f`
2. Verify configuration: `docker-compose config`
3. Review this guide's troubleshooting section
4. Check application logs in `/var/log` if mounted

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Nginx Docker Image](https://hub.docker.com/_/nginx)

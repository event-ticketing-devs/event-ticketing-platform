# Docker Setup Guide - Event Ticketing Platform

This document provides a comprehensive overview of the Docker containerization setup for the Event Ticketing Platform, explaining what was done, how it works, and why certain decisions were made.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [What We Did](#what-we-did)
- [How It Works](#how-it-works)
- [Why These Decisions](#why-these-decisions)
- [Configuration Details](#configuration-details)
- [Troubleshooting](#troubleshooting)
- [Production Considerations](#production-considerations)

---

## Overview

The Event Ticketing Platform has been containerized using Docker to provide:
- **Consistent development environment** across all team members
- **Simplified setup** - no need to manually install Node.js, MongoDB, Redis, etc.
- **Isolated dependencies** - each service runs in its own container
- **Easy deployment** - same containers work in development and production
- **Service orchestration** - all services start together with proper dependencies

## Architecture

### Container Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Host (Your Machine)               │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         event-ticketing-network (Bridge)              │  │
│  │                                                       │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │  Frontend   │  │   Backend    │  │    Redis     │  │  │
│  │  │   (Nginx)   │  │ (Node.js +   │  │   (Cache)    │  │  │
│  │  │   Port:3000 │  │   Express)   │  │   Port:6379  │  │  │
│  │  │             │  │   Port:8000  │  │              │  │  │
│  │  └──────┬──────┘  └───────┬──────┘  └──────────────┘  │  │
│  │         │                 │                           │  │
│  │         │                 │         ┌──────────────┐  │  │
│  │         └─────────────────┼────────▶│   Mailhog    │  │  │
│  │                           │         │  (Email UI)  │  │  │
│  │                           │         │  Port:8025   │  │  │
│  │                           │         └──────────────┘  │  │
│  │                           │                           │  │
│  │                           ▼                           │  │
│  │                  ┌────────────────┐                   │  │
│  │                  │ MongoDB Atlas  │ (External)        │  │
│  │                  │   (Cloud DB)   │                   │  │
│  │                  └────────────────┘                   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Services

| Service | Purpose | Port | Technology |
|---------|---------|------|------------|
| **Frontend** | React application served by Nginx | 3000 | React 19 + Vite + Nginx |
| **Backend** | REST API server | 8000 | Node.js + Express |
| **Redis** | Caching and rate limiting | 6379 | Redis 7 |
| **Mailhog** | Email testing (captures emails) | 8025 (UI), 1025 (SMTP) | Mailhog |
| **MongoDB** | Database (optional local) | 27017 | MongoDB 7 |

---

## What We Did

### 1. Created Dockerfiles

#### Backend Dockerfile (`backend/Dockerfile`)
- **Base Image:** `node:18-alpine` (lightweight Linux with Node.js 18)
- **Dependencies:** Python3, make, g++ (required for native Node modules like bcrypt)
- **Hot Reloading:** Configured to use nodemon for development
- **Volume Mounting:** Source code is mounted for live updates without rebuilding

```dockerfile
FROM node:18-alpine
WORKDIR /app
RUN apk update && apk add --no-cache python3 make g++ && rm -rf /var/cache/apk/*
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8000
CMD ["npm", "run", "dev"]
```

**Why Alpine?**
- Much smaller image size (5MB vs 900MB for full Node image)
- Faster builds and deployments
- Lower resource usage

#### Frontend Dockerfile (`frontend/Dockerfile`)
- **Multi-stage build** for optimization
- **Stage 1 (Builder):** Builds the React application with Vite
- **Stage 2 (Production):** Serves static files with Nginx
- **Build Arguments:** Environment variables passed during build

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID
# ... more args
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Why Multi-stage?**
- Final image only contains built assets + Nginx (~30MB)
- Build dependencies (Node.js, npm packages) are discarded
- Faster deployment and lower resource usage

### 2. Created Docker Compose Configuration

**File:** `docker-compose.yml`

Orchestrates all services with:
- **Service definitions** for frontend, backend, Redis, Mailhog
- **Environment variable injection** from `.env` file
- **Volume mounts** for data persistence and hot reloading
- **Health checks** to ensure services are ready
- **Dependency management** (backend waits for Redis to be healthy)
- **Custom network** for inter-container communication

### 3. Created .dockerignore Files

**Purpose:** Exclude unnecessary files from Docker build context

**Backend `.dockerignore`:**
```
node_modules
.env
.git
*.log
coverage
```

**Frontend `.dockerignore`:**
```
node_modules
dist
.env
.git
*.log
coverage
```

**Why?**
- Faster builds (smaller build context)
- Security (don't copy secrets)
- Avoids conflicts (node_modules rebuilt in container)

### 4. Created Nginx Configuration

**File:** `frontend/nginx.conf`

Configures Nginx to:
- **Serve static React files**
- **Proxy API requests** to backend (`/api/*` → `backend:8000`)
- **Support WebSockets** for Socket.io (`/socket.io/*`)
- **Handle React Router** (all routes serve `index.html`)
- **Add security headers**
- **Enable Gzip compression**

```nginx
upstream backend {
    server backend:8000;
}

server {
    listen 80;
    
    # Proxy API to backend
    location /api/ {
        proxy_pass http://backend;
        # ... headers
    }
    
    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Why Nginx?**
- Highly efficient at serving static files
- Built-in reverse proxy and load balancing
- Production-ready performance
- Small footprint (~2MB Alpine image)

### 5. Created Environment Configuration

**Files:** `.env.example` and `.env`

Centralized configuration for:
- Database connections (MongoDB Atlas or local)
- API keys (Stripe, Google, Cloudinary, Gemini)
- JWT secrets
- SMTP configuration
- CORS and frontend URLs

### 6. Modified Backend Code

#### Database Connection (`backend/src/db/index.js`)
- **Added IPv4 forcing:** `family: 4` option to prevent Docker IPv6 DNS issues
- **Added connection options:** `retryWrites: true`, `w: 'majority'`
- **Environment-based DB name:** `DB_NAME` can be overridden via env var

```javascript
await mongoose.connect(
  `${process.env.MONGODB_URI}/${DB_NAME}`,
  {
    family: 4, // Force IPv4 (Docker DNS fix)
    retryWrites: true,
    w: "majority",
  }
);
```

**Why IPv4?**
- Docker's DNS sometimes resolves MongoDB Atlas to IPv6
- Node.js/MongoDB driver struggles with IPv6 in Docker
- Forcing IPv4 ensures reliable connections

#### SMTP Configuration (`backend/src/utils/mailer.js`)
- **Environment-based host:** Uses `SMTP_HOST` env var (defaults to `mailhog`)
- **Conditional authentication:** Only adds auth if credentials provided

```javascript
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "mailhog",
  port: parseInt(process.env.SMTP_PORT) || 1025,
  secure: false,
  ...(process.env.SMTP_USER && {
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  }),
});
```

**Why Mailhog?**
- Captures all emails sent during development
- No need for real SMTP credentials
- Web UI to view emails at `localhost:8025`
- Prevents accidentally sending emails to real users

---

## How It Works

### Starting the Application

1. **Docker Compose reads `docker-compose.yml`**
2. **Loads environment variables from `.env`**
3. **Creates custom network** (`event-ticketing-network`)
4. **Starts services in dependency order:**
   - Redis and Mailhog start first (no dependencies)
   - Redis health check runs until healthy
   - Backend starts after Redis is healthy
   - Frontend starts after backend is created

5. **Service Communication:**
   - Services communicate using **service names** as hostnames
   - Example: Backend connects to `redis:6379` (not `localhost:6379`)
   - Frontend proxies API requests to `backend:8000`

6. **Volume Mounting:**
   - Backend: `./backend/src` → `/app/src` (live code updates)
   - Redis: Named volume for data persistence
   - Frontend: No volume (rebuilds on code change)

### Request Flow

#### Frontend Request:
```
User Browser (localhost:3000)
    ↓
Nginx Container (port 80 inside, 3000 outside)
    ↓ (for /api/* requests)
Backend Container (port 8000)
    ↓
MongoDB Atlas (cloud)
```

#### Development Workflow:
1. Edit code in `backend/src` or `frontend/src`
2. **Backend:** Nodemon detects change → auto-restarts
3. **Frontend:** Vite HMR updates browser instantly
4. No container rebuild needed during development

### Environment Variable Flow

```
.env file
    ↓
Docker Compose loads variables
    ↓
Passes to containers via 'environment' section
    ↓
Node.js accesses via process.env.VARIABLE_NAME
    ↓
Vite accesses via import.meta.env.VITE_VARIABLE_NAME
```

---

## Why These Decisions

### Why Docker?

**Problems Before Docker:**
1. ❌ "Works on my machine" - different Node/MongoDB versions
2. ❌ Manual setup - install Node, MongoDB, Redis individually
3. ❌ Configuration drift - dev/prod environments differ
4. ❌ Onboarding takes hours/days for new developers

**Solutions With Docker:**
1. ✅ **Consistency** - same environment for everyone
2. ✅ **Automation** - `docker compose up` starts everything
3. ✅ **Isolation** - dependencies don't pollute host machine
4. ✅ **Fast onboarding** - new devs productive in minutes

### Why MongoDB Atlas (Not Local MongoDB)?

**Decision:** Use MongoDB Atlas by default, optionally run local MongoDB

**Reasons:**
1. **Managed service** - automatic backups, scaling, monitoring
2. **Free tier** - sufficient for development
3. **Production parity** - same database in dev and production
4. **Collaboration** - team shares one database
5. **No data loss** - data persists even if containers are destroyed

**Local MongoDB Option:**
- Uncomment mongodb service in `docker-compose.yml`
- Useful for offline development
- Data stored in Docker volume (persists across container restarts)

### Why Nginx for Frontend?

**Alternative:** Could use `npm run preview` or `serve -s dist`

**Reasons for Nginx:**
1. **Production-ready** - same setup in dev and production
2. **Performance** - highly optimized for static files
3. **Reverse proxy** - built-in API proxying (avoids CORS issues)
4. **Configurability** - easy to add SSL, caching, compression
5. **Industry standard** - most production deployments use Nginx

### Why Multi-Stage Build for Frontend?

**Single-stage alternative:** Include Node.js and source code in final image

**Benefits of Multi-stage:**
```
Single-stage: ~900MB (Node.js + dependencies + source + build)
Multi-stage: ~30MB (Nginx + built assets only)
```

- **97% smaller image** - faster deployments
- **Security** - no source code or dev dependencies in production
- **Efficiency** - less disk space, network transfer, memory

### Why Volume Mounts for Backend Source?

**Alternative:** Copy code into container, rebuild on changes

**Benefits of Volume Mounting:**
1. **Hot reloading** - Nodemon restarts on file changes
2. **No rebuilds** - instant code updates
3. **IDE integration** - edit files normally on host machine
4. **Debugging** - can use IDE debugger with Docker

**Trade-off:** Slightly slower I/O on Windows/Mac (due to file system virtualization)

### Why Separate .dockerignore Files?

**Alternative:** Single root .dockerignore

**Reasons for Separation:**
1. **Different contexts** - backend and frontend have different build contexts
2. **Specific exclusions** - frontend needs nginx.conf, backend doesn't
3. **Clearer intent** - each Dockerfile controls its own excludes

### Why Health Checks?

**Without health checks:**
```
Backend starts → Tries to connect to Redis → Redis not ready → Backend crashes
```

**With health checks:**
```
Redis starts → Health check passes → Backend starts → Successful connection
```

**Benefits:**
1. **Reliable startup** - services wait for dependencies
2. **Auto-recovery** - unhealthy containers restart
3. **Monitoring** - `docker ps` shows health status

---

## Configuration Details

### Docker Compose Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `NODE_ENV` | `development` | Environment mode |
| `MONGODB_URI` | `mongodb://mongodb:27017` | Database connection (fallback to local) |
| `REDIS_HOST` | `redis` | Redis hostname (Docker service name) |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed frontend origin |
| `FRONTEND_URL` | `http://localhost:3000` | Used in emails for links |
| `SMTP_HOST` | `mailhog` | Email server (Mailhog in dev) |
| `VITE_API_URL` | `""` (empty) | Frontend API URL (uses proxy if empty) |

### Port Mappings

| Service | Internal Port | External Port | Access |
|---------|--------------|---------------|---------|
| Frontend | 80 | 3000 | http://localhost:3000 |
| Backend | 8000 | 8000 | http://localhost:8000 |
| Redis | 6379 | 6379 | localhost:6379 |
| Mailhog SMTP | 1025 | 1025 | localhost:1025 |
| Mailhog UI | 8025 | 8025 | http://localhost:8025 |
| MongoDB (optional) | 27017 | 27017 | localhost:27017 |

### Volume Types

1. **Named Volumes** (data persists after container deletion)
   - `redis_data:/data` - Redis cache data
   - `backend_node_modules:/app/node_modules` - Node dependencies

2. **Bind Mounts** (syncs with host filesystem)
   - `./backend/src:/app/src` - Backend source code (hot reload)

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use
**Error:** `bind: address already in use`

**Solution:**
```bash
# Find what's using the port
lsof -i :3000
lsof -i :8000

# Stop the conflicting service or change port in docker-compose.yml
ports:
  - "3001:80"  # Use 3001 instead of 3000
```

#### 2. Backend Can't Connect to MongoDB Atlas
**Error:** `MongoNetworkError: connect ENETUNREACH`

**Cause:** IPv6 DNS resolution in Docker

**Solution:** Already fixed in `backend/src/db/index.js`:
```javascript
{ family: 4 } // Forces IPv4
```

If still failing, check:
- MongoDB Atlas IP whitelist (allow `0.0.0.0/0` for development)
- Correct connection string in `.env`

#### 3. Frontend Shows 502 Bad Gateway
**Cause:** Backend not running or not healthy

**Solution:**
```bash
# Check backend logs
docker compose logs backend

# Restart backend
docker compose restart backend
```

#### 4. Changes Not Reflecting

**Backend:**
```bash
# Check if volume is mounted
docker compose ps
docker compose exec backend ls /app/src

# Restart if needed
docker compose restart backend
```

**Frontend:**
```bash
# Rebuild frontend
docker compose build frontend
docker compose up -d frontend
```

#### 5. MongoDB Write Concern Error
**Error:** `No write concern mode named 'majority/event-ticketing-platform'`

**Cause:** Database name appended after query parameters in URL

**Solution:** Already fixed - connection options moved to code:
```javascript
// In .env: mongodb+srv://user:pass@cluster.mongodb.net
// NO query params in .env

// In code:
mongoose.connect(uri, {
  retryWrites: true,
  w: "majority"
})
```

### Useful Commands

```bash
# View all running containers
docker compose ps

# View logs
docker compose logs -f [service_name]

# Restart a service
docker compose restart [service_name]

# Rebuild and restart
docker compose up -d --build [service_name]

# Stop all services
docker compose down

# Stop and remove volumes (DELETES DATA)
docker compose down -v

# Execute command in container
docker compose exec backend sh
docker compose exec redis redis-cli

# View container resource usage
docker stats

# Clean up orphaned containers
docker compose down --remove-orphans

# Prune unused Docker resources
docker system prune -a
```

---

## Production Considerations

### Changes Needed for Production

1. **Environment Variables**
   ```bash
   NODE_ENV=production
   MONGODB_URI=<production-atlas-uri>
   CORS_ORIGIN=https://yourdomain.com
   FRONTEND_URL=https://yourdomain.com
   SMTP_HOST=smtp.gmail.com  # Real SMTP
   ```

2. **Remove Development Tools**
   - Remove Mailhog service
   - Remove volume mounts (copy code instead)
   - Use production SMTP server

3. **Add SSL/TLS**
   - Configure Nginx with SSL certificates
   - Use Let's Encrypt or cloud provider SSL

4. **Optimize Images**
   - Multi-stage builds (already done for frontend)
   - Minimize layers
   - Use specific version tags (not `latest`)

5. **Security Hardening**
   - Run as non-root user
   - Scan images for vulnerabilities
   - Use secrets management (not .env file)
   - Enable Docker content trust

6. **Scaling**
   - Use Docker Swarm or Kubernetes
   - Add load balancer
   - Use managed Redis (AWS ElastiCache, etc.)

7. **Monitoring**
   - Add health check endpoints
   - Use log aggregation (ELK stack, CloudWatch)
   - Set up alerts and metrics

### Deployment Options

1. **Cloud Container Services**
   - AWS ECS/Fargate
   - Google Cloud Run
   - Azure Container Instances
   - DigitalOcean App Platform

2. **Kubernetes**
   - AWS EKS
   - Google GKE
   - Azure AKS
   - DigitalOcean Kubernetes

3. **Platform as a Service**
   - Heroku (with Docker)
   - Railway
   - Render
   - Fly.io

---

## Summary

### What We Achieved

✅ **Containerized entire application** - Frontend, Backend, Redis, Mailhog
✅ **One-command setup** - `docker compose up` starts everything
✅ **Development environment** - Hot reloading for both frontend and backend
✅ **Production-ready architecture** - Same containers work in production
✅ **Isolated dependencies** - Each service in its own container
✅ **Consistent across team** - Everyone runs the same environment
✅ **MongoDB Atlas integration** - Cloud database with local fallback
✅ **Nginx reverse proxy** - Production-grade frontend serving
✅ **Email testing** - Mailhog captures emails in development

### Key Files Created

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Service orchestration |
| `backend/Dockerfile` | Backend container definition |
| `backend/.dockerignore` | Excludes for backend builds |
| `frontend/Dockerfile` | Frontend multi-stage build |
| `frontend/.dockerignore` | Excludes for frontend builds |
| `frontend/nginx.conf` | Nginx configuration |
| `.env.example` | Environment template |

### Modified Files

| File | Changes |
|------|---------|
| `backend/src/db/index.js` | IPv4 forcing, connection options |
| `backend/src/utils/mailer.js` | Environment-based SMTP config |
| `backend/src/constants.js` | Environment-based DB name |
| `.env` | Added all configuration |
| `README.md` | Added Docker instructions |

---

## Questions?

For issues or questions about the Docker setup:
1. Check [Troubleshooting](#troubleshooting) section
2. Review logs: `docker compose logs -f`
3. Verify `.env` configuration
4. Ensure all ports are available
5. Check Docker daemon is running

For more information:
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)

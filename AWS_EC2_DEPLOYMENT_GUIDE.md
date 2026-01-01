# Complete AWS EC2 Deployment Guide - Event Ticketing Platform

This guide provides step-by-step instructions to deploy your Dockerized MERN stack application on AWS EC2 Free Tier (t2.micro).

---

## Table of Contents

1. [Pre-Deployment Checklist](#1-pre-deployment-checklist)
2. [EC2 Instance Configuration](#2-ec2-instance-configuration)
3. [Server Setup Commands](#3-server-setup-commands)
4. [Application Deployment](#4-application-deployment)
5. [Networking & Access](#5-networking--access)
6. [MongoDB Atlas Connection](#6-mongodb-atlas-connection)
7. [Redis Configuration](#7-redis-configuration)
8. [Nginx Configuration](#8-nginx-configuration)
9. [Gmail SMTP Configuration](#9-gmail-smtp-configuration)
10. [Post-Deployment Verification](#10-post-deployment-verification)
11. [Production Optimizations](#11-production-optimizations)
12. [Troubleshooting Guide](#12-troubleshooting-guide)
13. [Domain Setup (Optional)](#13-domain-setup-optional)

---

## 1. Pre-Deployment Checklist

### Files to Modify Before Deploying

| File | Changes Needed |
|------|----------------|
| `docker-compose.yml` | Remove Mailhog, remove port exposure for backend, add production configs |
| `docker-compose.prod.yml` | **NEW FILE** - Production-specific Docker Compose |
| `frontend/nginx.conf` | Already configured correctly ✅ |
| `backend/Dockerfile.prod` | **NEW FILE** - Production Dockerfile without dev dependencies |
| `.env.production` | **NEW FILE** - Production environment variables |
| `frontend/src/features/organizer/components/TeamChat.jsx` | Fix socket URL |
| `frontend/src/features/venues/components/VenueEnquiryChat.jsx` | Fix socket URL |

### 1.1 Create Production Docker Compose File

Create a new file `docker-compose.prod.yml`:

```yaml
services:
  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: event-ticketing-redis
    restart: unless-stopped
    # DO NOT expose port externally in production - only accessible via Docker network
    volumes:
      - redis_data:/data
    networks:
      - event-ticketing-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    # Memory limit for t2.micro (1GB total RAM)
    deploy:
      resources:
        limits:
          memory: 128M
    command: redis-server --maxmemory 100mb --maxmemory-policy allkeys-lru

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: event-ticketing-backend
    restart: unless-stopped
    # DO NOT expose port externally - Nginx will proxy to it via Docker network
    expose:
      - "8000"
    environment:
      NODE_ENV: production
      PORT: 8000
      MONGODB_URI: ${MONGODB_URI}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-7d}
      CORS_ORIGIN: ${CORS_ORIGIN}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
      CLOUDINARY_CLOUD_NAME: ${CLOUDINARY_CLOUD_NAME}
      CLOUDINARY_API_KEY: ${CLOUDINARY_API_KEY}
      CLOUDINARY_API_SECRET: ${CLOUDINARY_API_SECRET}
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASS: ${SMTP_PASS}
      EMAIL_FROM: ${EMAIL_FROM}
      FRONTEND_URL: ${FRONTEND_URL}
    depends_on:
      redis:
        condition: service_healthy
    networks:
      - event-ticketing-network
    # Memory limit for t2.micro
    deploy:
      resources:
        limits:
          memory: 512M

  # Frontend (Nginx serving React build)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: ""
        VITE_SOCKET_URL: ""
        VITE_GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
        VITE_GOOGLE_MAPS_API_KEY: ${GOOGLE_MAPS_API_KEY}
        VITE_STRIPE_PUBLISHABLE_KEY: ${STRIPE_PUBLISHABLE_KEY}
        VITE_GEMINI_API_KEY: ${GEMINI_API_KEY}
    container_name: event-ticketing-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - event-ticketing-network
    # Memory limit for t2.micro
    deploy:
      resources:
        limits:
          memory: 64M

networks:
  event-ticketing-network:
    driver: bridge

volumes:
  redis_data:
    driver: local
```

### 1.2 Create Production Backend Dockerfile

Create `backend/Dockerfile.prod`:

```dockerfile
# Backend Dockerfile - Production
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies for native modules (bcrypt, etc.)
RUN apk update && apk add --no-cache python3 make g++ && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port
EXPOSE 8000

# Run as non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Start production server
CMD ["node", "-r", "dotenv/config", "--experimental-json-modules", "src/server.js"]
```

### 1.3 Update Frontend Socket.io Configuration

The Socket.io client currently defaults to `localhost:8000` which won't work in production. We need to fix this.

**File: `frontend/src/features/organizer/components/TeamChat.jsx`**

Find line ~59:
```javascript
const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000';
```

Change to:
```javascript
const socketUrl = import.meta.env.VITE_SOCKET_URL || '';
```

**File: `frontend/src/features/venues/components/VenueEnquiryChat.jsx`**

Find line ~40:
```javascript
const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:8000";
```

Change to:
```javascript
const socketUrl = import.meta.env.VITE_SOCKET_URL || "";
```

**Why?** Empty string means Socket.io will use the same origin as the page (http://YOUR_EC2_IP), and Nginx will proxy `/socket.io` requests to the backend.

### 1.4 Update Frontend Dockerfile for Socket URL

Update `frontend/Dockerfile` to include VITE_SOCKET_URL build arg:

```dockerfile
# Frontend Dockerfile - Multi-stage build

# Stage 1: Build the React application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables (Vite requires VITE_ prefix)
ARG VITE_API_URL
ARG VITE_SOCKET_URL
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_GOOGLE_MAPS_API_KEY
ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_GEMINI_API_KEY

# Set environment variables for build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY

# Build the application
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
```

### 1.5 Create Production Environment File Template

Create `.env.production.example`:

```dotenv
# ===========================================
# PRODUCTION Environment Variables
# ===========================================
# Copy this to .env on EC2 server and fill in your values
# REPLACE ALL PLACEHOLDER VALUES!
# ===========================================

# ----- General -----
NODE_ENV=production

# ----- MongoDB Atlas -----
# Get your connection string from MongoDB Atlas
# Format: mongodb+srv://<username>:<password>@<cluster>.mongodb.net
# IMPORTANT: Make sure to whitelist EC2 IP in Atlas Network Access
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net

# ----- Redis -----
# Uses Docker service name (do not change)
REDIS_HOST=redis
REDIS_PORT=6379

# ----- JWT Authentication -----
# Generate a strong secret: openssl rand -base64 64
JWT_SECRET=YOUR_SUPER_SECRET_JWT_KEY_MAKE_IT_LONG_AND_RANDOM
JWT_EXPIRES_IN=7d

# ----- CORS -----
# Set to your EC2 public IP or domain
# Examples:
#   http://YOUR_EC2_PUBLIC_IP (IP address)
#   http://yourdomain.com (custom domain)
#   https://yourdomain.com (with SSL)
CORS_ORIGIN=http://YOUR_EC2_PUBLIC_IP

# ----- Frontend URL -----
# Used for email links (password reset, verification, etc.)
# Same as CORS_ORIGIN
FRONTEND_URL=http://YOUR_EC2_PUBLIC_IP

# ----- Google OAuth -----
# Get from Google Cloud Console: https://console.cloud.google.com/
# IMPORTANT: Add your EC2 IP/domain to Authorized JavaScript origins
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com

# ----- Google Maps API -----
GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY

# ----- Stripe Payment -----
# Get from Stripe Dashboard: https://dashboard.stripe.com/
# Use LIVE keys for production!
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY

# ----- Cloudinary -----
# For image uploads: https://cloudinary.com/
CLOUDINARY_CLOUD_NAME=YOUR_CLOUD_NAME
CLOUDINARY_API_KEY=YOUR_CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET=YOUR_CLOUDINARY_API_SECRET

# ----- Gemini API -----
# For AI chatbot: https://ai.google.dev/
GEMINI_API_KEY=YOUR_GEMINI_API_KEY

# ----- Gmail SMTP -----
# For sending emails from Gmail
# IMPORTANT: Use App Password, not your regular password!
# See: https://support.google.com/accounts/answer/185833
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=YOUR_16_CHAR_APP_PASSWORD
EMAIL_FROM=your_gmail@gmail.com

# ----- Vite Frontend Variables -----
# Leave empty to use Nginx proxy (recommended)
VITE_API_URL=
VITE_SOCKET_URL=
```

### 1.6 Current Configuration Analysis

Your current setup is **well-configured** for Docker deployment:

✅ **Good:**
- `apiClient.js` uses relative URLs (`baseURL: "/api"`) - will work with Nginx proxy
- `nginx.conf` correctly proxies `/api/` and `/socket.io/` to backend
- Redis client uses `REDIS_HOST` environment variable
- MongoDB uses `family: 4` for IPv4 (prevents Docker DNS issues)
- Multi-stage Docker build for frontend

⚠️ **Needs Fixing:**
- Socket.io client defaults to `localhost:8000` - must be empty string
- No production Docker Compose file
- No production Dockerfile for backend

---

## 2. EC2 Instance Configuration

### 2.1 Create EC2 Instance

1. **Log into AWS Console:** https://console.aws.amazon.com/ec2

2. **Launch Instance:**
   - Click **"Launch Instance"**

3. **Configure Instance:**

   | Setting | Value |
   |---------|-------|
   | **Name** | `event-ticketing-platform` |
   | **AMI** | Ubuntu Server 24.04 LTS (HVM), SSD Volume Type (Free tier eligible) |
   | **Architecture** | 64-bit (x86) |
   | **Instance Type** | `t2.micro` (Free tier eligible - 1 vCPU, 1 GB RAM) |
   | **Key pair** | Create new or select existing (see below) |

4. **Create Key Pair (if needed):**
   - Click **"Create new key pair"**
   - Name: `event-ticketing-key`
   - Type: RSA
   - Format: `.pem` (for Mac/Linux) or `.ppk` (for Windows PuTTY)
   - Click **"Create key pair"**
   - **SAVE THE FILE!** You cannot download it again.

5. **Network Settings - Security Group:**
   
   Click **"Edit"** and configure:

   | Type | Protocol | Port Range | Source | Description |
   |------|----------|------------|--------|-------------|
   | SSH | TCP | 22 | My IP | SSH access (your IP only) |
   | HTTP | TCP | 80 | 0.0.0.0/0 | Web traffic (everyone) |
   | HTTPS | TCP | 443 | 0.0.0.0/0 | Secure web traffic |

   > **IMPORTANT:** Do NOT expose ports 8000, 5173, or 6379 externally. Nginx handles all external traffic on port 80.

6. **Storage:**
   - Change from 8 GB to **20 GB** (free tier allows up to 30 GB)
   - Volume type: `gp3` (better performance)

7. **Launch:**
   - Click **"Launch instance"**
   - Wait for instance to be "Running"

8. **Get Public IP:**
   - Go to **Instances**
   - Select your instance
   - Copy the **Public IPv4 address** (e.g., `54.123.45.67`)

### 2.2 Secure Your Key File (Mac/Linux)

```bash
# Move key to .ssh directory
mv ~/Downloads/event-ticketing-key.pem ~/.ssh/

# Set correct permissions (REQUIRED - SSH will refuse to use insecure key)
chmod 400 ~/.ssh/event-ticketing-key.pem
```

### 2.3 Verify You Can Connect

```bash
# Replace YOUR_EC2_PUBLIC_IP with your actual IP
ssh -i ~/.ssh/event-ticketing-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

**Expected output:**
```
Welcome to Ubuntu 24.04 LTS...
ubuntu@ip-xxx-xxx-xxx-xxx:~$
```

Type `exit` to disconnect for now.

---

## 3. Server Setup Commands

### 3.1 Connect to EC2

```bash
ssh -i ~/.ssh/event-ticketing-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

### 3.2 Update System Packages

```bash
# Update package list and upgrade existing packages
sudo apt update && sudo apt upgrade -y
```

### 3.3 Install Docker

```bash
# Install required packages
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update apt with new repository
sudo apt update

# Install Docker
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker and enable on boot
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (avoids needing sudo for docker commands)
sudo usermod -aG docker ${USER}

# Apply group changes (or log out and back in)
newgrp docker
```

### 3.4 Verify Docker Installation

```bash
# Check Docker version
docker --version
# Expected: Docker version 24.x.x or newer

# Check Docker Compose
docker compose version
# Expected: Docker Compose version v2.x.x

# Test Docker works
docker run hello-world
# Expected: "Hello from Docker!"
```

### 3.5 Install Git

```bash
sudo apt install -y git

# Verify
git --version
# Expected: git version 2.x.x
```

### 3.6 Configure Swap Space (Important for t2.micro!)

t2.micro only has 1GB RAM. Adding swap prevents out-of-memory crashes:

```bash
# Create 2GB swap file
sudo fallocate -l 2G /swapfile

# Set correct permissions
sudo chmod 600 /swapfile

# Set up swap area
sudo mkswap /swapfile

# Enable swap
sudo swapon /swapfile

# Make swap permanent (survives reboot)
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verify swap is active
free -h
# Expected: Swap: 2.0G (or similar)
```

### 3.7 Configure Firewall (UFW)

```bash
# Enable UFW
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Verify
sudo ufw status
# Expected: Shows SSH, 80, 443 allowed
```

---

## 4. Application Deployment

### 4.1 Clone Your Repository

```bash
# Navigate to home directory
cd ~

# Clone your repository (replace with your repo URL)
git clone https://github.com/event-ticketing-devs/event-ticketing-platform.git

# Enter project directory
cd event-ticketing-platform
```

**Alternative: Private Repository**

If your repo is private:

```bash
# Option 1: HTTPS with personal access token
git clone https://YOUR_GITHUB_USERNAME:YOUR_PERSONAL_ACCESS_TOKEN@github.com/event-ticketing-devs/event-ticketing-platform.git

# Option 2: SSH (need to set up SSH key on GitHub)
git clone git@github.com:event-ticketing-devs/event-ticketing-platform.git
```

### 4.2 Create Production Environment File

```bash
# Create .env file
nano .env
```

Paste the following and **REPLACE ALL PLACEHOLDER VALUES**:

```dotenv
# ===========================================
# PRODUCTION Environment Variables
# ===========================================

# ----- General -----
NODE_ENV=production

# ----- MongoDB Atlas -----
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net

# ----- Redis -----
REDIS_HOST=redis
REDIS_PORT=6379

# ----- JWT Authentication -----
JWT_SECRET=YOUR_SUPER_SECRET_JWT_KEY_MAKE_IT_LONG_AND_RANDOM
JWT_EXPIRES_IN=7d

# ----- CORS & Frontend -----
CORS_ORIGIN=http://YOUR_EC2_PUBLIC_IP
FRONTEND_URL=http://YOUR_EC2_PUBLIC_IP

# ----- Google OAuth -----
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com

# ----- Google Maps API -----
GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY

# ----- Stripe Payment -----
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY

# ----- Cloudinary -----
CLOUDINARY_CLOUD_NAME=YOUR_CLOUD_NAME
CLOUDINARY_API_KEY=YOUR_CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET=YOUR_CLOUDINARY_API_SECRET

# ----- Gemini API -----
GEMINI_API_KEY=YOUR_GEMINI_API_KEY

# ----- Gmail SMTP -----
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=YOUR_16_CHAR_APP_PASSWORD
EMAIL_FROM=your_gmail@gmail.com

# ----- Vite Variables (leave empty for Nginx proxy) -----
VITE_API_URL=
VITE_SOCKET_URL=
```

**Save:** `Ctrl+O`, `Enter`, `Ctrl+X`

### 4.3 Verify Files Exist

Before building, ensure all required files are present:

```bash
# Check project structure
ls -la

# Should see:
# docker-compose.prod.yml
# .env
# backend/Dockerfile.prod
# frontend/Dockerfile
# frontend/nginx.conf

# If docker-compose.prod.yml doesn't exist, create it (see Section 1.1)
nano docker-compose.prod.yml

# If backend/Dockerfile.prod doesn't exist, create it (see Section 1.2)
nano backend/Dockerfile.prod
```

### 4.4 Build and Start Containers

```bash
# Build all containers (this takes 5-10 minutes on first run)
docker compose -f docker-compose.prod.yml build

# Start containers in detached mode
docker compose -f docker-compose.prod.yml up -d

# Expected output:
# [+] Running 4/4
# ✔ Network event-ticketing-platform_event-ticketing-network  Created
# ✔ Container event-ticketing-redis                           Started
# ✔ Container event-ticketing-backend                         Started
# ✔ Container event-ticketing-frontend                        Started
```

### 4.5 Verify Containers Are Running

```bash
# Check container status
docker compose -f docker-compose.prod.yml ps

# Expected output (all should be "Up" or "running"):
# NAME                        STATUS                   PORTS
# event-ticketing-backend     Up                       8000/tcp
# event-ticketing-frontend    Up                       0.0.0.0:80->80/tcp
# event-ticketing-redis       Up (healthy)             6379/tcp
```

### 4.6 View Container Logs

```bash
# View all logs
docker compose -f docker-compose.prod.yml logs

# View specific service logs
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs frontend
docker compose -f docker-compose.prod.yml logs redis

# Follow logs in real-time (Ctrl+C to stop)
docker compose -f docker-compose.prod.yml logs -f backend
```

**Backend should show:**
```
Connected to Redis
MongoDB connected! DB HOST: your-cluster.mongodb.net
```

---

## 5. Networking & Access

### 5.1 Docker Network Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         EC2 Instance                         │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │          event-ticketing-network (Docker Bridge)       │  │
│  │                                                        │  │
│  │   ┌─────────────┐    ┌──────────────┐   ┌───────────┐  │  │
│  │   │   Nginx     │    │   Backend    │   │   Redis   │  │  │
│  │   │  (Frontend) │───▶│   (Node.js)  │──▶│  (Cache)  │  │  │
│  │   │   :80       │    │    :8000     │   │   :6379   │  │  │
│  │   └──────┬──────┘    └──────┬───────┘   └───────────┘  │  │
│  │          │                  │                          │  │
│  └──────────│──────────────────│──────────────────────────┘  │
│             │                  │                             │
│     ┌───────▼───────┐          │                             │
│     │   Port 80     │          │                             │
│     │   (Exposed)   │          │                             │
│     └───────────────┘          │                             │
│                                │                             │
└────────────────────────────────│─────────────────────────────┘
                                 │
                                 ▼
                          MongoDB Atlas
                           (External)
```

### 5.2 How Traffic Flows

1. **User visits `http://YOUR_EC2_IP`**
   - Request hits EC2 port 80
   - Port 80 is mapped to Nginx container

2. **Nginx serves static React files**
   - HTML, CSS, JS from `/usr/share/nginx/html`

3. **Browser makes API call to `/api/events`**
   - Nginx matches `location /api/` rule
   - Proxies request to `http://backend:8000/api/events`
   - `backend` is resolved via Docker DNS

4. **Socket.io connects to `/socket.io`**
   - Nginx matches `location /socket.io/` rule
   - Upgrades to WebSocket
   - Proxies to `http://backend:8000/socket.io`

5. **Backend queries MongoDB Atlas**
   - Uses connection string from `MONGODB_URI`
   - Traffic leaves EC2 to Atlas cloud

6. **Backend uses Redis for rate limiting**
   - Connects to `redis:6379` (Docker network)
   - `redis` resolved to Redis container IP

### 5.3 Verify Nginx is Proxying Correctly

```bash
# Test Nginx health endpoint
curl http://localhost/health
# Expected: healthy

# Test that API proxy works (inside EC2)
curl http://localhost/api/categories
# Expected: JSON response (empty array [] is OK if no categories exist)

# Check Nginx access logs
docker compose -f docker-compose.prod.yml logs frontend | grep -i "api"
```

### 5.4 Verify Backend Can Reach Redis

```bash
# Enter backend container
docker compose -f docker-compose.prod.yml exec backend sh

# Inside container, test Redis connection
# (If ping fails, install redis-cli: apk add --no-cache redis)
wget -qO- http://redis:6379 || echo "Redis is running (connection refused is expected)"

# Check backend logs for Redis connection
exit
docker compose -f docker-compose.prod.yml logs backend | grep -i redis
# Expected: "Connected to Redis"
```

### 5.5 Test From Your Browser

1. Open browser
2. Navigate to: `http://YOUR_EC2_PUBLIC_IP`
3. React app should load
4. Open DevTools (F12) → Network tab
5. Refresh the page
6. Look for `/api/` requests - they should return 200 or appropriate status

---

## 6. MongoDB Atlas Connection

### 6.1 Whitelist EC2 IP Address

1. **Log into MongoDB Atlas:** https://cloud.mongodb.com

2. **Go to Network Access:**
   - Click **"Network Access"** in left sidebar
   - Click **"Add IP Address"**

3. **Add EC2 IP:**
   - Enter your EC2 Public IP: `YOUR_EC2_PUBLIC_IP`
   - Comment: `EC2 Production Server`
   - Click **"Confirm"**

   > **Note:** For development, you can allow `0.0.0.0/0` (all IPs), but this is NOT recommended for production.

4. **Wait for activation** (takes 1-2 minutes)

### 6.2 Get Connection String

1. Go to **Database** → **Connect**
2. Choose **"Connect your application"**
3. Driver: Node.js, Version: 5.5 or later
4. Copy the connection string
5. Replace `<password>` with your actual password
6. **DO NOT include the database name in the URL** - it's added in code

**Example:**
```
mongodb+srv://myuser:mypassword123@cluster0.abc123.mongodb.net
```

### 6.3 Test Connection From EC2

```bash
# Install mongosh (MongoDB Shell)
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-mongosh

# Test connection (replace with your connection string)
mongosh "mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/event-ticketing-platform"

# If successful, you'll see:
# MongoDB shell connected to: mongodb+srv://...
# event-ticketing-platform>

# Type 'exit' to quit
exit
```

### 6.4 Troubleshooting MongoDB Connection

**Error: "connection timed out"**
- EC2 IP not whitelisted in Atlas
- Security group blocking outbound traffic (unlikely with default settings)

**Error: "authentication failed"**
- Wrong password in connection string
- Special characters in password not URL-encoded

**Error: "failed to resolve hostname"**
- DNS issue - check internet connectivity
- Try: `ping google.com`

---

## 7. Redis Configuration

### 7.1 Verify Redis is Running

```bash
# Check Redis container status
docker compose -f docker-compose.prod.yml ps redis

# Expected:
# NAME                   STATUS         PORTS
# event-ticketing-redis  Up (healthy)   6379/tcp
```

### 7.2 Test Redis Connection

```bash
# Connect to Redis CLI inside container
docker compose -f docker-compose.prod.yml exec redis redis-cli

# Inside Redis CLI:
ping
# Expected: PONG

# Check memory usage
info memory
# Look for: used_memory_human

# Exit
exit
```

### 7.3 Verify Backend → Redis Connection

```bash
# Check backend logs for Redis connection
docker compose -f docker-compose.prod.yml logs backend | grep -i "redis"

# Expected: "Connected to Redis"
```

### 7.4 Test Rate Limiting

The contact form uses Redis for rate limiting (1 request per 5 minutes per IP).

1. Open your app in browser
2. Go to Contact page
3. Submit a contact form
4. Try to submit again immediately
5. Should get: "Too many contact requests. Please try again after X minutes."

If rate limiting works, Redis is properly connected.

### 7.5 Redis Memory Configuration

For t2.micro, Redis is configured with:
- `maxmemory 100mb` - Maximum memory usage
- `maxmemory-policy allkeys-lru` - Evict least recently used keys when full

This is set in `docker-compose.prod.yml`:
```yaml
command: redis-server --maxmemory 100mb --maxmemory-policy allkeys-lru
```

### 7.6 Redis Data Persistence

Redis data persists in a Docker volume (`redis_data`). Data survives:
- Container restarts
- `docker compose down` and `up`

Data is lost with:
- `docker compose down -v` (removes volumes)
- `docker volume rm event-ticketing-platform_redis_data`

---

## 8. Nginx Configuration

### 8.1 Your Current nginx.conf (Already Correct!)

Your `frontend/nginx.conf` is well-configured:

✅ **API Proxy:** `/api/` → `backend:8000`
✅ **Socket.io:** `/socket.io/` → `backend:8000` with WebSocket upgrade headers
✅ **React Router:** `try_files $uri $uri/ /index.html`
✅ **Gzip Compression:** Enabled for text/css/js/json
✅ **Security Headers:** X-Frame-Options, X-Content-Type-Options
✅ **Static Asset Caching:** `/assets/` with 1 year cache

### 8.2 Review Nginx Configuration

```bash
# View current nginx config
docker compose -f docker-compose.prod.yml exec frontend cat /etc/nginx/conf.d/default.conf
```

### 8.3 Key Configuration Points

**Upstream Definition:**
```nginx
upstream backend {
    server backend:8000;
}
```
- `backend` is the Docker service name
- Docker DNS resolves it to backend container's IP

**API Proxy:**
```nginx
location /api/ {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**Socket.io WebSocket:**
```nginx
location /socket.io/ {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    # ... other headers
    proxy_read_timeout 3600s;  # 1 hour for long-polling
}
```

**React Router Support:**
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```
- Returns `index.html` for all routes (React handles routing)

### 8.4 View Nginx Logs

```bash
# Access logs (all requests)
docker compose -f docker-compose.prod.yml exec frontend cat /var/log/nginx/access.log

# Error logs
docker compose -f docker-compose.prod.yml exec frontend cat /var/log/nginx/error.log

# Or via docker logs
docker compose -f docker-compose.prod.yml logs frontend
```

### 8.5 Reload Nginx Configuration

If you modify nginx.conf:

```bash
# Rebuild frontend container
docker compose -f docker-compose.prod.yml build frontend

# Restart with new config
docker compose -f docker-compose.prod.yml up -d frontend
```

---

## 9. Gmail SMTP Configuration

### 9.1 Create Gmail App Password

Gmail requires an "App Password" for third-party apps:

1. **Enable 2-Step Verification:**
   - Go to: https://myaccount.google.com/security
   - Click **"2-Step Verification"**
   - Follow the setup process

2. **Create App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select app: **Mail**
   - Select device: **Other** → Enter "Event Ticketing Platform"
   - Click **"Generate"**
   - Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

3. **Update .env on EC2:**
   ```bash
   nano .env
   ```
   
   Update these lines:
   ```dotenv
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_gmail@gmail.com
   SMTP_PASS=abcdefghijklmnop   # Remove spaces from app password
   EMAIL_FROM=your_gmail@gmail.com
   ```

### 9.2 Restart Backend to Apply Changes

```bash
docker compose -f docker-compose.prod.yml restart backend
```

### 9.3 Test Email Sending

```bash
# Check backend logs for email errors
docker compose -f docker-compose.prod.yml logs backend | grep -i "email\|smtp\|mail"
```

To test:
1. Register a new user in your app
2. Check if verification email is sent
3. Check Gmail "Sent" folder

### 9.4 Troubleshooting Gmail SMTP

**Error: "Invalid login"**
- Wrong app password (check for typos/spaces)
- Using regular password instead of app password
- 2-Step Verification not enabled

**Error: "Connection timeout"**
- Port 587 blocked (check EC2 security group outbound rules)
- Try port 465 with `secure: true`

**Emails going to spam:**
- Set up SPF/DKIM records (requires custom domain)
- Use proper `EMAIL_FROM` matching your Gmail

---

## 10. Post-Deployment Verification

### 10.1 Complete Testing Checklist

Run through each test and check the box:

#### Basic Access
```bash
# Test from EC2 terminal
curl -I http://localhost
# Expected: HTTP/1.1 200 OK
```

☐ Visit `http://YOUR_EC2_PUBLIC_IP` in browser - React app loads
☐ No console errors in browser DevTools

#### API Connectivity
☐ Open DevTools → Network tab
☐ Refresh page - `/api/` requests should appear
☐ API calls return 200 or valid error responses (not 502)

#### Authentication
☐ Register a new user account
☐ Check email inbox for verification email
☐ Click verification link - should work
☐ Login with credentials
☐ Logout works

#### Google OAuth
☐ Click "Sign in with Google"
☐ Google consent screen appears
☐ Successfully redirects back and logs in

**Note:** Update Google Cloud Console:
1. Go to: https://console.cloud.google.com/apis/credentials
2. Edit your OAuth 2.0 Client ID
3. Add `http://YOUR_EC2_PUBLIC_IP` to:
   - Authorized JavaScript origins
   - Authorized redirect URIs

#### Events (If applicable to your role)
☐ View events list
☐ View event details
☐ Create new event (as organizer)
☐ Upload event image

#### Bookings
☐ Book an event
☐ Payment page loads (Stripe)
☐ Complete test payment
☐ Booking confirmation received

**Note:** For testing payments:
- Use Stripe test card: `4242 4242 4242 4242`
- Any future date, any CVC

#### Real-time Features (Socket.io)
☐ Open Team Chat (as organizer)
☐ Open same chat in another browser/incognito
☐ Send message - appears in both windows
☐ No WebSocket errors in console

#### Rate Limiting (Redis)
☐ Go to Contact page
☐ Submit contact form
☐ Try to submit again immediately
☐ Get rate limit message (429 error)

#### Google Maps
☐ Create/view venue with location
☐ Map loads correctly

#### Image Uploads (Cloudinary)
☐ Upload profile picture
☐ Upload event image
☐ Images display correctly

### 10.2 Health Check Commands

```bash
# Check all containers are healthy
docker compose -f docker-compose.prod.yml ps

# Check resource usage (memory is critical on t2.micro)
docker stats --no-stream

# Expected: Total memory < 800MB (leave some for system)
# NAME                      CPU %   MEM USAGE / LIMIT     MEM %
# event-ticketing-frontend  0.01%   5MiB / 64MiB          7.8%
# event-ticketing-backend   0.5%    180MiB / 512MiB       35%
# event-ticketing-redis     0.1%    15MiB / 128MiB        11.7%
```

### 10.3 Check Container Logs for Errors

```bash
# Check all logs for errors
docker compose -f docker-compose.prod.yml logs 2>&1 | grep -i "error\|fail\|exception"

# Check backend specifically
docker compose -f docker-compose.prod.yml logs backend 2>&1 | tail -50
```

### 10.4 Restart Services if Needed

```bash
# Restart single service
docker compose -f docker-compose.prod.yml restart backend

# Restart all services
docker compose -f docker-compose.prod.yml restart

# Full stop and start (if issues persist)
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

---

## 11. Production Optimizations

### 11.1 Memory Management for t2.micro

**Total RAM:** 1 GB (1024 MB)
**Swap:** 2 GB (from Section 3.6)

**Recommended Allocation:**
| Component | Memory Limit |
|-----------|--------------|
| System + Docker | ~200 MB |
| Backend (Node.js) | 512 MB |
| Redis | 128 MB |
| Nginx | 64 MB |
| Buffer | ~120 MB |
| **Total** | ~1024 MB |

These limits are set in `docker-compose.prod.yml` via:
```yaml
deploy:
  resources:
    limits:
      memory: 512M
```

### 11.2 Node.js Production Settings

Already configured in `docker-compose.prod.yml`:
```yaml
environment:
  NODE_ENV: production
```

This enables:
- View caching
- Reduced logging
- Optimized module loading

### 11.3 Frontend Build Optimizations

Vite automatically optimizes for production:
- Minification
- Tree shaking
- Code splitting
- Asset hashing

Verify build is optimized:
```bash
# Check built file sizes
docker compose -f docker-compose.prod.yml exec frontend ls -lh /usr/share/nginx/html/assets/
```

### 11.4 Nginx Static Asset Caching

Already configured in `nginx.conf`:
```nginx
location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 11.5 Enable Nginx Caching (Optional)

Add to `nginx.conf` for additional caching:

```nginx
# Add before server block
proxy_cache_path /tmp/nginx_cache levels=1:2 keys_zone=api_cache:10m max_size=100m inactive=60m;

# Inside /api/ location
location /api/ {
    # ... existing config ...
    
    # Cache GET requests for 1 minute (optional, be careful with dynamic data)
    # proxy_cache api_cache;
    # proxy_cache_valid 200 1m;
    # proxy_cache_methods GET HEAD;
}
```

### 11.6 Monitor Memory Usage

```bash
# Real-time monitoring
docker stats

# System memory
free -h

# If memory is consistently high, consider:
# 1. Reducing container memory limits
# 2. Adding more swap
# 3. Upgrading to t2.small (2GB RAM)
```

---

## 12. Troubleshooting Guide

### 12.1 Container Issues

#### Container Won't Start

```bash
# Check logs for specific container
docker compose -f docker-compose.prod.yml logs backend

# Check if container keeps restarting
docker compose -f docker-compose.prod.yml ps
# Look for "Restarting" status

# Check detailed container info
docker inspect event-ticketing-backend | grep -A 10 "State"
```

**Common causes:**
- Missing environment variables
- MongoDB connection failure
- Port already in use

#### Container Keeps Restarting (OOMKilled)

```bash
# Check if killed due to memory
docker inspect event-ticketing-backend | grep OOMKilled

# If true, increase memory limit or add swap
sudo swapon --show
```

#### View Resource Usage

```bash
# Live stats
docker stats

# If backend using >90% of its limit, consider increasing
```

### 12.2 Nginx → Backend Connection Issues

#### 502 Bad Gateway

```bash
# Check if backend is running
docker compose -f docker-compose.prod.yml ps backend

# Check backend logs
docker compose -f docker-compose.prod.yml logs backend

# Test backend directly from frontend container
docker compose -f docker-compose.prod.yml exec frontend wget -qO- http://backend:8000/ || echo "Cannot reach backend"

# Check Nginx error logs
docker compose -f docker-compose.prod.yml exec frontend cat /var/log/nginx/error.log
```

**Common causes:**
- Backend crashed (check logs)
- Backend hasn't started yet (health check failing)
- Wrong upstream configuration in nginx.conf

#### 504 Gateway Timeout

```bash
# Backend is running but slow
# Check if database query is slow
docker compose -f docker-compose.prod.yml logs backend | grep -i "timeout\|slow"
```

**Solutions:**
- Increase Nginx proxy timeouts
- Check MongoDB Atlas performance
- Add database indexes

### 12.3 Backend → Redis Connection Issues

```bash
# Check if Redis is healthy
docker compose -f docker-compose.prod.yml ps redis

# Test Redis from backend container
docker compose -f docker-compose.prod.yml exec backend sh -c "nc -zv redis 6379"

# Check Redis logs
docker compose -f docker-compose.prod.yml logs redis
```

**Rate limiting not working:**
1. Backend logs should show "Connected to Redis"
2. If not, check `REDIS_HOST=redis` in environment

### 12.4 Socket.io WebSocket Issues

#### WebSocket Connection Failed

```bash
# Check if Socket.io requests reach backend
docker compose -f docker-compose.prod.yml logs backend | grep -i "socket"

# Check Nginx logs for /socket.io requests
docker compose -f docker-compose.prod.yml logs frontend | grep "socket.io"
```

**Browser Console Errors:**

1. **"WebSocket connection failed"**
   - Check nginx.conf has Upgrade headers
   - Check CORS_ORIGIN matches your URL

2. **"CORS error"**
   - Update `CORS_ORIGIN` in .env
   - Restart backend

3. **"Authentication failed"**
   - JWT token expired or invalid
   - Check JWT_SECRET matches between frontend build and backend

### 12.5 MongoDB Connection Issues

```bash
# Check backend logs for MongoDB errors
docker compose -f docker-compose.prod.yml logs backend | grep -i "mongo"

# Test DNS resolution from backend
docker compose -f docker-compose.prod.yml exec backend sh -c "nslookup YOUR_CLUSTER.mongodb.net"

# Check if IPv6 issues (should be handled by family: 4)
docker compose -f docker-compose.prod.yml logs backend | grep -i "ENETUNREACH\|IPv6"
```

**Common errors:**

1. **"Authentication failed"**
   - Wrong username/password
   - URL-encode special characters

2. **"Connection timed out"**
   - EC2 IP not whitelisted
   - Check: Atlas → Network Access

3. **"No write concern mode named 'majority/..'"**
   - Query params in connection string
   - Move options to code (already done in your project)

### 12.6 Email Not Sending

```bash
# Check backend logs for email errors
docker compose -f docker-compose.prod.yml logs backend | grep -i "mail\|smtp\|email"

# Test SMTP connection from backend
docker compose -f docker-compose.prod.yml exec backend sh -c "nc -zv smtp.gmail.com 587"
```

**Solutions:**
1. Verify app password (not regular password)
2. Check 2FA is enabled on Gmail
3. Check EC2 security group allows outbound port 587

### 12.7 Frontend Not Loading

```bash
# Check Nginx is running
docker compose -f docker-compose.prod.yml ps frontend

# Check if files are in Nginx
docker compose -f docker-compose.prod.yml exec frontend ls /usr/share/nginx/html/

# Should see: index.html, assets/, etc.
```

**Blank page:**
- Check browser console for errors
- Verify Vite build completed successfully
- Check if VITE_* variables were set during build

### 12.8 Useful Debug Commands

```bash
# Enter container shell
docker compose -f docker-compose.prod.yml exec backend sh
docker compose -f docker-compose.prod.yml exec frontend sh

# View real-time logs
docker compose -f docker-compose.prod.yml logs -f

# Rebuild single service
docker compose -f docker-compose.prod.yml build --no-cache backend
docker compose -f docker-compose.prod.yml up -d backend

# Full restart
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d

# Nuclear option (removes volumes - DELETES DATA)
docker compose -f docker-compose.prod.yml down -v
docker system prune -a
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

---

## 13. Domain Setup (Optional)

### 13.1 Point Domain to EC2

1. **Get your EC2 Public IP** (e.g., `54.123.45.67`)

2. **In your domain registrar (e.g., GoDaddy, Namecheap, Route53):**
   - Add A Record:
     - Host: `@` (root domain)
     - Points to: `54.123.45.67`
     - TTL: 3600

   - Add A Record for www:
     - Host: `www`
     - Points to: `54.123.45.67`
     - TTL: 3600

3. **Wait for DNS propagation** (up to 48 hours, usually faster)

4. **Verify:**
   ```bash
   nslookup yourdomain.com
   # Should return your EC2 IP
   ```

### 13.2 Update Environment Variables

```bash
# On EC2
nano .env
```

Update:
```dotenv
CORS_ORIGIN=http://yourdomain.com
FRONTEND_URL=http://yourdomain.com
```

Restart:
```bash
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

### 13.3 Add SSL with Let's Encrypt (Certbot)

#### Option 1: Certbot in Docker (Recommended)

Create `docker-compose.ssl.yml`:

```yaml
services:
  certbot:
    image: certbot/certbot:latest
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.ssl
    # ... rest of config
    volumes:
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
    ports:
      - "80:80"
      - "443:443"
```

Create `frontend/nginx.ssl.conf`:

```nginx
upstream backend {
    server backend:8000;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect HTTP to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;
    
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    # API proxy
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.io
    location /socket.io/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 3600s;
        proxy_buffering off;
    }

    # Static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # React Router
    location / {
        try_files $uri $uri/ /index.html;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
    }
}
```

#### Obtain SSL Certificate

```bash
# First, run without SSL to get certificate
docker compose -f docker-compose.prod.yml up -d

# Create directories
mkdir -p certbot/conf certbot/www

# Get initial certificate
docker run -it --rm \
  -v $(pwd)/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/certbot/www:/var/www/certbot \
  -p 80:80 \
  certbot/certbot certonly \
  --standalone \
  --email your@email.com \
  --agree-tos \
  --no-eff-email \
  -d yourdomain.com -d www.yourdomain.com

# Now start with SSL config
docker compose -f docker-compose.ssl.yml up -d
```

### 13.4 Update OAuth Providers

After adding domain/SSL:

1. **Google Cloud Console:**
   - Add `https://yourdomain.com` to authorized origins
   - Add `https://yourdomain.com/api/auth/google/callback` to redirect URIs

2. **Stripe Dashboard:**
   - Update webhook URLs if configured

3. **Update .env:**
   ```dotenv
   CORS_ORIGIN=https://yourdomain.com
   FRONTEND_URL=https://yourdomain.com
   ```

---

## Quick Reference

### Common Commands

```bash
# SSH to EC2
ssh -i ~/.ssh/event-ticketing-key.pem ubuntu@YOUR_EC2_IP

# Start app
cd ~/event-ticketing-platform
docker compose -f docker-compose.prod.yml up -d

# Stop app
docker compose -f docker-compose.prod.yml down

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Restart single service
docker compose -f docker-compose.prod.yml restart backend

# Rebuild after code changes
git pull
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps
docker stats

# Check memory
free -h
```

### Files Modified/Created

| File | Action |
|------|--------|
| `docker-compose.prod.yml` | Created |
| `backend/Dockerfile.prod` | Created |
| `.env.production.example` | Created |
| `.env` (on EC2) | Created |
| `frontend/src/features/organizer/components/TeamChat.jsx` | Modified |
| `frontend/src/features/venues/components/VenueEnquiryChat.jsx` | Modified |
| `frontend/Dockerfile` | Modified (added VITE_SOCKET_URL) |

### Architecture

```
Browser → EC2:80 (Nginx) → /api/* → backend:8000 → MongoDB Atlas
                         → /socket.io/* → backend:8000 (WebSocket)
                         → /* → Static React files
                                    ↓
                              backend → redis:6379 (Rate limiting)
```

---

## Summary

✅ **What we set up:**
1. EC2 t2.micro with Ubuntu 24.04
2. Docker and Docker Compose
3. Production Docker Compose configuration
4. Nginx serving React + proxying to backend
5. Backend connecting to Redis and MongoDB Atlas
6. Gmail SMTP for emails
7. WebSocket support for real-time features
8. Memory optimization for 1GB RAM

✅ **Your app is now live at:** `http://YOUR_EC2_PUBLIC_IP`

🔐 **Next steps for production hardening:**
- [ ] Add SSL certificate (Section 13)
- [ ] Set up custom domain
- [ ] Configure automated backups
- [ ] Set up monitoring (CloudWatch, etc.)
- [ ] Implement log aggregation
- [ ] Set up CI/CD pipeline

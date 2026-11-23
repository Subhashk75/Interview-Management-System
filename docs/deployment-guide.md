# Enterprise Interview Management System (IMS)
## Production Deployment & Infrastructure Guide

**Document:** `docs/deployment-guide.md`  
**Status:** Approved Architectural Document  
**Version:** 1.0.0 (Production Blueprint)  
**Date:** November 2026  

---

### 1. Infrastructure Overview

The **Interview Management System (IMS)** is packaged into containerized services using **Docker** and orchestrated via **Docker Compose** for local and staging environments, or deployable to Kubernetes / Cloud Container instances (AWS ECS, Google Cloud Run, Azure Container Apps) in production.

```
                    ┌──────────────────────────────┐
                    │      Reverse Proxy / CDN     │
                    │      (Nginx / Cloudflare)    │
                    └──────────────┬───────────────┘
                                   │
                    ┌──────────────┴───────────────┐
                    │      Port 3000               │ Port 8080
                    ▼                              ▼
      ┌─────────────────────────┐    ┌─────────────────────────┐
      │     Next.js Frontend    │    │   Spring Boot Backend   │
      │   (Node 20 Alpine Cont) │    │  (Java 21 Alpine Cont)  │
      └─────────────────────────┘    └─────────────┬───────────┘
                                                   │ Port 27017
                                                   ▼
                                     ┌─────────────────────────┐
                                     │     MongoDB 7.x         │
                                     │ (Docker / Mongo Atlas)  │
                                     └─────────────────────────┘
```

---

### 2. Multi-Stage Docker Build Specifications

#### 2.1 Backend Dockerfile (`backend/Dockerfile`)
```dockerfile
# Stage 1: Build JAR with Maven & OpenJDK 21
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /build

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Minimal Distroless / Alpine Runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=builder /build/target/ims-backend-*.jar app.jar

ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_OPTS="-XX:+UseZGC -XX:+ZGenerational -XX:MaxRAMPercentage=75.0"

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

#### 2.2 Frontend Dockerfile (`frontend/Dockerfile`)
```dockerfile
# Stage 1: Install Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Build Next.js Standalone
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: Minimal Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

---

### 3. Docker Compose Orchestration (`docker-compose.yml`)

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: ims-mongodb
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: secretpassword
      MONGO_INITDB_DATABASE: ims_db
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/ims_db --quiet
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: ims-backend
    restart: always
    depends_on:
      mongodb:
        condition: service_healthy
    environment:
      SPRING_DATA_MONGODB_URI: mongodb://admin:secretpassword@mongodb:27017/ims_db?authSource=admin
      JWT_SECRET: c2VjdXJlLWVudGVycHJpc2UtaW1zLXNlY3JldC1rZXktZXhhbXBsZS0yNTY=
      JWT_EXPIRATION_MS: 3600000
      JWT_REFRESH_EXPIRATION_MS: 604800000
      CORS_ALLOWED_ORIGINS: http://localhost:3000,http://127.0.0.1:3000
    ports:
      - "8080:8080"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: ims-frontend
    restart: always
    depends_on:
      - backend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8080/api/v1
    ports:
      - "3000:3000"

volumes:
  mongo_data:
```

---

### 4. Environment-Based Configuration Strategy

| Variable Name | Description | Example (Development) | Production Guidance |
| :--- | :--- | :--- | :--- |
| `SPRING_DATA_MONGODB_URI` | MongoDB Connection URI | `mongodb://localhost:27017/ims_db` | Use MongoDB Atlas replica set URI with SSL enabled. |
| `JWT_SECRET` | Base64 HMAC-SHA256 Signing Key | `dGVzdC1zZWNyZXQtMjU2LWJpdC1rZXk=...` | Must be a secure 256-bit or 512-bit randomly generated key stored in AWS Secrets Manager / Vault. |
| `JWT_EXPIRATION_MS` | Access token lifespan | `3600000` (1 Hour) | Keep between 15 and 60 minutes. |
| `JWT_REFRESH_EXPIRATION_MS` | Refresh token lifespan | `604800000` (7 Days) | Store in HTTP-only Secure SameSite cookies. |
| `CORS_ALLOWED_ORIGINS` | Permitted browser origins | `http://localhost:3000` | Restrict strictly to your production domain(s). |
| `FILE_UPLOAD_DIR` | Local resume storage directory | `./uploads/resumes` | Mount to persistent volume or integrate AWS S3 / Cloud Storage in production. |
| `NEXT_PUBLIC_API_URL` | Public API endpoint for Next.js | `http://localhost:8080/api/v1` | Public HTTPS domain, e.g. `https://api.ims.acme.com/api/v1`. |

---

### 5. Production MongoDB Atlas Configuration Checklist

When migrating from local Docker MongoDB to **MongoDB Atlas**:
1. **Cluster Tier:** Minimum M10 cluster with automated daily snapshots and replica set enabled across 3 availability zones.
2. **Network Security:** Enable IP Whitelisting restricting access exclusively to backend application server NAT Gateway IP addresses.
3. **Database Authentication:** Create dedicated non-root application user credentials with `readWrite` permissions on `ims_db`.
4. **Index Verification:** Ensure compound indexes on `(interviewerIds, scheduledStart, scheduledEnd)` and `(email)` are built in the background before routing production traffic.

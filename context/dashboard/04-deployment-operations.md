# Deployment & Operations: Production-Ready Multi-Tenant SaaS

## Overview

This guide covers production deployment, monitoring, security hardening, and operational best practices for the multi-tenant SaaS platform built with Next.js 15, Logto, and shadcn/ui.

## Prerequisites

- Completed previous guides (01-03)
- Basic understanding of Docker and Kubernetes
- Production Logto instance or cloud account
- Domain name and SSL certificates

## Part A: Production Environment Setup

### Step 1: Environment Configuration

#### Production Environment Variables

Create `production.env`:

```env
# Application
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Logto Configuration (Production)
LOGTO_ENDPOINT=https://your-tenant.logto.app
LOGTO_APP_ID=your_production_app_id
LOGTO_APP_SECRET=your_production_app_secret
LOGTO_BASE_URL=https://your-domain.com
LOGTO_COOKIE_SECRET=your_secure_32_character_production_secret

# M2M Application
LOGTO_M2M_APP_ID=your_production_m2m_app_id
LOGTO_M2M_APP_SECRET=your_production_m2m_app_secret

# API Resource
API_RESOURCE_IDENTIFIER=https://api.your-domain.com

# Database (Production)
DATABASE_URL=postgresql://user:password@postgres:5432/ecosystem_prod
DATABASE_SSL=true
DATABASE_POOL_SIZE=20
DATABASE_CONNECTION_TIMEOUT=10000

# Redis (Caching)
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=your_redis_password

# External Services
RESEND_API_KEY=your_production_resend_key
UPLOADTHING_SECRET=your_production_uploadthing_secret
UPLOADTHING_APP_ID=your_production_uploadthing_app_id

# Security
NEXTAUTH_SECRET=your_nextauth_secret
ALLOWED_ORIGINS=https://your-domain.com,https://api.your-domain.com

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
SENTRY_ENVIRONMENT=production
POSTHOG_KEY=your_posthog_key
POSTHOG_HOST=https://app.posthog.com

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_ERROR_TRACKING=true
ENABLE_PERFORMANCE_MONITORING=true
```

#### Secrets Management with Kubernetes

Create `k8s/secrets.yaml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: ecosystem-secrets
  namespace: default
type: Opaque
data:
  # Base64 encoded secrets
  database-url: cG9zdGdyZXNxbDovL3VzZXI6cGFzc3dvcmRAcG9zdGdyZXM6NTQzMi9lY29zeXN0ZW1fcHJvZA==
  logto-app-secret: eW91cl9sb2d0b19hcHBfc2VjcmV0
  logto-m2m-secret: eW91cl9sb2d0b19tMm1fc2VjcmV0
  logto-cookie-secret: eW91cl9sb2d0b19jb29raWVfc2VjcmV0
  nextauth-secret: eW91cl9uZXh0YXV0aF9zZWNyZXQ=
  redis-password: eW91cl9yZWRpc19wYXNzd29yZA==
  sentry-dsn: aHR0cHM6Ly95b3VyLXNlbnRyeS1kc24=
```

### Step 2: Docker Production Configuration

#### Multi-stage Dockerfile

Create `Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci --only=production --ignore-scripts

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time environment variables
ARG DATABASE_URL
ARG LOGTO_ENDPOINT
ARG LOGTO_APP_ID
ARG API_RESOURCE_IDENTIFIER

ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
```

#### Docker Compose for Production

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        DATABASE_URL: ${DATABASE_URL}
        LOGTO_ENDPOINT: ${LOGTO_ENDPOINT}
        LOGTO_APP_ID: ${LOGTO_APP_ID}
        API_RESOURCE_IDENTIFIER: ${API_RESOURCE_IDENTIFIER}
    container_name: ecosystem-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - production.env
    depends_on:
      - postgres
      - redis
    networks:
      - ecosystem-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  postgres:
    image: postgres:15-alpine
    container_name: ecosystem-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ecosystem_prod
      POSTGRES_USER: ${POSTGRES_USER:-ecosystem}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    networks:
      - ecosystem-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-ecosystem}"]
      interval: 30s
      timeout: 10s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: ecosystem-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD}
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - ecosystem-network
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5

  nginx:
    image: nginx:alpine
    container_name: ecosystem-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    networks:
      - ecosystem-network

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local

networks:
  ecosystem-network:
    driver: bridge
```

#### Nginx Configuration

Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Upstream
    upstream nextjs {
        server app:3000;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    # Main server
    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://your-logto-endpoint.com";

        # Rate limiting
        location ~ ^/(api/auth|auth) {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://nextjs;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://nextjs;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Static files caching
        location /_next/static {
            proxy_pass http://nextjs;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Main application
        location / {
            proxy_pass http://nextjs;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## Part B: Kubernetes Deployment

### Step 3: Kubernetes Configuration

#### Namespace and ConfigMap

Create `k8s/namespace.yaml`:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ecosystem-platform
  labels:
    name: ecosystem-platform
```

Create `k8s/configmap.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ecosystem-config
  namespace: ecosystem-platform
data:
  NODE_ENV: "production"
  NEXT_TELEMETRY_DISABLED: "1"
  LOGTO_ENDPOINT: "https://your-tenant.logto.app"
  LOGTO_BASE_URL: "https://your-domain.com"
  API_RESOURCE_IDENTIFIER: "https://api.your-domain.com"
  DATABASE_SSL: "true"
  DATABASE_POOL_SIZE: "20"
  DATABASE_CONNECTION_TIMEOUT: "10000"
  ENABLE_ANALYTICS: "true"
  ENABLE_ERROR_TRACKING: "true"
  ENABLE_PERFORMANCE_MONITORING: "true"
```

#### Application Deployment

Create `k8s/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ecosystem-app
  namespace: ecosystem-platform
  labels:
    app: ecosystem-app
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 2
  selector:
    matchLabels:
      app: ecosystem-app
  template:
    metadata:
      labels:
        app: ecosystem-app
    spec:
      containers:
      - name: ecosystem-app
        image: your-registry/ecosystem-platform:latest
        ports:
        - containerPort: 3000
          name: http
        env:
        - name: PORT
          value: "3000"
        - name: HOSTNAME
          value: "0.0.0.0"
        envFrom:
        - configMapRef:
            name: ecosystem-config
        - secretRef:
            name: ecosystem-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sleep", "15"]
      terminationGracePeriodSeconds: 30
---
apiVersion: v1
kind: Service
metadata:
  name: ecosystem-app-service
  namespace: ecosystem-platform
spec:
  selector:
    app: ecosystem-app
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
  type: ClusterIP
```

#### Database Configuration

Create `k8s/postgres.yaml`:

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: ecosystem-platform
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        env:
        - name: POSTGRES_DB
          value: "ecosystem_prod"
        - name: POSTGRES_USER
          value: "ecosystem"
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: ecosystem-secrets
              key: postgres-password
        ports:
        - containerPort: 5432
          name: postgres
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        - name: init-script
          mountPath: /docker-entrypoint-initdb.d
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          exec:
            command:
            - pg_isready
            - -U
            - ecosystem
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          exec:
            command:
            - pg_isready
            - -U
            - ecosystem
          initialDelaySeconds: 5
          periodSeconds: 5
      volumes:
      - name: init-script
        configMap:
          name: postgres-init
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 20Gi
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: ecosystem-platform
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
  type: ClusterIP
```

#### Ingress Configuration

Create `k8s/ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ecosystem-ingress
  namespace: ecosystem-platform
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/use-regex: "true"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
    nginx.ingress.kubernetes.io/server-snippet: |
      location ~ ^/(api/auth|auth) {
        limit_req zone=login burst=5 nodelay;
      }
spec:
  tls:
  - hosts:
    - your-domain.com
    - api.your-domain.com
    secretName: ecosystem-tls
  rules:
  - host: your-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ecosystem-app-service
            port:
              number: 80
  - host: api.your-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ecosystem-app-service
            port:
              number: 80
```

### Step 4: Health Checks and Monitoring

#### Health Check API

Create `src/app/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server'

interface HealthCheck {
  name: string
  status: 'healthy' | 'unhealthy'
  error?: string
  responseTime?: number
}

async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now()
  try {
    // Add your database connection check here
    // const result = await db.query('SELECT 1')
    return {
      name: 'database',
      status: 'healthy',
      responseTime: Date.now() - start
    }
  } catch (error) {
    return {
      name: 'database',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - start
    }
  }
}

async function checkLogto(): Promise<HealthCheck> {
  const start = Date.now()
  try {
    const response = await fetch(`${process.env.LOGTO_ENDPOINT}/.well-known/logto_admin`, {
      method: 'GET',
      timeout: 5000,
    } as any)
    
    return {
      name: 'logto',
      status: response.ok ? 'healthy' : 'unhealthy',
      responseTime: Date.now() - start
    }
  } catch (error) {
    return {
      name: 'logto',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - start
    }
  }
}

async function checkRedis(): Promise<HealthCheck> {
  const start = Date.now()
  try {
    // Add your Redis connection check here
    // const result = await redis.ping()
    return {
      name: 'redis',
      status: 'healthy',
      responseTime: Date.now() - start
    }
  } catch (error) {
    return {
      name: 'redis',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - start
    }
  }
}

export async function GET() {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkLogto(),
    checkRedis(),
  ])

  const results: HealthCheck[] = checks.map((check, index) => {
    if (check.status === 'fulfilled') {
      return check.value
    } else {
      const names = ['database', 'logto', 'redis']
      return {
        name: names[index],
        status: 'unhealthy',
        error: check.reason?.message || 'Health check failed'
      }
    }
  })

  const isHealthy = results.every(result => result.status === 'healthy')
  const overallStatus = isHealthy ? 'healthy' : 'unhealthy'

  const response = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV,
    checks: results
  }

  return NextResponse.json(response, {
    status: isHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    }
  })
}
```

### Step 5: Monitoring and Observability

#### Prometheus Metrics

Create `src/lib/metrics.ts`:

```typescript
import { NextRequest } from 'next/server'

interface Metric {
  name: string
  value: number
  labels?: Record<string, string>
  timestamp: number
}

class MetricsCollector {
  private metrics: Metric[] = []

  counter(name: string, value: number = 1, labels?: Record<string, string>) {
    this.metrics.push({
      name: `${name}_total`,
      value,
      labels,
      timestamp: Date.now()
    })
  }

  histogram(name: string, value: number, labels?: Record<string, string>) {
    this.metrics.push({
      name: `${name}_duration_ms`,
      value,
      labels,
      timestamp: Date.now()
    })
  }

  gauge(name: string, value: number, labels?: Record<string, string>) {
    this.metrics.push({
      name,
      value,
      labels,
      timestamp: Date.now()
    })
  }

  getMetrics(): Metric[] {
    return this.metrics
  }

  reset() {
    this.metrics = []
  }
}

export const metrics = new MetricsCollector()

// Middleware for API metrics
export function withMetrics<T>(
  handler: (req: NextRequest) => Promise<T>,
  operation: string
) {
  return async (req: NextRequest): Promise<T> => {
    const start = Date.now()
    const method = req.method
    
    try {
      const result = await handler(req)
      const duration = Date.now() - start
      
      metrics.counter('api_requests', 1, { method, operation, status: '200' })
      metrics.histogram('api_request_duration', duration, { method, operation })
      
      return result
    } catch (error) {
      const duration = Date.now() - start
      
      metrics.counter('api_requests', 1, { method, operation, status: '500' })
      metrics.histogram('api_request_duration', duration, { method, operation })
      metrics.counter('api_errors', 1, { method, operation })
      
      throw error
    }
  }
}

// Business metrics
export function trackUserAction(userId: string, action: string, organizationId?: string) {
  metrics.counter('user_actions', 1, {
    action,
    organization_id: organizationId || 'none'
  })
}

export function trackOrganizationEvent(organizationId: string, event: string) {
  metrics.counter('organization_events', 1, {
    organization_id: organizationId,
    event
  })
}

export function trackAuthEvent(event: 'login' | 'logout' | 'register', method?: string) {
  metrics.counter('auth_events', 1, {
    event,
    method: method || 'unknown'
  })
}
```

#### Metrics API Endpoint

Create `src/app/api/metrics/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { metrics } from '@/lib/metrics'

export async function GET() {
  const allMetrics = metrics.getMetrics()
  
  // Convert to Prometheus format
  const prometheusMetrics = allMetrics.map(metric => {
    const labels = metric.labels 
      ? Object.entries(metric.labels).map(([k, v]) => `${k}="${v}"`).join(',')
      : ''
    
    return `${metric.name}${labels ? `{${labels}}` : ''} ${metric.value} ${metric.timestamp}`
  }).join('\n')

  // Add system metrics
  const systemMetrics = [
    `nodejs_memory_usage_bytes{type="rss"} ${process.memoryUsage().rss} ${Date.now()}`,
    `nodejs_memory_usage_bytes{type="heapUsed"} ${process.memoryUsage().heapUsed} ${Date.now()}`,
    `nodejs_uptime_seconds ${process.uptime()} ${Date.now()}`,
  ]

  const response = [
    '# HELP api_requests_total Total number of API requests',
    '# TYPE api_requests_total counter',
    '# HELP api_request_duration_ms API request duration in milliseconds',
    '# TYPE api_request_duration_ms histogram',
    '# HELP nodejs_memory_usage_bytes Memory usage in bytes',
    '# TYPE nodejs_memory_usage_bytes gauge',
    '# HELP nodejs_uptime_seconds Node.js uptime in seconds',
    '# TYPE nodejs_uptime_seconds counter',
    '',
    ...systemMetrics,
    prometheusMetrics
  ].join('\n')

  return new Response(response, {
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}
```

### Step 6: Logging and Error Tracking

#### Structured Logging

Create `src/lib/logger.ts`:

```typescript
import { NextRequest } from 'next/server'

interface LogContext {
  userId?: string
  organizationId?: string
  requestId?: string
  userAgent?: string
  ip?: string
  [key: string]: any
}

class Logger {
  private context: LogContext = {}

  setContext(context: LogContext) {
    this.context = { ...this.context, ...context }
  }

  private formatLog(level: string, message: string, extra?: any) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      context: this.context,
      ...extra,
    })
  }

  info(message: string, extra?: any) {
    console.log(this.formatLog('info', message, extra))
  }

  warn(message: string, extra?: any) {
    console.warn(this.formatLog('warn', message, extra))
  }

  error(message: string, error?: Error, extra?: any) {
    console.error(this.formatLog('error', message, {
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
      ...extra,
    }))

    // Send to external error tracking (Sentry, etc.)
    if (process.env.SENTRY_DSN && error) {
      // Sentry.captureException(error, { extra: { message, ...extra } })
    }
  }

  debug(message: string, extra?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatLog('debug', message, extra))
    }
  }
}

export const logger = new Logger()

// Request logging middleware
export function withRequestLogging(req: NextRequest) {
  const requestId = crypto.randomUUID()
  
  logger.setContext({
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers.get('user-agent'),
    ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
  })

  return requestId
}

// Authentication logging
export function logAuthEvent(event: string, userId?: string, success: boolean = true, error?: Error) {
  logger.info(`Auth event: ${event}`, {
    userId,
    success,
    event,
    error: error?.message,
  })
}

// Organization logging
export function logOrganizationEvent(event: string, organizationId: string, userId: string, details?: any) {
  logger.info(`Organization event: ${event}`, {
    organizationId,
    userId,
    event,
    details,
  })
}
```

## Part C: Security Hardening

### Step 7: Security Configuration

#### Security Headers Middleware

Create `src/middleware.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withRequestLogging, logger } from '@/lib/logger'
import { metrics } from '@/lib/metrics'

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || []

export function middleware(request: NextRequest) {
  const requestId = withRequestLogging(request)
  const start = Date.now()

  // CORS handling
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin')
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '3600',
        },
      })
    }
  }

  // Rate limiting (implement with Redis or in-memory store)
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
  if (ip && isRateLimited(ip)) {
    metrics.counter('rate_limit_exceeded', 1, { ip })
    return new NextResponse('Rate limit exceeded', { status: 429 })
  }

  // Security headers
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-Request-ID', requestId)
  
  // CSP
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    `connect-src 'self' ${process.env.LOGTO_ENDPOINT}`,
    "frame-ancestors 'none'",
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)

  // Timing metrics
  const duration = Date.now() - start
  metrics.histogram('middleware_duration', duration)

  return response
}

function isRateLimited(ip: string): boolean {
  // Implement rate limiting logic
  // This is a simplified version - use Redis for production
  return false
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    '/api/(.*)',
  ],
}
```

### Step 8: Backup and Recovery

#### Database Backup Script

Create `scripts/backup.sh`:

```bash
#!/bin/bash

set -e

# Configuration
BACKUP_DIR="/backups"
DB_NAME="ecosystem_prod"
DB_USER="ecosystem"
DB_HOST="${POSTGRES_HOST:-postgres}"
DB_PORT="${POSTGRES_PORT:-5432}"
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate backup filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/ecosystem_backup_$TIMESTAMP.sql.gz"

# Create backup
echo "Creating backup: $BACKUP_FILE"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --verbose --clean --no-owner --no-privileges | gzip > "$BACKUP_FILE"

# Verify backup
if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
  echo "Backup created successfully: $BACKUP_FILE"
  
  # Upload to cloud storage (optional)
  if [ -n "$AWS_S3_BUCKET" ]; then
    aws s3 cp "$BACKUP_FILE" "s3://$AWS_S3_BUCKET/backups/"
    echo "Backup uploaded to S3"
  fi
else
  echo "Backup failed!"
  exit 1
fi

# Cleanup old backups
find "$BACKUP_DIR" -name "ecosystem_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "Cleaned up backups older than $RETENTION_DAYS days"
```

#### Backup CronJob for Kubernetes

Create `k8s/backup-cronjob.yaml`:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: ecosystem-backup
  namespace: ecosystem-platform
spec:
  schedule: "0 2 * * *" # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:15-alpine
            command:
            - /bin/sh
            - -c
            - |
              TIMESTAMP=$(date +%Y%m%d_%H%M%S)
              BACKUP_FILE="/backup/ecosystem_backup_$TIMESTAMP.sql.gz"
              
              pg_dump -h postgres -U ecosystem -d ecosystem_prod \
                --verbose --clean --no-owner --no-privileges | gzip > "$BACKUP_FILE"
              
              echo "Backup created: $BACKUP_FILE"
              
              # Cleanup old backups (keep 30 days)
              find /backup -name "ecosystem_backup_*.sql.gz" -mtime +30 -delete
            env:
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: ecosystem-secrets
                  key: postgres-password
            volumeMounts:
            - name: backup-storage
              mountPath: /backup
          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: backup-pvc
          restartPolicy: OnFailure
```

## Part D: Deployment Scripts

### Step 9: Automated Deployment

#### Deploy Script

Create `deploy.sh`:

```bash
#!/bin/bash

set -e

# Configuration
NAMESPACE="ecosystem-platform"
IMAGE_TAG=${1:-latest}
REGISTRY=${REGISTRY:-your-registry.com}
PROJECT_NAME="ecosystem-platform"

echo "🚀 Starting deployment of $PROJECT_NAME:$IMAGE_TAG"

# Build and push Docker image
echo "📦 Building Docker image..."
docker build -t "$REGISTRY/$PROJECT_NAME:$IMAGE_TAG" .
docker push "$REGISTRY/$PROJECT_NAME:$IMAGE_TAG"

# Update Kubernetes deployment
echo "🎯 Updating Kubernetes deployment..."
kubectl set image deployment/ecosystem-app ecosystem-app="$REGISTRY/$PROJECT_NAME:$IMAGE_TAG" -n "$NAMESPACE"

# Wait for rollout
echo "⏳ Waiting for deployment to complete..."
kubectl rollout status deployment/ecosystem-app -n "$NAMESPACE" --timeout=300s

# Verify deployment
echo "✅ Verifying deployment..."
kubectl get pods -n "$NAMESPACE" -l app=ecosystem-app

# Run post-deployment health check
echo "🔍 Running health check..."
sleep 10
HEALTH_URL="https://your-domain.com/api/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL")

if [ "$RESPONSE" = "200" ]; then
  echo "✅ Deployment successful! Health check passed."
else
  echo "❌ Health check failed with status: $RESPONSE"
  exit 1
fi

echo "🎉 Deployment completed successfully!"
```

#### Rollback Script

Create `rollback.sh`:

```bash
#!/bin/bash

set -e

NAMESPACE="ecosystem-platform"

echo "🔄 Rolling back deployment..."

# Rollback to previous revision
kubectl rollout undo deployment/ecosystem-app -n "$NAMESPACE"

# Wait for rollback
echo "⏳ Waiting for rollback to complete..."
kubectl rollout status deployment/ecosystem-app -n "$NAMESPACE" --timeout=300s

# Verify rollback
echo "✅ Verifying rollback..."
kubectl get pods -n "$NAMESPACE" -l app=ecosystem-app

echo "🎉 Rollback completed successfully!"
```

## Step 10: Production Checklist

### Pre-deployment Checklist

- [ ] Environment variables configured
- [ ] Secrets properly managed
- [ ] SSL certificates installed
- [ ] Database migrations run
- [ ] Backup strategy implemented
- [ ] Monitoring configured
- [ ] Health checks working
- [ ] Rate limiting configured
- [ ] Security headers set
- [ ] Performance testing completed

### Post-deployment Verification

- [ ] Application loads correctly
- [ ] Authentication flow works
- [ ] API endpoints respond
- [ ] Health checks pass
- [ ] Metrics collection working
- [ ] Logging properly configured
- [ ] Error tracking functional
- [ ] Backup job scheduled
- [ ] SSL certificate valid
- [ ] Performance metrics acceptable

This comprehensive deployment guide ensures your multi-tenant SaaS platform is production-ready with proper security, monitoring, and operational procedures in place.
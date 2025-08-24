# Rate Limiting & API Security

API security and rate limiting are critical for protecting your services from abuse, ensuring fair usage, and maintaining system stability. This section covers comprehensive strategies for securing APIs and implementing effective rate limiting.

## Rate Limiting Fundamentals

### Why Rate Limiting Matters

**Protection Against:**
- **DDoS attacks** and traffic spikes
- **Brute force attacks** on authentication endpoints
- **Resource exhaustion** from excessive requests
- **Unfair usage** by individual clients
- **Cost control** for paid APIs

**Benefits:**
- **System stability** under load
- **Fair resource allocation** among users
- **Improved user experience** for legitimate users
- **Cost predictability** and control

### Rate Limiting Algorithms

#### 1. Token Bucket Algorithm

Most flexible and commonly used algorithm.

**How it works:**
- Bucket holds tokens (request permits)
- Tokens added at fixed rate
- Each request consumes a token
- Requests blocked when bucket empty

```javascript
class TokenBucket {
  constructor(capacity, refillRate) {
    this.capacity = capacity;      // Maximum tokens
    this.tokens = capacity;        // Current tokens
    this.refillRate = refillRate;  // Tokens per second
    this.lastRefill = Date.now();
  }
  
  consume(tokens = 1) {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    return false;
  }
  
  refill() {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = timePassed * this.refillRate;
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

// Usage example
const bucket = new TokenBucket(100, 10); // 100 capacity, 10 tokens/sec

app.use('/api', (req, res, next) => {
  const clientId = req.ip;
  const clientBucket = getBucket(clientId);
  
  if (clientBucket.consume()) {
    next();
  } else {
    res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil((1 - clientBucket.tokens) / clientBucket.refillRate)
    });
  }
});
```

#### 2. Fixed Window Algorithm

Simple time-based windows.

```javascript
class FixedWindow {
  constructor(limit, windowSize) {
    this.limit = limit;           // Requests per window
    this.windowSize = windowSize; // Window size in ms
    this.windows = new Map();     // clientId -> { count, windowStart }
  }
  
  isAllowed(clientId) {
    const now = Date.now();
    const windowStart = Math.floor(now / this.windowSize) * this.windowSize;
    
    const window = this.windows.get(clientId);
    
    if (!window || window.windowStart !== windowStart) {
      // New window
      this.windows.set(clientId, { count: 1, windowStart });
      return true;
    }
    
    if (window.count < this.limit) {
      window.count++;
      return true;
    }
    
    return false;
  }
}

// Usage: 100 requests per minute
const rateLimiter = new FixedWindow(100, 60 * 1000);
```

#### 3. Sliding Window Log

Precise but memory-intensive.

```javascript
class SlidingWindowLog {
  constructor(limit, windowSize) {
    this.limit = limit;
    this.windowSize = windowSize;
    this.logs = new Map(); // clientId -> [timestamps]
  }
  
  isAllowed(clientId) {
    const now = Date.now();
    const windowStart = now - this.windowSize;
    
    let log = this.logs.get(clientId) || [];
    
    // Remove old entries
    log = log.filter(timestamp => timestamp > windowStart);
    
    if (log.length < this.limit) {
      log.push(now);
      this.logs.set(clientId, log);
      return true;
    }
    
    return false;
  }
}
```

#### 4. Sliding Window Counter

Balance between accuracy and efficiency.

```javascript
class SlidingWindowCounter {
  constructor(limit, windowSize) {
    this.limit = limit;
    this.windowSize = windowSize;
    this.windows = new Map();
  }
  
  isAllowed(clientId) {
    const now = Date.now();
    const currentWindow = Math.floor(now / this.windowSize);
    const previousWindow = currentWindow - 1;
    
    const windows = this.windows.get(clientId) || {};
    const currentCount = windows[currentWindow] || 0;
    const previousCount = windows[previousWindow] || 0;
    
    // Calculate sliding window count
    const timeIntoCurrentWindow = (now % this.windowSize) / this.windowSize;
    const slidingCount = previousCount * (1 - timeIntoCurrentWindow) + currentCount;
    
    if (slidingCount < this.limit) {
      windows[currentWindow] = currentCount + 1;
      this.windows.set(clientId, windows);
      
      // Cleanup old windows
      delete windows[currentWindow - 2];
      
      return true;
    }
    
    return false;
  }
}
```

## Rate Limiting Implementation Strategies

### 1. Application-Level Rate Limiting

```javascript
// Express.js middleware
const rateLimit = require('express-rate-limit');

// Basic rate limiting
const basicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
});

// Different limits for different endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Strict limit for auth endpoints
  skipSuccessfulRequests: true, // Don't count successful requests
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Higher limit for general API
});

// Apply limiters
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);
app.use(basicLimiter); // Fallback for other routes
```

### 2. Redis-Based Distributed Rate Limiting

```javascript
const redis = require('redis');
const client = redis.createClient();

class RedisRateLimiter {
  constructor(redis, limit, windowSize) {
    this.redis = redis;
    this.limit = limit;
    this.windowSize = windowSize;
  }
  
  async isAllowed(key) {
    const now = Date.now();
    const window = Math.floor(now / this.windowSize);
    const redisKey = `rate_limit:${key}:${window}`;
    
    const pipeline = this.redis.pipeline();
    pipeline.incr(redisKey);
    pipeline.expire(redisKey, Math.ceil(this.windowSize / 1000));
    
    const results = await pipeline.exec();
    const count = results[0][1];
    
    return count <= this.limit;
  }
  
  async getRemainingRequests(key) {
    const now = Date.now();
    const window = Math.floor(now / this.windowSize);
    const redisKey = `rate_limit:${key}:${window}`;
    
    const count = await this.redis.get(redisKey) || 0;
    return Math.max(0, this.limit - count);
  }
}

// Usage
const rateLimiter = new RedisRateLimiter(client, 100, 60000);

app.use('/api', async (req, res, next) => {
  const key = req.ip;
  
  if (await rateLimiter.isAllowed(key)) {
    const remaining = await rateLimiter.getRemainingRequests(key);
    res.set('X-RateLimit-Remaining', remaining);
    next();
  } else {
    res.status(429).json({ error: 'Rate limit exceeded' });
  }
});
```

### 3. Multi-Tier Rate Limiting

```javascript
class MultiTierRateLimiter {
  constructor() {
    this.tiers = {
      free: { requests: 100, window: 3600000 },      // 100/hour
      premium: { requests: 1000, window: 3600000 },  // 1000/hour
      enterprise: { requests: 10000, window: 3600000 } // 10000/hour
    };
  }
  
  async checkLimit(userId, userTier) {
    const tier = this.tiers[userTier] || this.tiers.free;
    const key = `${userTier}:${userId}`;
    
    // Check against tier-specific limits
    return await this.isAllowed(key, tier.requests, tier.window);
  }
}

// Middleware with user-based limiting
app.use('/api', async (req, res, next) => {
  const user = await getUserFromToken(req.headers.authorization);
  const limiter = new MultiTierRateLimiter();
  
  if (await limiter.checkLimit(user.id, user.tier)) {
    next();
  } else {
    res.status(429).json({
      error: 'Rate limit exceeded for your tier',
      upgrade: '/pricing'
    });
  }
});
```

## API Security Best Practices

### 1. Authentication & Authorization

#### JWT Token Authentication
```javascript
const jwt = require('jsonwebtoken');

// Token generation
function generateToken(user) {
  return jwt.sign(
    { 
      userId: user.id, 
      role: user.role,
      permissions: user.permissions 
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: '1h',
      issuer: 'myapi.com',
      audience: 'api-clients'
    }
  );
}

// Token validation middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    req.user = user;
    next();
  });
}

// Role-based authorization
function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// Usage
app.get('/api/admin/users', authenticateToken, requireRole('admin'), (req, res) => {
  // Admin-only endpoint
});
```

#### API Key Authentication
```javascript
class APIKeyManager {
  constructor() {
    this.keys = new Map(); // In production, use database
  }
  
  generateKey(userId, permissions = []) {
    const key = crypto.randomBytes(32).toString('hex');
    const keyData = {
      userId,
      permissions,
      createdAt: new Date(),
      lastUsed: null,
      usageCount: 0
    };
    
    this.keys.set(key, keyData);
    return key;
  }
  
  validateKey(key) {
    const keyData = this.keys.get(key);
    if (!keyData) return null;
    
    keyData.lastUsed = new Date();
    keyData.usageCount++;
    
    return keyData;
  }
}

// API key middleware
const keyManager = new APIKeyManager();

function authenticateAPIKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  const keyData = keyManager.validateKey(apiKey);
  if (!keyData) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  req.apiKey = keyData;
  next();
}
```

### 2. Input Validation & Sanitization

```javascript
const Joi = require('joi');
const validator = require('validator');

// Schema validation
const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required(),
  firstName: Joi.string().min(1).max(50).required(),
  lastName: Joi.string().min(1).max(50).required(),
  age: Joi.number().integer().min(13).max(120)
});

// Validation middleware
function validateRequest(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    req.validatedData = value;
    next();
  };
}

// SQL injection prevention
function sanitizeInput(req, res, next) {
  // Sanitize string inputs
  for (const key in req.body) {
    if (typeof req.body[key] === 'string') {
      req.body[key] = validator.escape(req.body[key]);
    }
  }
  
  // Validate and sanitize query parameters
  for (const key in req.query) {
    if (typeof req.query[key] === 'string') {
      req.query[key] = validator.escape(req.query[key]);
    }
  }
  
  next();
}

// Usage
app.post('/api/users', 
  sanitizeInput,
  validateRequest(userSchema),
  (req, res) => {
    // Safe to use req.validatedData
  }
);
```

### 3. CORS Configuration

```javascript
const cors = require('cors');

// Basic CORS setup
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://myapp.com',
      'https://admin.myapp.com',
      'http://localhost:3000' // Development
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  exposedHeaders: ['X-RateLimit-Remaining', 'X-RateLimit-Reset']
};

app.use(cors(corsOptions));

// Preflight handling for complex requests
app.options('*', cors(corsOptions));
```

### 4. Security Headers

```javascript
const helmet = require('helmet');

// Security headers middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Custom security headers
app.use((req, res, next) => {
  res.set({
    'X-API-Version': '2.0',
    'X-Response-Time': Date.now() - req.startTime,
    'X-Request-ID': req.id
  });
  next();
});
```

### 5. Request Logging & Monitoring

```javascript
const winston = require('winston');

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'api.log' }),
    new winston.transports.Console()
  ]
});

// Request logging middleware
app.use((req, res, next) => {
  req.startTime = Date.now();
  req.id = crypto.randomUUID();
  
  logger.info('Request started', {
    requestId: req.id,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  // Log response
  const originalSend = res.send;
  res.send = function(data) {
    logger.info('Request completed', {
      requestId: req.id,
      statusCode: res.statusCode,
      responseTime: Date.now() - req.startTime,
      contentLength: data ? data.length : 0
    });
    
    originalSend.call(this, data);
  };
  
  next();
});
```

## Advanced Security Patterns

### 1. API Gateway Security

```yaml
# API Gateway configuration
apiVersion: networking.istio.io/v1alpha3
kind: Gateway
metadata:
  name: api-gateway
spec:
  selector:
    istio: ingressgateway
  servers:
  - port:
      number: 443
      name: https
      protocol: HTTPS
    tls:
      mode: SIMPLE
      credentialName: api-tls-secret
    hosts:
    - api.mycompany.com

---
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: api-authz
spec:
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/default/sa/api-client"]
  - to:
    - operation:
        methods: ["GET", "POST"]
  - when:
    - key: request.headers[x-api-key]
      values: ["*"]
```

### 2. OAuth 2.0 / OpenID Connect

```javascript
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2');

// OAuth2 strategy setup
passport.use('oauth2', new OAuth2Strategy({
  authorizationURL: 'https://auth.provider.com/oauth2/authorize',
  tokenURL: 'https://auth.provider.com/oauth2/token',
  clientID: process.env.OAUTH_CLIENT_ID,
  clientSecret: process.env.OAUTH_CLIENT_SECRET,
  callbackURL: '/auth/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const user = await getUserByOAuthProfile(profile);
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

// OAuth endpoints
app.get('/auth/login', passport.authenticate('oauth2'));

app.get('/auth/callback',
  passport.authenticate('oauth2', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/dashboard');
  }
);
```

### 3. Webhook Security

```javascript
const crypto = require('crypto');

// Webhook signature verification
function verifyWebhookSignature(req, res, next) {
  const signature = req.headers['x-webhook-signature'];
  const payload = JSON.stringify(req.body);
  const secret = process.env.WEBHOOK_SECRET;
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  if (signature !== `sha256=${expectedSignature}`) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }
  
  next();
}

// Webhook endpoint
app.post('/webhooks/payment',
  express.raw({ type: 'application/json' }),
  verifyWebhookSignature,
  (req, res) => {
    // Process webhook securely
    const event = JSON.parse(req.body);
    processPaymentEvent(event);
    res.status(200).send('OK');
  }
);
```

## Rate Limiting Headers

### Standard Headers

```http
# Response headers for rate limiting
HTTP/1.1 200 OK
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1609459200
X-RateLimit-Used: 1
Retry-After: 3600

# When rate limited
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1609459200
Retry-After: 3600

{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "API rate limit exceeded",
    "details": {
      "limit": 1000,
      "window": "1 hour",
      "retryAfter": 3600
    }
  }
}
```

### Implementation

```javascript
function addRateLimitHeaders(req, res, limit, remaining, resetTime) {
  res.set({
    'X-RateLimit-Limit': limit,
    'X-RateLimit-Remaining': Math.max(0, remaining),
    'X-RateLimit-Reset': Math.ceil(resetTime / 1000),
    'X-RateLimit-Used': limit - remaining
  });
  
  if (remaining <= 0) {
    res.set('Retry-After', Math.ceil((resetTime - Date.now()) / 1000));
  }
}
```

## Monitoring and Alerting

### 1. Rate Limiting Metrics

```javascript
const prometheus = require('prom-client');

// Metrics collection
const rateLimitCounter = new prometheus.Counter({
  name: 'api_rate_limit_exceeded_total',
  help: 'Total number of rate limit exceeded responses',
  labelNames: ['endpoint', 'client_type']
});

const requestDuration = new prometheus.Histogram({
  name: 'api_request_duration_seconds',
  help: 'API request duration in seconds',
  labelNames: ['method', 'endpoint', 'status_code']
});

// Middleware to collect metrics
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    
    requestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
    
    if (res.statusCode === 429) {
      rateLimitCounter
        .labels(req.route?.path || req.path, req.headers['user-agent'])
        .inc();
    }
  });
  
  next();
});
```

### 2. Security Event Monitoring

```javascript
// Security event logging
function logSecurityEvent(type, details, req) {
  const event = {
    timestamp: new Date().toISOString(),
    type: type,
    severity: getSeverity(type),
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    endpoint: req.path,
    details: details
  };
  
  logger.warn('Security event', event);
  
  // Send to security monitoring system
  if (event.severity === 'high') {
    alertSecurityTeam(event);
  }
}

// Usage in middleware
app.use((req, res, next) => {
  // Detect suspicious patterns
  if (isSuspiciousRequest(req)) {
    logSecurityEvent('suspicious_request', {
      reason: 'Multiple failed auth attempts',
      attempts: getFailedAttempts(req.ip)
    }, req);
  }
  
  next();
});
```

## Summary

Effective API security and rate limiting require:

1. **Multi-layered rate limiting** with appropriate algorithms
2. **Strong authentication** and authorization mechanisms
3. **Input validation** and sanitization
4. **Security headers** and CORS configuration
5. **Comprehensive monitoring** and alerting
6. **Regular security audits** and updates

Remember that security is an ongoing process, not a one-time implementation. Regularly review and update your security measures as threats evolve and your system grows.
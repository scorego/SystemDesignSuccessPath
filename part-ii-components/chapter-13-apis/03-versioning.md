# API Versioning & Backward Compatibility

API versioning is crucial for maintaining backward compatibility while evolving your API. This section covers different versioning strategies, their trade-offs, and practical implementation approaches.

## Why API Versioning Matters

### The Evolution Challenge

APIs evolve over time due to:
- **New features and functionality**
- **Bug fixes and improvements**
- **Performance optimizations**
- **Security enhancements**
- **Business requirement changes**

### Breaking vs Non-Breaking Changes

#### ✅ Non-Breaking Changes (Safe)
```json
// Adding optional fields
{
  "id": 123,
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2024-01-15T10:30:00Z"  // ✅ New optional field
}

// Adding new endpoints
GET /api/users/123/preferences  // ✅ New endpoint

// Adding optional query parameters
GET /api/users?includeInactive=true  // ✅ New optional parameter
```

#### ❌ Breaking Changes (Dangerous)
```json
// Removing fields
{
  "id": 123,
  "name": "John Doe"
  // ❌ "email" field removed
}

// Changing field types
{
  "id": "123",  // ❌ Changed from number to string
  "name": "John Doe"
}

// Changing field names
{
  "id": 123,
  "fullName": "John Doe"  // ❌ "name" renamed to "fullName"
}

// Changing URL structure
GET /api/v2/users/123  // ❌ Changed from /api/users/123
```

## Versioning Strategies

### 1. URL Path Versioning

Most common and explicit approach.

#### Implementation
```http
# Version in URL path
GET /api/v1/users/123
GET /api/v2/users/123
GET /api/v3/users/123

# Nested versioning for major changes
GET /api/v1/users/123
GET /api/v2/users/123/profile  # Different resource structure
```

#### Server Implementation (Express.js)
```javascript
// v1 routes
app.get('/api/v1/users/:id', (req, res) => {
  const user = getUserById(req.params.id);
  res.json({
    id: user.id,
    name: user.name,
    email: user.email
  });
});

// v2 routes - added more fields
app.get('/api/v2/users/:id', (req, res) => {
  const user = getUserById(req.params.id);
  res.json({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    profile: {
      avatar: user.avatar,
      bio: user.bio
    },
    createdAt: user.createdAt
  });
});
```

#### Pros and Cons
✅ **Pros:**
- Clear and explicit
- Easy to implement
- Good for major version differences
- Easy to cache different versions

❌ **Cons:**
- URL pollution
- Requires client updates for new versions
- Can lead to API sprawl

### 2. Header Versioning

Version specified in HTTP headers.

#### Implementation
```http
# Using custom header
GET /api/users/123
API-Version: v2

# Using Accept header
GET /api/users/123
Accept: application/vnd.myapi.v2+json

# Using custom Accept header
GET /api/users/123
Accept: application/json; version=2
```

#### Server Implementation
```javascript
app.get('/api/users/:id', (req, res) => {
  const version = req.headers['api-version'] || 'v1';
  const user = getUserById(req.params.id);
  
  switch (version) {
    case 'v1':
      res.json({
        id: user.id,
        name: user.name,
        email: user.email
      });
      break;
      
    case 'v2':
      res.json({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profile: user.profile
      });
      break;
      
    default:
      res.status(400).json({ error: 'Unsupported API version' });
  }
});
```

#### Pros and Cons
✅ **Pros:**
- Clean URLs
- Flexible versioning
- Can support multiple versions simultaneously

❌ **Cons:**
- Less visible than URL versioning
- Harder to test and debug
- Caching complexity

### 3. Query Parameter Versioning

Version specified as a query parameter.

#### Implementation
```http
GET /api/users/123?version=2
GET /api/users/123?v=2
GET /api/users/123?api-version=2.1
```

#### Server Implementation
```javascript
app.get('/api/users/:id', (req, res) => {
  const version = req.query.version || req.query.v || '1';
  const user = getUserById(req.params.id);
  
  if (version === '2') {
    res.json(transformToV2Format(user));
  } else {
    res.json(transformToV1Format(user));
  }
});
```

#### Pros and Cons
✅ **Pros:**
- Simple to implement
- Easy to test
- Optional (can default to latest)

❌ **Cons:**
- Can be accidentally omitted
- URL pollution
- Caching complexity

### 4. Content Negotiation

Using Accept header with media types.

#### Implementation
```http
# Version-specific media types
GET /api/users/123
Accept: application/vnd.myapi.user.v1+json

GET /api/users/123
Accept: application/vnd.myapi.user.v2+json

# With quality values for fallback
GET /api/users/123
Accept: application/vnd.myapi.user.v2+json; q=1.0,
        application/vnd.myapi.user.v1+json; q=0.8
```

#### Server Implementation
```javascript
app.get('/api/users/:id', (req, res) => {
  const acceptHeader = req.headers.accept;
  
  if (acceptHeader.includes('v2+json')) {
    res.set('Content-Type', 'application/vnd.myapi.user.v2+json');
    res.json(getUserV2Format(req.params.id));
  } else if (acceptHeader.includes('v1+json')) {
    res.set('Content-Type', 'application/vnd.myapi.user.v1+json');
    res.json(getUserV1Format(req.params.id));
  } else {
    res.status(406).json({ error: 'Unsupported media type' });
  }
});
```

#### Pros and Cons
✅ **Pros:**
- RESTful approach
- Supports content negotiation
- Clean URLs

❌ **Cons:**
- Complex to implement
- Less intuitive for developers
- Limited tooling support

## Versioning Best Practices

### 1. Semantic Versioning

Use semantic versioning (MAJOR.MINOR.PATCH) for clarity:

```http
# Major version: Breaking changes
GET /api/v1/users/123  # Original format
GET /api/v2/users/123  # Completely different response structure

# Minor version: New features, backward compatible
GET /api/v1.1/users/123  # Added optional fields
GET /api/v1.2/users/123  # Added new endpoints

# Patch version: Bug fixes
GET /api/v1.1.1/users/123  # Fixed data formatting issue
```

### 2. Version Lifecycle Management

#### Version Support Policy
```javascript
// Version support matrix
const VERSION_SUPPORT = {
  'v1': {
    status: 'deprecated',
    deprecationDate: '2024-01-01',
    sunsetDate: '2024-06-01',
    supportLevel: 'security-fixes-only'
  },
  'v2': {
    status: 'stable',
    releaseDate: '2023-06-01',
    supportLevel: 'full-support'
  },
  'v3': {
    status: 'beta',
    releaseDate: '2024-01-15',
    supportLevel: 'limited-support'
  }
};
```

#### Deprecation Headers
```http
# Response headers for deprecated versions
HTTP/1.1 200 OK
Deprecation: true
Sunset: Sat, 01 Jun 2024 00:00:00 GMT
Link: </api/v2/users/123>; rel="successor-version"
Warning: 299 - "API version v1 is deprecated. Please migrate to v2."

{
  "id": 123,
  "name": "John Doe",
  "_meta": {
    "version": "v1",
    "deprecated": true,
    "migration_guide": "https://docs.api.com/migration/v1-to-v2"
  }
}
```

### 3. Backward Compatibility Strategies

#### Field Evolution Pattern
```json
// v1: Simple name field
{
  "id": 123,
  "name": "John Doe"
}

// v2: Split name, but maintain backward compatibility
{
  "id": 123,
  "name": "John Doe",        // ✅ Keep for backward compatibility
  "firstName": "John",       // ✅ New detailed fields
  "lastName": "Doe"
}

// v3: Deprecate old field with clear migration path
{
  "id": 123,
  "name": "John Doe",        // ⚠️ Deprecated but still present
  "firstName": "John",
  "lastName": "Doe",
  "_deprecated": {
    "name": "Use firstName and lastName instead"
  }
}
```

#### Default Value Strategy
```json
// Adding new required field with sensible defaults
{
  "id": 123,
  "name": "John Doe",
  "status": "active",        // ✅ New field with default value
  "preferences": {           // ✅ New nested object with defaults
    "theme": "light",
    "notifications": true
  }
}
```

### 4. Client-Side Version Management

#### Version Detection
```javascript
// Client library with version detection
class APIClient {
  constructor(baseURL, version = 'v2') {
    this.baseURL = baseURL;
    this.version = version;
  }
  
  async getUser(id) {
    const response = await fetch(`${this.baseURL}/api/${this.version}/users/${id}`);
    
    // Handle version-specific response format
    const data = await response.json();
    return this.normalizeUserData(data);
  }
  
  normalizeUserData(data) {
    // Handle different response formats
    if (this.version === 'v1') {
      return {
        id: data.id,
        firstName: data.name.split(' ')[0],
        lastName: data.name.split(' ')[1],
        email: data.email
      };
    }
    
    return data; // v2+ format
  }
}
```

#### Graceful Degradation
```javascript
// Client with fallback support
async function getUser(id) {
  try {
    // Try latest version first
    return await apiClient.v3.getUser(id);
  } catch (error) {
    if (error.status === 404 && error.message.includes('version')) {
      // Fall back to older version
      console.warn('API v3 not available, falling back to v2');
      return await apiClient.v2.getUser(id);
    }
    throw error;
  }
}
```

## Advanced Versioning Patterns

### 1. Feature Flags for Gradual Rollout

```javascript
// Server-side feature flags
app.get('/api/users/:id', (req, res) => {
  const user = getUserById(req.params.id);
  const clientId = req.headers['x-client-id'];
  
  // Check if client should get new format
  if (featureFlags.isEnabled('new-user-format', clientId)) {
    res.json(transformToNewFormat(user));
  } else {
    res.json(transformToLegacyFormat(user));
  }
});
```

### 2. Schema Evolution with Transformers

```javascript
// Schema transformation pipeline
class SchemaTransformer {
  static transforms = {
    'v1-to-v2': (data) => ({
      ...data,
      firstName: data.name.split(' ')[0],
      lastName: data.name.split(' ')[1]
    }),
    
    'v2-to-v3': (data) => ({
      ...data,
      profile: {
        avatar: data.avatar,
        bio: data.bio
      }
    })
  };
  
  static transform(data, fromVersion, toVersion) {
    const transformKey = `${fromVersion}-to-${toVersion}`;
    const transformer = this.transforms[transformKey];
    
    return transformer ? transformer(data) : data;
  }
}
```

### 3. API Gateway Versioning

```yaml
# API Gateway configuration
apiVersion: v1
kind: APIGateway
spec:
  routes:
    - path: /api/v1/users/*
      backend: user-service-v1
      
    - path: /api/v2/users/*
      backend: user-service-v2
      
    - path: /api/users/*
      backend: user-service-v2  # Default to latest
      headers:
        - name: API-Version
          value: v1
          backend: user-service-v1
```

## Migration Strategies

### 1. Big Bang Migration

```javascript
// Complete version switch
// Day 1: All clients use v1
// Day 2: All clients must use v2

// Not recommended for production systems
```

### 2. Gradual Migration

```javascript
// Phase 1: Deploy v2 alongside v1
app.use('/api/v1', v1Routes);
app.use('/api/v2', v2Routes);

// Phase 2: Migrate clients gradually
// Monitor usage metrics

// Phase 3: Deprecate v1
// Add deprecation warnings

// Phase 4: Remove v1
// After all clients migrated
```

### 3. Canary Deployment

```javascript
// Route percentage of traffic to new version
app.use('/api/users', (req, res, next) => {
  const clientId = req.headers['x-client-id'];
  const canaryPercentage = 10; // 10% of traffic
  
  if (shouldUseCanary(clientId, canaryPercentage)) {
    req.apiVersion = 'v2';
  } else {
    req.apiVersion = 'v1';
  }
  
  next();
});
```

## Monitoring and Analytics

### 1. Version Usage Tracking

```javascript
// Track version usage
app.use((req, res, next) => {
  const version = extractVersion(req);
  
  metrics.increment('api.version.usage', {
    version: version,
    endpoint: req.path,
    client: req.headers['user-agent']
  });
  
  next();
});
```

### 2. Migration Progress Monitoring

```javascript
// Dashboard metrics
const migrationMetrics = {
  v1Usage: 25000,  // requests/day
  v2Usage: 75000,  // requests/day
  migrationProgress: 75%, // percentage of clients on v2
  deprecationDeadline: '2024-06-01'
};
```

## Common Pitfalls and Solutions

### ❌ Pitfall 1: Too Many Versions
```javascript
// Bad: Supporting too many versions
/api/v1/users
/api/v1.1/users
/api/v1.2/users
/api/v2/users
/api/v2.1/users
// ... maintenance nightmare
```

✅ **Solution: Version Consolidation**
```javascript
// Good: Support only 2-3 versions max
/api/v1/users    // Legacy, deprecated
/api/v2/users    // Current stable
/api/v3/users    // Next version (beta)
```

### ❌ Pitfall 2: Breaking Changes in Minor Versions
```javascript
// Bad: Breaking change in minor version
// v2.1 -> v2.2 removes required field
```

✅ **Solution: Semantic Versioning**
```javascript
// Good: Breaking changes only in major versions
// v2.x -> v3.0 for breaking changes
```

### ❌ Pitfall 3: No Migration Path
```javascript
// Bad: No guidance for migration
"API v1 is deprecated. Use v2."
```

✅ **Solution: Clear Migration Documentation**
```json
{
  "migration": {
    "from": "v1",
    "to": "v2",
    "changes": [
      {
        "field": "name",
        "action": "split",
        "newFields": ["firstName", "lastName"]
      }
    ],
    "guide": "https://docs.api.com/migration/v1-to-v2"
  }
}
```

## Summary

Effective API versioning requires:

1. **Clear versioning strategy** (URL path recommended for simplicity)
2. **Semantic versioning** for predictable changes
3. **Backward compatibility** whenever possible
4. **Gradual migration** with proper deprecation notices
5. **Monitoring and analytics** to track adoption
6. **Clear documentation** and migration guides

Choose your versioning strategy based on your specific needs, but prioritize simplicity and developer experience. Remember that the best API version is the one that doesn't break existing clients while enabling future growth.
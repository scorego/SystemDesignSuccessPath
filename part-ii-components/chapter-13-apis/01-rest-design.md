# REST API Design Principles & Best Practices

REST (Representational State Transfer) is an architectural style that defines a set of constraints for creating web services. RESTful APIs are widely adopted due to their simplicity, scalability, and alignment with HTTP protocols.

## Core REST Principles

### 1. Stateless Communication

Each request must contain all information needed to process it. The server doesn't store client context between requests.

**Benefits:**
- Improved scalability (no server-side session state)
- Better reliability (no session state to lose)
- Easier load balancing

**Example:**
```http
# Good: All information in the request
GET /api/users/123/orders?status=pending&page=2
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Bad: Relies on server-side session state
GET /api/orders?page=2
Cookie: sessionId=abc123
```

### 2. Resource-Based URLs

URLs should represent resources (nouns), not actions (verbs). Use HTTP methods to define operations.

**Resource Naming Best Practices:**

```http
# Good: Resource-based URLs
GET    /api/users              # Get all users
GET    /api/users/123          # Get specific user
POST   /api/users              # Create new user
PUT    /api/users/123          # Update entire user
PATCH  /api/users/123          # Partial update
DELETE /api/users/123          # Delete user

# Bad: Action-based URLs
GET    /api/getUsers
POST   /api/createUser
POST   /api/updateUser/123
POST   /api/deleteUser/123
```

### 3. HTTP Methods and Status Codes

Use appropriate HTTP methods and return meaningful status codes.

**HTTP Methods:**

| Method | Purpose | Idempotent | Safe |
|--------|---------|------------|------|
| GET | Retrieve resource | ✅ | ✅ |
| POST | Create resource | ❌ | ❌ |
| PUT | Update/Replace resource | ✅ | ❌ |
| PATCH | Partial update | ❌ | ❌ |
| DELETE | Remove resource | ✅ | ❌ |

**Common Status Codes:**

```http
# Success Responses
200 OK              # Successful GET, PUT, PATCH
201 Created         # Successful POST
204 No Content      # Successful DELETE

# Client Error Responses
400 Bad Request     # Invalid request syntax
401 Unauthorized    # Authentication required
403 Forbidden       # Access denied
404 Not Found       # Resource doesn't exist
409 Conflict        # Resource conflict
422 Unprocessable Entity # Validation errors

# Server Error Responses
500 Internal Server Error
502 Bad Gateway
503 Service Unavailable
```

## REST API Design Best Practices

### 1. Consistent Resource Naming

**Use Plural Nouns:**
```http
# Good
GET /api/users
GET /api/orders
GET /api/products

# Avoid
GET /api/user
GET /api/order
GET /api/product
```

**Hierarchical Resources:**
```http
# User's orders
GET /api/users/123/orders

# Specific order for a user
GET /api/users/123/orders/456

# Comments on a specific post
GET /api/posts/789/comments
```

### 2. Request and Response Design

**Request Example:**
```json
POST /api/users
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "role": "developer"
}
```

**Response Example:**
```json
HTTP/1.1 201 Created
Content-Type: application/json
Location: /api/users/123

{
  "id": 123,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "role": "developer",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "_links": {
    "self": "/api/users/123",
    "orders": "/api/users/123/orders"
  }
}
```

### 3. Error Handling

**Consistent Error Format:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid data",
    "details": [
      {
        "field": "email",
        "message": "Email format is invalid"
      },
      {
        "field": "age",
        "message": "Age must be between 18 and 120"
      }
    ],
    "timestamp": "2024-01-15T10:30:00Z",
    "path": "/api/users"
  }
}
```

### 4. Pagination

**Offset-Based Pagination:**
```http
GET /api/users?page=2&limit=20

Response:
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrevious": true
  },
  "_links": {
    "first": "/api/users?page=1&limit=20",
    "previous": "/api/users?page=1&limit=20",
    "next": "/api/users?page=3&limit=20",
    "last": "/api/users?page=8&limit=20"
  }
}
```

**Cursor-Based Pagination (for large datasets):**
```http
GET /api/users?cursor=eyJpZCI6MTIzfQ&limit=20

Response:
{
  "data": [...],
  "pagination": {
    "cursor": "eyJpZCI6MTQzfQ",
    "hasNext": true,
    "limit": 20
  },
  "_links": {
    "next": "/api/users?cursor=eyJpZCI6MTQzfQ&limit=20"
  }
}
```

### 5. Filtering and Sorting

**Query Parameters for Filtering:**
```http
# Filter by status and role
GET /api/users?status=active&role=developer

# Date range filtering
GET /api/orders?createdAfter=2024-01-01&createdBefore=2024-01-31

# Search functionality
GET /api/products?search=laptop&category=electronics
```

**Sorting:**
```http
# Single field sorting
GET /api/users?sort=lastName

# Multiple field sorting
GET /api/users?sort=lastName,firstName

# Descending order
GET /api/users?sort=-createdAt,lastName
```

### 6. Field Selection

Allow clients to specify which fields they need:

```http
# Select specific fields
GET /api/users?fields=id,firstName,lastName,email

# Exclude sensitive fields
GET /api/users?exclude=password,ssn
```

## Advanced REST Patterns

### 1. HATEOAS (Hypermedia as the Engine of Application State)

Include links to related resources and possible actions:

```json
{
  "id": 123,
  "firstName": "John",
  "lastName": "Doe",
  "status": "active",
  "_links": {
    "self": "/api/users/123",
    "orders": "/api/users/123/orders",
    "edit": "/api/users/123",
    "deactivate": "/api/users/123/deactivate"
  },
  "_actions": {
    "update": {
      "method": "PUT",
      "href": "/api/users/123",
      "fields": ["firstName", "lastName", "email"]
    }
  }
}
```

### 2. Bulk Operations

**Bulk Create:**
```json
POST /api/users/bulk
{
  "users": [
    {"firstName": "John", "lastName": "Doe", "email": "john@example.com"},
    {"firstName": "Jane", "lastName": "Smith", "email": "jane@example.com"}
  ]
}

Response:
{
  "created": [
    {"id": 123, "firstName": "John", "lastName": "Doe"},
    {"id": 124, "firstName": "Jane", "lastName": "Smith"}
  ],
  "errors": []
}
```

**Bulk Update:**
```json
PATCH /api/users/bulk
{
  "updates": [
    {"id": 123, "status": "inactive"},
    {"id": 124, "role": "admin"}
  ]
}
```

### 3. Async Operations

For long-running operations, use async patterns:

```http
POST /api/reports/generate
{
  "type": "user_activity",
  "dateRange": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  }
}

Response:
HTTP/1.1 202 Accepted
{
  "jobId": "job_123",
  "status": "processing",
  "estimatedCompletion": "2024-01-15T10:35:00Z",
  "_links": {
    "status": "/api/jobs/job_123",
    "cancel": "/api/jobs/job_123/cancel"
  }
}
```

Check status:
```http
GET /api/jobs/job_123

Response:
{
  "jobId": "job_123",
  "status": "completed",
  "result": {
    "downloadUrl": "/api/reports/report_456.pdf",
    "expiresAt": "2024-01-22T10:30:00Z"
  }
}
```

## REST API Documentation

### OpenAPI/Swagger Specification

```yaml
openapi: 3.0.0
info:
  title: User Management API
  version: 1.0.0
  description: API for managing users and their data

paths:
  /users:
    get:
      summary: Get all users
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: List of users
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/User'
                  pagination:
                    $ref: '#/components/schemas/Pagination'

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
        firstName:
          type: string
        lastName:
          type: string
        email:
          type: string
          format: email
```

## Performance Considerations

### 1. Caching Headers

```http
# Cache control
Cache-Control: public, max-age=3600

# ETags for conditional requests
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"

# Last modified
Last-Modified: Wed, 15 Jan 2024 10:30:00 GMT
```

### 2. Compression

```http
# Request compression support
Accept-Encoding: gzip, deflate, br

# Response with compression
Content-Encoding: gzip
```

### 3. Connection Management

```http
# Keep connections alive
Connection: keep-alive

# HTTP/2 for multiplexing
```

## Common REST Anti-Patterns

### ❌ What to Avoid

1. **Ignoring HTTP Methods:**
   ```http
   # Bad: Using GET for state changes
   GET /api/users/123/delete
   
   # Good: Use appropriate method
   DELETE /api/users/123
   ```

2. **Inconsistent Naming:**
   ```http
   # Bad: Mixed conventions
   GET /api/users
   GET /api/getUserOrders/123
   
   # Good: Consistent resource naming
   GET /api/users
   GET /api/users/123/orders
   ```

3. **Overly Chatty APIs:**
   ```http
   # Bad: Multiple requests needed
   GET /api/users/123
   GET /api/users/123/profile
   GET /api/users/123/preferences
   
   # Good: Include related data or use field selection
   GET /api/users/123?include=profile,preferences
   ```

## Summary

REST API design is about creating intuitive, consistent, and scalable interfaces. Key principles include:

- **Stateless communication** for scalability
- **Resource-based URLs** with appropriate HTTP methods
- **Consistent error handling** and status codes
- **Proper pagination** and filtering
- **Clear documentation** and examples

Following these best practices ensures your APIs are easy to use, maintain, and scale as your system grows.
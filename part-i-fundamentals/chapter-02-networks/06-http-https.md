# HTTP/HTTPS Protocols

## Introduction

HTTP (HyperText Transfer Protocol) and HTTPS (HTTP Secure) are the foundation of web communication and modern distributed systems. Understanding these protocols is essential for system design because they define how clients and servers communicate, affect performance and security, and influence architectural decisions.

HTTP is an application-layer protocol that enables communication between web browsers and servers, but it's used far beyond just web browsing. Modern microservices, APIs, and distributed systems rely heavily on HTTP/HTTPS for service-to-service communication.

## HTTP Fundamentals

### HTTP Request-Response Model

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    
    C->>S: HTTP Request
    Note over C,S: Method, URL, Headers, Body
    S->>C: HTTP Response
    Note over C,S: Status Code, Headers, Body
```

### HTTP Request Structure

```http
GET /api/users/123 HTTP/1.1
Host: api.example.com
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
Accept: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Connection: keep-alive
Cache-Control: no-cache

[Optional Request Body]
```

**Request Components:**
1. **Request Line**: Method, URL, HTTP version
2. **Headers**: Metadata about the request
3. **Body**: Optional data (for POST, PUT, PATCH)

### HTTP Response Structure

```http
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 156
Cache-Control: max-age=3600
Set-Cookie: session_id=abc123; HttpOnly; Secure
Connection: keep-alive

{
  "id": 123,
  "name": "John Doe",
  "email": "john@example.com",
  "created_at": "2023-01-15T10:30:00Z"
}
```

**Response Components:**
1. **Status Line**: HTTP version, status code, reason phrase
2. **Headers**: Metadata about the response
3. **Body**: Response data

## HTTP Methods

### Standard HTTP Methods

#### GET - Retrieve Data
```http
GET /api/users HTTP/1.1
Host: api.example.com
Accept: application/json

# Response
HTTP/1.1 200 OK
Content-Type: application/json

[
  {"id": 1, "name": "Alice"},
  {"id": 2, "name": "Bob"}
]
```

**Characteristics:**
- Safe: No side effects on server
- Idempotent: Multiple identical requests have same effect
- Cacheable: Responses can be cached

#### POST - Create New Resource
```http
POST /api/users HTTP/1.1
Host: api.example.com
Content-Type: application/json
Content-Length: 45

{
  "name": "Charlie",
  "email": "charlie@example.com"
}

# Response
HTTP/1.1 201 Created
Location: /api/users/123
Content-Type: application/json

{
  "id": 123,
  "name": "Charlie",
  "email": "charlie@example.com"
}
```

**Characteristics:**
- Not safe: Creates/modifies server state
- Not idempotent: Multiple requests create multiple resources
- Not cacheable: Responses typically not cached

#### PUT - Update/Replace Resource
```http
PUT /api/users/123 HTTP/1.1
Host: api.example.com
Content-Type: application/json

{
  "name": "Charlie Smith",
  "email": "charlie.smith@example.com"
}

# Response
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": 123,
  "name": "Charlie Smith",
  "email": "charlie.smith@example.com"
}
```

**Characteristics:**
- Not safe: Modifies server state
- Idempotent: Multiple identical requests have same effect
- Not cacheable: Responses typically not cached

#### PATCH - Partial Update
```http
PATCH /api/users/123 HTTP/1.1
Host: api.example.com
Content-Type: application/json

{
  "email": "new.email@example.com"
}

# Response
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": 123,
  "name": "Charlie Smith",
  "email": "new.email@example.com"
}
```

#### DELETE - Remove Resource
```http
DELETE /api/users/123 HTTP/1.1
Host: api.example.com

# Response
HTTP/1.1 204 No Content
```

**Characteristics:**
- Not safe: Modifies server state
- Idempotent: Multiple deletions have same effect
- Not cacheable: Responses not cached

### HTTP Method Implementation Example

```python
from flask import Flask, request, jsonify
import json

app = Flask(__name__)

# In-memory data store (use database in production)
users = {
    1: {"id": 1, "name": "Alice", "email": "alice@example.com"},
    2: {"id": 2, "name": "Bob", "email": "bob@example.com"}
}
next_id = 3

@app.route('/api/users', methods=['GET'])
def get_users():
    """GET /api/users - Retrieve all users"""
    # Support query parameters for filtering
    name_filter = request.args.get('name')
    
    if name_filter:
        filtered_users = [
            user for user in users.values() 
            if name_filter.lower() in user['name'].lower()
        ]
        return jsonify(filtered_users)
    
    return jsonify(list(users.values()))

@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """GET /api/users/{id} - Retrieve specific user"""
    if user_id not in users:
        return jsonify({"error": "User not found"}), 404
    
    return jsonify(users[user_id])

@app.route('/api/users', methods=['POST'])
def create_user():
    """POST /api/users - Create new user"""
    global next_id
    
    # Validate request
    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json"}), 400
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'email']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    # Create new user
    new_user = {
        "id": next_id,
        "name": data['name'],
        "email": data['email']
    }
    
    users[next_id] = new_user
    next_id += 1
    
    # Return 201 Created with Location header
    response = jsonify(new_user)
    response.status_code = 201
    response.headers['Location'] = f'/api/users/{new_user["id"]}'
    
    return response

@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """PUT /api/users/{id} - Update entire user resource"""
    if user_id not in users:
        return jsonify({"error": "User not found"}), 404
    
    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json"}), 400
    
    data = request.get_json()
    
    # PUT replaces entire resource
    updated_user = {
        "id": user_id,
        "name": data.get('name', ''),
        "email": data.get('email', '')
    }
    
    users[user_id] = updated_user
    return jsonify(updated_user)

@app.route('/api/users/<int:user_id>', methods=['PATCH'])
def patch_user(user_id):
    """PATCH /api/users/{id} - Partial update of user"""
    if user_id not in users:
        return jsonify({"error": "User not found"}), 404
    
    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json"}), 400
    
    data = request.get_json()
    user = users[user_id]
    
    # PATCH updates only provided fields
    if 'name' in data:
        user['name'] = data['name']
    if 'email' in data:
        user['email'] = data['email']
    
    return jsonify(user)

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """DELETE /api/users/{id} - Delete user"""
    if user_id not in users:
        return jsonify({"error": "User not found"}), 404
    
    del users[user_id]
    
    # Return 204 No Content for successful deletion
    return '', 204

# Error handlers
@app.errorhandler(400)
def bad_request(error):
    return jsonify({"error": "Bad request"}), 400

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Resource not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=8080)
```

## HTTP Status Codes

### Status Code Categories

#### 1xx - Informational
- **100 Continue**: Server received request headers, client should send body
- **101 Switching Protocols**: Server switching to different protocol

#### 2xx - Success
- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **202 Accepted**: Request accepted for processing
- **204 No Content**: Request successful, no content to return
- **206 Partial Content**: Partial content delivered (range requests)

#### 3xx - Redirection
- **301 Moved Permanently**: Resource permanently moved
- **302 Found**: Resource temporarily moved
- **304 Not Modified**: Resource not modified since last request
- **307 Temporary Redirect**: Temporary redirect, method preserved
- **308 Permanent Redirect**: Permanent redirect, method preserved

#### 4xx - Client Error
- **400 Bad Request**: Invalid request syntax
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Server understood but refuses to authorize
- **404 Not Found**: Resource not found
- **405 Method Not Allowed**: HTTP method not supported
- **409 Conflict**: Request conflicts with current state
- **429 Too Many Requests**: Rate limit exceeded

#### 5xx - Server Error
- **500 Internal Server Error**: Generic server error
- **502 Bad Gateway**: Invalid response from upstream server
- **503 Service Unavailable**: Server temporarily unavailable
- **504 Gateway Timeout**: Upstream server timeout
- **507 Insufficient Storage**: Server cannot store representation

### Status Code Implementation

```python
class HTTPStatusHandler:
    def __init__(self):
        self.status_codes = {
            # Success codes
            200: "OK",
            201: "Created", 
            202: "Accepted",
            204: "No Content",
            
            # Redirection codes
            301: "Moved Permanently",
            302: "Found",
            304: "Not Modified",
            
            # Client error codes
            400: "Bad Request",
            401: "Unauthorized",
            403: "Forbidden",
            404: "Not Found",
            405: "Method Not Allowed",
            409: "Conflict",
            429: "Too Many Requests",
            
            # Server error codes
            500: "Internal Server Error",
            502: "Bad Gateway",
            503: "Service Unavailable",
            504: "Gateway Timeout"
        }
    
    def get_appropriate_status(self, operation_result):
        """Determine appropriate HTTP status code based on operation result"""
        if operation_result['success']:
            if operation_result['operation'] == 'create':
                return 201  # Created
            elif operation_result['operation'] == 'delete':
                return 204  # No Content
            elif operation_result['operation'] == 'read':
                if operation_result.get('modified_since_last_request'):
                    return 200  # OK
                else:
                    return 304  # Not Modified
            else:
                return 200  # OK
        else:
            error_type = operation_result.get('error_type')
            
            if error_type == 'validation_error':
                return 400  # Bad Request
            elif error_type == 'authentication_required':
                return 401  # Unauthorized
            elif error_type == 'permission_denied':
                return 403  # Forbidden
            elif error_type == 'resource_not_found':
                return 404  # Not Found
            elif error_type == 'method_not_supported':
                return 405  # Method Not Allowed
            elif error_type == 'resource_conflict':
                return 409  # Conflict
            elif error_type == 'rate_limit_exceeded':
                return 429  # Too Many Requests
            elif error_type == 'external_service_error':
                return 502  # Bad Gateway
            elif error_type == 'service_unavailable':
                return 503  # Service Unavailable
            elif error_type == 'timeout':
                return 504  # Gateway Timeout
            else:
                return 500  # Internal Server Error
    
    def create_error_response(self, status_code, message=None, details=None):
        """Create standardized error response"""
        response = {
            "error": {
                "code": status_code,
                "message": message or self.status_codes.get(status_code, "Unknown Error"),
                "timestamp": datetime.now().isoformat()
            }
        }
        
        if details:
            response["error"]["details"] = details
        
        return response

# Example usage
status_handler = HTTPStatusHandler()

# Successful operations
create_result = {"success": True, "operation": "create"}
status_code = status_handler.get_appropriate_status(create_result)
print(f"Create operation status: {status_code}")  # 201

# Error operations
error_result = {
    "success": False, 
    "error_type": "validation_error",
    "message": "Invalid email format"
}
status_code = status_handler.get_appropriate_status(error_result)
error_response = status_handler.create_error_response(status_code, error_result['message'])
print(f"Error response: {error_response}")
```

## HTTP Headers

### Common Request Headers

#### Content Headers
```http
Content-Type: application/json
Content-Length: 156
Content-Encoding: gzip
Content-Language: en-US
```

#### Authentication Headers
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=
API-Key: your-api-key-here
```

#### Cache Control Headers
```http
Cache-Control: no-cache
Cache-Control: max-age=3600
If-None-Match: "etag-value"
If-Modified-Since: Wed, 21 Oct 2015 07:28:00 GMT
```

#### Client Information Headers
```http
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
Accept: application/json, text/plain, */*
Accept-Language: en-US,en;q=0.9
Accept-Encoding: gzip, deflate, br
```

### Common Response Headers

#### Content Headers
```http
Content-Type: application/json; charset=utf-8
Content-Length: 1234
Content-Encoding: gzip
Last-Modified: Wed, 21 Oct 2015 07:28:00 GMT
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
```

#### Cache Control Headers
```http
Cache-Control: public, max-age=3600
Expires: Thu, 01 Dec 2023 16:00:00 GMT
Vary: Accept-Encoding, User-Agent
```

#### Security Headers
```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

### Header Management Implementation

```python
class HTTPHeaderManager:
    def __init__(self):
        self.default_headers = {
            'Server': 'MyAPI/1.0',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block'
        }
        
        self.cors_headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400'
        }
    
    def add_security_headers(self, headers):
        """Add security headers to response"""
        security_headers = {
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Content-Security-Policy': "default-src 'self'",
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
        }
        
        headers.update(security_headers)
        return headers
    
    def add_cache_headers(self, headers, cache_strategy):
        """Add appropriate cache headers"""
        if cache_strategy == 'no_cache':
            headers.update({
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            })
        elif cache_strategy == 'short_cache':
            headers.update({
                'Cache-Control': 'public, max-age=300',  # 5 minutes
                'Vary': 'Accept-Encoding'
            })
        elif cache_strategy == 'long_cache':
            headers.update({
                'Cache-Control': 'public, max-age=31536000',  # 1 year
                'Vary': 'Accept-Encoding'
            })
        
        return headers
    
    def add_cors_headers(self, headers, origin=None):
        """Add CORS headers for cross-origin requests"""
        cors_headers = self.cors_headers.copy()
        
        if origin:
            # Specific origin instead of wildcard
            cors_headers['Access-Control-Allow-Origin'] = origin
            cors_headers['Access-Control-Allow-Credentials'] = 'true'
        
        headers.update(cors_headers)
        return headers
    
    def generate_etag(self, content):
        """Generate ETag for content"""
        import hashlib
        
        if isinstance(content, str):
            content = content.encode('utf-8')
        
        return f'"{hashlib.md5(content).hexdigest()}"'
    
    def check_conditional_request(self, request_headers, resource_etag, last_modified):
        """Check if conditional request can return 304 Not Modified"""
        # Check If-None-Match header
        if_none_match = request_headers.get('If-None-Match')
        if if_none_match and if_none_match == resource_etag:
            return True
        
        # Check If-Modified-Since header
        if_modified_since = request_headers.get('If-Modified-Since')
        if if_modified_since and last_modified:
            from datetime import datetime
            try:
                client_date = datetime.strptime(if_modified_since, '%a, %d %b %Y %H:%M:%S GMT')
                if last_modified <= client_date:
                    return True
            except ValueError:
                pass
        
        return False

# Example usage
header_manager = HTTPHeaderManager()

# Prepare response headers
response_headers = {}
response_headers.update(header_manager.default_headers)

# Add security headers
response_headers = header_manager.add_security_headers(response_headers)

# Add cache headers for API response
response_headers = header_manager.add_cache_headers(response_headers, 'short_cache')

# Add CORS headers
response_headers = header_manager.add_cors_headers(response_headers, 'https://example.com')

print("Generated Response Headers:")
for header, value in response_headers.items():
    print(f"{header}: {value}")
```

## HTTPS and TLS/SSL

### HTTPS Overview

HTTPS = HTTP + TLS/SSL encryption

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    
    Note over C,S: TLS Handshake
    C->>S: Client Hello
    S->>C: Server Hello + Certificate
    C->>S: Key Exchange + Change Cipher
    S->>C: Change Cipher + Finished
    
    Note over C,S: Encrypted HTTP Communication
    C->>S: Encrypted HTTP Request
    S->>C: Encrypted HTTP Response
```

### TLS Handshake Process

1. **Client Hello**: Client sends supported cipher suites and TLS version
2. **Server Hello**: Server selects cipher suite and sends certificate
3. **Certificate Verification**: Client verifies server certificate
4. **Key Exchange**: Client and server establish shared encryption keys
5. **Finished**: Both parties confirm successful handshake
6. **Encrypted Communication**: All HTTP traffic is now encrypted

### SSL/TLS Certificate Management

```python
import ssl
import socket
import datetime
from cryptography import x509
from cryptography.hazmat.backends import default_backend

class SSLCertificateManager:
    def __init__(self):
        self.certificates = {}
    
    def check_certificate(self, hostname, port=443):
        """Check SSL certificate for a hostname"""
        try:
            # Create SSL context
            context = ssl.create_default_context()
            
            # Connect and get certificate
            with socket.create_connection((hostname, port), timeout=10) as sock:
                with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                    cert_der = ssock.getpeercert(binary_form=True)
                    cert_pem = ssock.getpeercert()
            
            # Parse certificate
            cert = x509.load_der_x509_certificate(cert_der, default_backend())
            
            return {
                'hostname': hostname,
                'valid': True,
                'subject': cert_pem['subject'],
                'issuer': cert_pem['issuer'],
                'not_before': cert.not_valid_before,
                'not_after': cert.not_valid_after,
                'days_until_expiry': (cert.not_valid_after - datetime.datetime.now()).days,
                'serial_number': str(cert.serial_number),
                'signature_algorithm': cert.signature_algorithm_oid._name,
                'san_list': self._extract_san_list(cert)
            }
        
        except Exception as e:
            return {
                'hostname': hostname,
                'valid': False,
                'error': str(e)
            }
    
    def _extract_san_list(self, cert):
        """Extract Subject Alternative Names from certificate"""
        try:
            san_extension = cert.extensions.get_extension_for_oid(
                x509.oid.ExtensionOID.SUBJECT_ALTERNATIVE_NAME
            )
            return [name.value for name in san_extension.value]
        except x509.ExtensionNotFound:
            return []
    
    def validate_certificate_chain(self, hostname, port=443):
        """Validate entire certificate chain"""
        try:
            context = ssl.create_default_context()
            
            with socket.create_connection((hostname, port), timeout=10) as sock:
                with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                    # Get certificate chain
                    cert_chain = ssock.getpeercert_chain()
                    
                    chain_info = []
                    for i, cert_der in enumerate(cert_chain):
                        cert = x509.load_der_x509_certificate(cert_der, default_backend())
                        
                        chain_info.append({
                            'level': i,
                            'subject': cert.subject.rfc4514_string(),
                            'issuer': cert.issuer.rfc4514_string(),
                            'not_after': cert.not_valid_after,
                            'is_ca': self._is_ca_certificate(cert)
                        })
                    
                    return {
                        'valid': True,
                        'chain_length': len(chain_info),
                        'certificates': chain_info
                    }
        
        except Exception as e:
            return {
                'valid': False,
                'error': str(e)
            }
    
    def _is_ca_certificate(self, cert):
        """Check if certificate is a CA certificate"""
        try:
            basic_constraints = cert.extensions.get_extension_for_oid(
                x509.oid.ExtensionOID.BASIC_CONSTRAINTS
            )
            return basic_constraints.value.ca
        except x509.ExtensionNotFound:
            return False
    
    def monitor_certificate_expiry(self, hostnames, warning_days=30):
        """Monitor certificate expiry for multiple hostnames"""
        expiry_report = {
            'total_certificates': len(hostnames),
            'expiring_soon': [],
            'expired': [],
            'valid': []
        }
        
        for hostname in hostnames:
            cert_info = self.check_certificate(hostname)
            
            if cert_info['valid']:
                days_until_expiry = cert_info['days_until_expiry']
                
                if days_until_expiry < 0:
                    expiry_report['expired'].append({
                        'hostname': hostname,
                        'days_expired': abs(days_until_expiry)
                    })
                elif days_until_expiry <= warning_days:
                    expiry_report['expiring_soon'].append({
                        'hostname': hostname,
                        'days_until_expiry': days_until_expiry
                    })
                else:
                    expiry_report['valid'].append({
                        'hostname': hostname,
                        'days_until_expiry': days_until_expiry
                    })
        
        return expiry_report
    
    def generate_ssl_config(self, security_level='modern'):
        """Generate SSL/TLS configuration recommendations"""
        configs = {
            'modern': {
                'protocols': ['TLSv1.3'],
                'cipher_suites': [
                    'TLS_AES_128_GCM_SHA256',
                    'TLS_AES_256_GCM_SHA384',
                    'TLS_CHACHA20_POLY1305_SHA256'
                ],
                'curves': ['X25519', 'prime256v1', 'secp384r1'],
                'hsts_max_age': 63072000,  # 2 years
                'ocsp_stapling': True
            },
            'intermediate': {
                'protocols': ['TLSv1.2', 'TLSv1.3'],
                'cipher_suites': [
                    'TLS_AES_128_GCM_SHA256',
                    'TLS_AES_256_GCM_SHA384',
                    'ECDHE-ECDSA-AES128-GCM-SHA256',
                    'ECDHE-RSA-AES128-GCM-SHA256',
                    'ECDHE-ECDSA-AES256-GCM-SHA384',
                    'ECDHE-RSA-AES256-GCM-SHA384'
                ],
                'curves': ['X25519', 'prime256v1', 'secp384r1'],
                'hsts_max_age': 31536000,  # 1 year
                'ocsp_stapling': True
            },
            'old': {
                'protocols': ['TLSv1.0', 'TLSv1.1', 'TLSv1.2'],
                'cipher_suites': [
                    'ECDHE-ECDSA-AES128-GCM-SHA256',
                    'ECDHE-RSA-AES128-GCM-SHA256',
                    'ECDHE-ECDSA-AES128-SHA256',
                    'ECDHE-RSA-AES128-SHA256',
                    'AES128-GCM-SHA256',
                    'AES128-SHA256'
                ],
                'curves': ['prime256v1', 'secp384r1'],
                'hsts_max_age': 0,  # No HSTS
                'ocsp_stapling': False
            }
        }
        
        return configs.get(security_level, configs['intermediate'])

# Example usage
ssl_manager = SSLCertificateManager()

# Check certificate for a domain
cert_info = ssl_manager.check_certificate('example.com')
if cert_info['valid']:
    print(f"Certificate for example.com expires in {cert_info['days_until_expiry']} days")
else:
    print(f"Certificate check failed: {cert_info['error']}")

# Monitor multiple certificates
hostnames = ['example.com', 'api.example.com', 'www.example.com']
expiry_report = ssl_manager.monitor_certificate_expiry(hostnames)
print(f"Certificates expiring soon: {len(expiry_report['expiring_soon'])}")

# Generate SSL configuration
ssl_config = ssl_manager.generate_ssl_config('modern')
print(f"Recommended TLS protocols: {ssl_config['protocols']}")
```

## HTTP Performance Optimization

### HTTP/1.1 vs HTTP/2 vs HTTP/3

#### HTTP/1.1 Limitations
- **Head-of-line blocking**: Requests must be processed in order
- **Connection limit**: Browsers limit concurrent connections per domain
- **Header overhead**: Headers sent with every request
- **No server push**: Server cannot proactively send resources

#### HTTP/2 Improvements
- **Multiplexing**: Multiple requests over single connection
- **Header compression**: HPACK compression reduces overhead
- **Server push**: Server can send resources before requested
- **Stream prioritization**: Important resources can be prioritized

#### HTTP/3 (QUIC) Advantages
- **UDP-based**: Eliminates TCP head-of-line blocking
- **Built-in encryption**: TLS 1.3 integrated into protocol
- **Connection migration**: Survives IP address changes
- **Reduced latency**: Faster connection establishment

### Performance Optimization Techniques

```python
import time
import gzip
import json
from functools import wraps

class HTTPPerformanceOptimizer:
    def __init__(self):
        self.cache = {}
        self.compression_threshold = 1024  # Compress responses > 1KB
    
    def enable_compression(self, response_data, accept_encoding):
        """Enable response compression based on client support"""
        if len(response_data) < self.compression_threshold:
            return response_data, {}
        
        headers = {}
        
        if 'gzip' in accept_encoding:
            compressed_data = gzip.compress(response_data.encode('utf-8'))
            headers['Content-Encoding'] = 'gzip'
            headers['Content-Length'] = str(len(compressed_data))
            return compressed_data, headers
        
        return response_data, headers
    
    def implement_caching(self, cache_key, cache_duration=300):
        """Implement response caching decorator"""
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                # Check cache
                if cache_key in self.cache:
                    cached_data, timestamp = self.cache[cache_key]
                    if time.time() - timestamp < cache_duration:
                        return cached_data
                
                # Generate response
                result = func(*args, **kwargs)
                
                # Cache result
                self.cache[cache_key] = (result, time.time())
                
                return result
            return wrapper
        return decorator
    
    def optimize_json_response(self, data):
        """Optimize JSON response size"""
        # Remove null values
        if isinstance(data, dict):
            optimized = {k: v for k, v in data.items() if v is not None}
        elif isinstance(data, list):
            optimized = [item for item in data if item is not None]
        else:
            optimized = data
        
        # Use compact JSON serialization
        return json.dumps(optimized, separators=(',', ':'))
    
    def implement_etag_caching(self, content):
        """Implement ETag-based caching"""
        import hashlib
        
        # Generate ETag
        etag = hashlib.md5(content.encode('utf-8')).hexdigest()
        
        return {
            'ETag': f'"{etag}"',
            'Cache-Control': 'max-age=0, must-revalidate'
        }
    
    def optimize_database_queries(self, query_func):
        """Optimize database queries with connection pooling"""
        @wraps(query_func)
        def wrapper(*args, **kwargs):
            # Implement query optimization strategies
            start_time = time.time()
            
            try:
                result = query_func(*args, **kwargs)
                
                # Log slow queries
                execution_time = time.time() - start_time
                if execution_time > 1.0:  # Queries taking > 1 second
                    print(f"Slow query detected: {execution_time:.2f}s")
                
                return result
            
            except Exception as e:
                print(f"Query error: {e}")
                raise
        
        return wrapper
    
    def implement_rate_limiting(self, requests_per_minute=60):
        """Implement rate limiting"""
        request_counts = {}
        
        def rate_limit_decorator(func):
            @wraps(func)
            def wrapper(client_ip, *args, **kwargs):
                current_time = time.time()
                minute_window = int(current_time // 60)
                
                # Clean old entries
                request_counts[client_ip] = [
                    timestamp for timestamp in request_counts.get(client_ip, [])
                    if timestamp > current_time - 60
                ]
                
                # Check rate limit
                if len(request_counts.get(client_ip, [])) >= requests_per_minute:
                    return {
                        'error': 'Rate limit exceeded',
                        'retry_after': 60 - (current_time % 60)
                    }, 429
                
                # Record request
                if client_ip not in request_counts:
                    request_counts[client_ip] = []
                request_counts[client_ip].append(current_time)
                
                return func(*args, **kwargs)
            
            return wrapper
        return rate_limit_decorator
    
    def generate_performance_report(self, metrics):
        """Generate HTTP performance report"""
        report = {
            'response_times': {
                'average': sum(metrics['response_times']) / len(metrics['response_times']),
                'p95': sorted(metrics['response_times'])[int(0.95 * len(metrics['response_times']))],
                'p99': sorted(metrics['response_times'])[int(0.99 * len(metrics['response_times']))]
            },
            'cache_hit_ratio': metrics['cache_hits'] / (metrics['cache_hits'] + metrics['cache_misses']),
            'compression_ratio': metrics['compressed_bytes'] / metrics['total_bytes'],
            'error_rate': metrics['errors'] / metrics['total_requests'],
            'recommendations': []
        }
        
        # Generate recommendations
        if report['cache_hit_ratio'] < 0.7:
            report['recommendations'].append('Improve caching strategy')
        
        if report['response_times']['p95'] > 1000:  # > 1 second
            report['recommendations'].append('Optimize slow endpoints')
        
        if report['compression_ratio'] < 0.3:
            report['recommendations'].append('Enable compression for more content types')
        
        return report

# Example usage
optimizer = HTTPPerformanceOptimizer()

# Example Flask app with optimizations
from flask import Flask, request, jsonify, make_response

app = Flask(__name__)

@app.route('/api/data')
@optimizer.implement_rate_limiting(requests_per_minute=100)
def get_data():
    # Simulate data retrieval
    data = {
        'users': [{'id': i, 'name': f'User {i}'} for i in range(100)],
        'timestamp': time.time()
    }
    
    # Optimize JSON response
    optimized_json = optimizer.optimize_json_response(data)
    
    # Enable compression
    accept_encoding = request.headers.get('Accept-Encoding', '')
    compressed_data, compression_headers = optimizer.enable_compression(
        optimized_json, accept_encoding
    )
    
    # Create response with optimization headers
    response = make_response(compressed_data)
    response.headers.update(compression_headers)
    
    # Add ETag caching
    etag_headers = optimizer.implement_etag_caching(optimized_json)
    response.headers.update(etag_headers)
    
    return response

# Performance metrics example
performance_metrics = {
    'response_times': [120, 150, 89, 200, 95, 180, 110],  # milliseconds
    'cache_hits': 850,
    'cache_misses': 150,
    'compressed_bytes': 1024000,
    'total_bytes': 2048000,
    'errors': 5,
    'total_requests': 1000
}

performance_report = optimizer.generate_performance_report(performance_metrics)
print(f"Performance Report: {performance_report}")
```

## HTTP Security Best Practices

### Security Headers Implementation

```python
class HTTPSecurityManager:
    def __init__(self):
        self.security_policies = {
            'strict': {
                'hsts_max_age': 31536000,  # 1 year
                'csp_policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
                'frame_options': 'DENY',
                'content_type_options': 'nosniff',
                'xss_protection': '1; mode=block',
                'referrer_policy': 'strict-origin-when-cross-origin'
            },
            'moderate': {
                'hsts_max_age': 86400,  # 1 day
                'csp_policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval'",
                'frame_options': 'SAMEORIGIN',
                'content_type_options': 'nosniff',
                'xss_protection': '1; mode=block',
                'referrer_policy': 'same-origin'
            }
        }
    
    def apply_security_headers(self, response, policy_level='strict'):
        """Apply security headers to HTTP response"""
        policy = self.security_policies.get(policy_level, self.security_policies['strict'])
        
        security_headers = {
            'Strict-Transport-Security': f"max-age={policy['hsts_max_age']}; includeSubDomains",
            'Content-Security-Policy': policy['csp_policy'],
            'X-Frame-Options': policy['frame_options'],
            'X-Content-Type-Options': policy['content_type_options'],
            'X-XSS-Protection': policy['xss_protection'],
            'Referrer-Policy': policy['referrer_policy'],
            'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
        }
        
        for header, value in security_headers.items():
            response.headers[header] = value
        
        return response
    
    def validate_input(self, data, validation_rules):
        """Validate input data against security rules"""
        errors = []
        
        for field, rules in validation_rules.items():
            if field not in data:
                if rules.get('required', False):
                    errors.append(f"Field '{field}' is required")
                continue
            
            value = data[field]
            
            # Length validation
            if 'max_length' in rules and len(str(value)) > rules['max_length']:
                errors.append(f"Field '{field}' exceeds maximum length")
            
            # Pattern validation
            if 'pattern' in rules:
                import re
                if not re.match(rules['pattern'], str(value)):
                    errors.append(f"Field '{field}' has invalid format")
            
            # XSS prevention
            if rules.get('prevent_xss', True):
                if self._contains_xss(str(value)):
                    errors.append(f"Field '{field}' contains potentially malicious content")
        
        return errors
    
    def _contains_xss(self, value):
        """Check for potential XSS patterns"""
        xss_patterns = [
            r'<script[^>]*>.*?</script>',
            r'javascript:',
            r'on\w+\s*=',
            r'<iframe[^>]*>',
            r'<object[^>]*>',
            r'<embed[^>]*>'
        ]
        
        import re
        for pattern in xss_patterns:
            if re.search(pattern, value, re.IGNORECASE):
                return True
        
        return False
    
    def implement_csrf_protection(self, session_token):
        """Implement CSRF token validation"""
        import secrets
        import hmac
        import hashlib
        
        # Generate CSRF token
        csrf_token = secrets.token_urlsafe(32)
        
        # Create signed token
        signature = hmac.new(
            session_token.encode('utf-8'),
            csrf_token.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return f"{csrf_token}.{signature}"
    
    def validate_csrf_token(self, token, session_token):
        """Validate CSRF token"""
        import hmac
        import hashlib
        
        try:
            csrf_token, signature = token.split('.', 1)
            
            expected_signature = hmac.new(
                session_token.encode('utf-8'),
                csrf_token.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(signature, expected_signature)
        
        except (ValueError, AttributeError):
            return False
    
    def sanitize_output(self, data):
        """Sanitize output data to prevent XSS"""
        import html
        
        if isinstance(data, str):
            return html.escape(data)
        elif isinstance(data, dict):
            return {k: self.sanitize_output(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self.sanitize_output(item) for item in data]
        else:
            return data

# Example usage
security_manager = HTTPSecurityManager()

# Input validation example
validation_rules = {
    'email': {
        'required': True,
        'pattern': r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
        'max_length': 255
    },
    'name': {
        'required': True,
        'max_length': 100,
        'prevent_xss': True
    }
}

user_input = {
    'email': 'user@example.com',
    'name': 'John Doe'
}

validation_errors = security_manager.validate_input(user_input, validation_rules)
if validation_errors:
    print(f"Validation errors: {validation_errors}")
else:
    print("Input validation passed")

# CSRF protection example
session_token = "user_session_123"
csrf_token = security_manager.implement_csrf_protection(session_token)
print(f"Generated CSRF token: {csrf_token}")

# Validate CSRF token
is_valid = security_manager.validate_csrf_token(csrf_token, session_token)
print(f"CSRF token valid: {is_valid}")
```

## Best Practices for HTTP in System Design

### 1. RESTful API Design
```python
class RESTfulAPIDesigner:
    def __init__(self):
        self.design_principles = {
            'resource_naming': 'Use nouns, not verbs',
            'http_methods': 'Use appropriate HTTP methods for operations',
            'status_codes': 'Return meaningful HTTP status codes',
            'versioning': 'Implement API versioning strategy',
            'pagination': 'Implement pagination for large datasets',
            'filtering': 'Support filtering and sorting',
            'error_handling': 'Provide consistent error responses'
        }
    
    def design_resource_endpoints(self, resource_name):
        """Design RESTful endpoints for a resource"""
        endpoints = {
            f'GET /{resource_name}': {
                'purpose': f'List all {resource_name}',
                'response_codes': [200, 400, 500],
                'supports_pagination': True,
                'supports_filtering': True
            },
            f'GET /{resource_name}/{{id}}': {
                'purpose': f'Get specific {resource_name[:-1]}',
                'response_codes': [200, 404, 500],
                'supports_caching': True
            },
            f'POST /{resource_name}': {
                'purpose': f'Create new {resource_name[:-1]}',
                'response_codes': [201, 400, 409, 500],
                'requires_body': True
            },
            f'PUT /{resource_name}/{{id}}': {
                'purpose': f'Update entire {resource_name[:-1]}',
                'response_codes': [200, 400, 404, 500],
                'requires_body': True,
                'idempotent': True
            },
            f'PATCH /{resource_name}/{{id}}': {
                'purpose': f'Partially update {resource_name[:-1]}',
                'response_codes': [200, 400, 404, 500],
                'requires_body': True
            },
            f'DELETE /{resource_name}/{{id}}': {
                'purpose': f'Delete {resource_name[:-1]}',
                'response_codes': [204, 404, 500],
                'idempotent': True
            }
        }
        
        return endpoints
    
    def implement_api_versioning(self, versioning_strategy='header'):
        """Implement API versioning strategy"""
        strategies = {
            'header': {
                'method': 'HTTP Header',
                'example': 'API-Version: v1',
                'pros': ['Clean URLs', 'Easy to implement'],
                'cons': ['Not visible in URL', 'Requires documentation']
            },
            'url_path': {
                'method': 'URL Path',
                'example': '/api/v1/users',
                'pros': ['Visible in URL', 'Easy to understand'],
                'cons': ['URL pollution', 'Harder to maintain']
            },
            'query_param': {
                'method': 'Query Parameter',
                'example': '/api/users?version=1',
                'pros': ['Flexible', 'Optional parameter'],
                'cons': ['Can be ignored', 'URL pollution']
            },
            'content_type': {
                'method': 'Content-Type Header',
                'example': 'Accept: application/vnd.api+json;version=1',
                'pros': ['RESTful', 'Content negotiation'],
                'cons': ['Complex', 'Not widely used']
            }
        }
        
        return strategies.get(versioning_strategy, strategies['header'])

# Example API design
api_designer = RESTfulAPIDesigner()

# Design endpoints for users resource
user_endpoints = api_designer.design_resource_endpoints('users')
print("User API Endpoints:")
for endpoint, config in user_endpoints.items():
    print(f"{endpoint}: {config['purpose']}")

# API versioning strategy
versioning_config = api_designer.implement_api_versioning('url_path')
print(f"\nVersioning Strategy: {versioning_config['method']}")
print(f"Example: {versioning_config['example']}")
```

### 2. HTTP Client Implementation
```python
import requests
import time
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

class RobustHTTPClient:
    def __init__(self, base_url, timeout=30, max_retries=3):
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self.session = requests.Session()
        
        # Configure retry strategy
        retry_strategy = Retry(
            total=max_retries,
            status_forcelist=[429, 500, 502, 503, 504],
            method_whitelist=["HEAD", "GET", "OPTIONS"],
            backoff_factor=1
        )
        
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        
        # Set default headers
        self.session.headers.update({
            'User-Agent': 'RobustHTTPClient/1.0',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        })
    
    def get(self, endpoint, params=None, headers=None):
        """Make GET request with error handling"""
        return self._make_request('GET', endpoint, params=params, headers=headers)
    
    def post(self, endpoint, data=None, json=None, headers=None):
        """Make POST request with error handling"""
        return self._make_request('POST', endpoint, data=data, json=json, headers=headers)
    
    def put(self, endpoint, data=None, json=None, headers=None):
        """Make PUT request with error handling"""
        return self._make_request('PUT', endpoint, data=data, json=json, headers=headers)
    
    def delete(self, endpoint, headers=None):
        """Make DELETE request with error handling"""
        return self._make_request('DELETE', endpoint, headers=headers)
    
    def _make_request(self, method, endpoint, **kwargs):
        """Make HTTP request with comprehensive error handling"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        try:
            start_time = time.time()
            
            response = self.session.request(
                method=method,
                url=url,
                timeout=self.timeout,
                **kwargs
            )
            
            end_time = time.time()
            response_time = (end_time - start_time) * 1000  # Convert to milliseconds
            
            # Add response metadata
            response.response_time = response_time
            response.request_url = url
            
            # Handle different response codes
            if response.status_code >= 400:
                self._handle_error_response(response)
            
            return response
        
        except requests.exceptions.Timeout:
            raise HTTPClientError(f"Request timeout after {self.timeout}s", 'timeout')
        except requests.exceptions.ConnectionError:
            raise HTTPClientError("Connection error", 'connection_error')
        except requests.exceptions.RequestException as e:
            raise HTTPClientError(f"Request failed: {str(e)}", 'request_error')
    
    def _handle_error_response(self, response):
        """Handle HTTP error responses"""
        error_messages = {
            400: "Bad Request - Invalid request syntax",
            401: "Unauthorized - Authentication required",
            403: "Forbidden - Access denied",
            404: "Not Found - Resource not found",
            405: "Method Not Allowed - HTTP method not supported",
            409: "Conflict - Request conflicts with current state",
            429: "Too Many Requests - Rate limit exceeded",
            500: "Internal Server Error - Server error",
            502: "Bad Gateway - Invalid response from upstream",
            503: "Service Unavailable - Server temporarily unavailable",
            504: "Gateway Timeout - Upstream server timeout"
        }
        
        error_message = error_messages.get(
            response.status_code, 
            f"HTTP {response.status_code} error"
        )
        
        raise HTTPClientError(
            error_message, 
            'http_error', 
            status_code=response.status_code,
            response=response
        )
    
    def set_authentication(self, auth_type, **kwargs):
        """Set authentication for requests"""
        if auth_type == 'bearer':
            token = kwargs.get('token')
            self.session.headers['Authorization'] = f'Bearer {token}'
        elif auth_type == 'basic':
            username = kwargs.get('username')
            password = kwargs.get('password')
            self.session.auth = (username, password)
        elif auth_type == 'api_key':
            api_key = kwargs.get('api_key')
            header_name = kwargs.get('header_name', 'X-API-Key')
            self.session.headers[header_name] = api_key
    
    def enable_caching(self, cache_duration=300):
        """Enable response caching"""
        # Simple in-memory cache implementation
        self._cache = {}
        self._cache_duration = cache_duration
    
    def _get_from_cache(self, cache_key):
        """Get response from cache if valid"""
        if hasattr(self, '_cache') and cache_key in self._cache:
            cached_response, timestamp = self._cache[cache_key]
            if time.time() - timestamp < self._cache_duration:
                return cached_response
        return None
    
    def _store_in_cache(self, cache_key, response):
        """Store response in cache"""
        if hasattr(self, '_cache'):
            self._cache[cache_key] = (response, time.time())

class HTTPClientError(Exception):
    def __init__(self, message, error_type, status_code=None, response=None):
        super().__init__(message)
        self.error_type = error_type
        self.status_code = status_code
        self.response = response

# Example usage
client = RobustHTTPClient('https://api.example.com')

# Set authentication
client.set_authentication('bearer', token='your-jwt-token')

# Make requests with error handling
try:
    # GET request
    response = client.get('/users', params={'page': 1, 'limit': 10})
    users = response.json()
    print(f"Retrieved {len(users)} users in {response.response_time:.2f}ms")
    
    # POST request
    new_user = {
        'name': 'John Doe',
        'email': 'john@example.com'
    }
    response = client.post('/users', json=new_user)
    created_user = response.json()
    print(f"Created user with ID: {created_user['id']}")
    
except HTTPClientError as e:
    print(f"HTTP Client Error: {e} (Type: {e.error_type})")
    if e.status_code:
        print(f"Status Code: {e.status_code}")
```

## Summary

HTTP and HTTPS are fundamental protocols for modern distributed systems:

### Key Takeaways
1. **Request-Response Model**: HTTP follows a simple client-server communication pattern
2. **Method Semantics**: Use appropriate HTTP methods (GET, POST, PUT, DELETE) for different operations
3. **Status Codes**: Return meaningful status codes to indicate request outcomes
4. **Headers**: Leverage headers for metadata, caching, security, and content negotiation
5. **HTTPS Security**: Always use HTTPS in production for encrypted communication

### Practical Applications
- **RESTful APIs**: Design clean, intuitive APIs using HTTP conventions
- **Microservices Communication**: HTTP is the standard for service-to-service communication
- **Web Applications**: HTTP/HTTPS enables all web-based user interfaces
- **Mobile APIs**: Mobile apps communicate with backends via HTTP APIs
- **Third-party Integrations**: Most external services expose HTTP APIs

### System Design Implications
- HTTP performance affects overall system responsiveness
- Proper caching strategies reduce server load and improve user experience
- Security headers and HTTPS protect against various attacks
- HTTP/2 and HTTP/3 provide performance improvements for modern applications
- Error handling and retry logic ensure robust client-server communication

In the next section, we'll explore WebSockets for real-time communication, which builds on HTTP for bidirectional communication.

# Performance Testing Basics

## Introduction

Performance testing is the practice of evaluating how a system performs under various conditions and loads. It's essential for validating that your system meets performance requirements, identifying bottlenecks before they impact users, and ensuring the system can handle expected growth. Performance testing should be integrated into your development lifecycle, not just done before major releases.

## Types of Performance Testing

### 1. Load Testing

**Purpose**: Verify system behavior under expected normal load conditions.

**Characteristics**:
- Simulates typical user behavior and traffic patterns
- Tests system under expected concurrent user load
- Validates that performance requirements are met under normal conditions
- Usually runs for extended periods to identify memory leaks or degradation

**Example Scenario**:
```
E-commerce Website Load Test:
- Concurrent Users: 1,000
- Test Duration: 30 minutes
- User Actions: Browse products (60%), Add to cart (25%), Checkout (15%)
- Expected Response Time: < 2 seconds for 95% of requests
- Expected Throughput: 500 requests/second
```

### 2. Stress Testing

**Purpose**: Determine the system's breaking point and behavior under extreme conditions.

**Characteristics**:
- Gradually increases load beyond normal capacity
- Identifies maximum system capacity
- Tests system recovery after failure
- Reveals how gracefully the system degrades

**Example Scenario**:
```
API Stress Test:
- Start: 100 concurrent users
- Increment: +100 users every 2 minutes
- Stop Condition: Error rate > 5% OR Response time > 10 seconds
- Monitor: CPU, memory, database connections, error rates
- Goal: Find breaking point and ensure graceful degradation
```

### 3. Spike Testing

**Purpose**: Test system behavior when load suddenly increases dramatically.

**Characteristics**:
- Sudden, sharp increase in load
- Tests auto-scaling capabilities
- Validates circuit breakers and rate limiting
- Simulates viral content or flash sales

**Example Scenario**:
```
Social Media Spike Test:
- Normal Load: 500 concurrent users
- Spike: Instantly jump to 5,000 users for 10 minutes
- Return: Drop back to 500 users
- Monitor: Response times, error rates, auto-scaling behavior
- Success Criteria: System handles spike without crashing
```

### 4. Volume Testing

**Purpose**: Test system behavior with large amounts of data.

**Characteristics**:
- Tests database performance with large datasets
- Validates data processing capabilities
- Identifies storage and memory limitations
- Tests backup and recovery procedures

**Example Scenario**:
```
Database Volume Test:
- Dataset: 100 million records
- Operations: Complex queries, joins, aggregations
- Concurrent Users: 200
- Monitor: Query response times, database CPU/memory, disk I/O
- Success Criteria: Query times remain under 5 seconds
```

### 5. Endurance Testing (Soak Testing)

**Purpose**: Test system stability over extended periods.

**Characteristics**:
- Runs for hours or days under normal load
- Identifies memory leaks and resource exhaustion
- Tests long-running processes and batch jobs
- Validates system stability over time

**Example Scenario**:
```
Web Application Endurance Test:
- Duration: 72 hours
- Load: 80% of maximum capacity
- Monitor: Memory usage trends, connection pools, garbage collection
- Success Criteria: No memory leaks, stable performance throughout
```

## Performance Testing Process

### 1. Planning Phase

**Define Objectives**:
```
Performance Testing Goals:
- Validate response time requirements (P95 < 500ms)
- Determine maximum concurrent user capacity
- Identify system bottlenecks
- Test auto-scaling behavior
- Validate database performance under load
```

**Identify Test Scenarios**:
```
User Journey Mapping:
1. User Registration (5% of traffic)
   - Form submission
   - Email verification
   - Profile creation

2. Product Search (40% of traffic)
   - Search queries
   - Filter application
   - Result pagination

3. Purchase Flow (10% of traffic)
   - Add to cart
   - Checkout process
   - Payment processing
```

**Set Performance Criteria**:
```
Acceptance Criteria:
- Response Time: P95 < 2 seconds, P99 < 5 seconds
- Throughput: Minimum 1,000 requests/second
- Error Rate: < 0.1% under normal load
- Availability: 99.9% during test period
- Resource Utilization: CPU < 80%, Memory < 85%
```

### 2. Test Environment Setup

**Environment Requirements**:
```
Production-Like Environment:
- Same hardware specifications (or proportionally scaled)
- Same network topology and latency
- Same database size and configuration
- Same third-party integrations (or mocks)
- Same monitoring and logging setup
```

**Test Data Preparation**:
```
Data Requirements:
- Realistic data volumes (users, products, transactions)
- Proper data distribution (active vs inactive users)
- Clean, consistent test data
- Anonymized production data (when possible)
- Automated data refresh between test runs
```

### 3. Test Execution

**Monitoring Strategy**:
```
Application Metrics:
- Response times (average, percentiles)
- Throughput (requests/second)
- Error rates and types
- Active user sessions
- Business transaction completion rates

Infrastructure Metrics:
- CPU utilization per server
- Memory usage and garbage collection
- Disk I/O and storage utilization
- Network bandwidth and latency
- Database connection pools and query performance
```

**Test Execution Phases**:
```
Ramp-Up Phase:
- Gradually increase load to target level
- Monitor for early warning signs
- Validate baseline performance

Steady State Phase:
- Maintain target load for specified duration
- Collect performance metrics
- Monitor for degradation over time

Ramp-Down Phase:
- Gradually decrease load
- Monitor recovery behavior
- Check for resource cleanup
```

## Practical Testing Examples

### Example 1: REST API Load Test with k6

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Error rate under 1%
    errors: ['rate<0.01'],
  },
};

export default function() {
  // Test user login
  let loginResponse = http.post('https://api.example.com/login', {
    username: 'testuser',
    password: 'testpass'
  });
  
  let loginSuccess = check(loginResponse, {
    'login status is 200': (r) => r.status === 200,
    'login response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  errorRate.add(!loginSuccess);
  
  if (loginSuccess) {
    let token = loginResponse.json('token');
    
    // Test API endpoints with authentication
    let headers = { 'Authorization': `Bearer ${token}` };
    
    // Get user profile
    let profileResponse = http.get('https://api.example.com/profile', { headers });
    check(profileResponse, {
      'profile status is 200': (r) => r.status === 200,
      'profile response time < 500ms': (r) => r.timings.duration < 500,
    });
    
    // Search products
    let searchResponse = http.get('https://api.example.com/products?q=laptop', { headers });
    check(searchResponse, {
      'search status is 200': (r) => r.status === 200,
      'search response time < 1000ms': (r) => r.timings.duration < 1000,
    });
  }
  
  sleep(1); // Think time between requests
}
```

### Example 2: Database Performance Test

```sql
-- Database Load Test Script
-- Simulate concurrent user queries

-- Test 1: User Authentication Queries
SELECT user_id, username, email, last_login 
FROM users 
WHERE username = 'testuser123' AND password_hash = 'hashed_password';

-- Test 2: Product Search Queries
SELECT p.product_id, p.name, p.price, p.description, c.category_name
FROM products p
JOIN categories c ON p.category_id = c.category_id
WHERE p.name ILIKE '%laptop%' 
  AND p.price BETWEEN 500 AND 2000
  AND p.in_stock = true
ORDER BY p.popularity_score DESC
LIMIT 20;

-- Test 3: Order Processing Queries
BEGIN;
INSERT INTO orders (user_id, total_amount, status, created_at)
VALUES (12345, 1299.99, 'pending', NOW());

INSERT INTO order_items (order_id, product_id, quantity, unit_price)
VALUES (LASTVAL(), 67890, 1, 1299.99);

UPDATE products 
SET stock_quantity = stock_quantity - 1
WHERE product_id = 67890 AND stock_quantity > 0;
COMMIT;

-- Performance Monitoring Queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  stddev_time,
  rows
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

### Example 3: Web Application Load Test with JMeter

```xml
<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2">
  <hashTree>
    <TestPlan testname="E-commerce Load Test">
      <elementProp name="TestPlan.arguments" elementType="Arguments" guiclass="ArgumentsPanel">
        <collectionProp name="Arguments.arguments">
          <elementProp name="base_url" elementType="Argument">
            <stringProp name="Argument.name">base_url</stringProp>
            <stringProp name="Argument.value">https://shop.example.com</stringProp>
          </elementProp>
          <elementProp name="concurrent_users" elementType="Argument">
            <stringProp name="Argument.name">concurrent_users</stringProp>
            <stringProp name="Argument.value">500</stringProp>
          </elementProp>
        </collectionProp>
      </elementProp>
    </TestPlan>
    
    <hashTree>
      <ThreadGroup testname="User Journey">
        <stringProp name="ThreadGroup.num_threads">${concurrent_users}</stringProp>
        <stringProp name="ThreadGroup.ramp_time">300</stringProp> <!-- 5 minutes ramp-up -->
        <stringProp name="ThreadGroup.duration">1800</stringProp> <!-- 30 minutes test -->
        
        <hashTree>
          <!-- Home Page Request -->
          <HTTPSamplerProxy testname="Home Page">
            <stringProp name="HTTPSampler.domain">${base_url}</stringProp>
            <stringProp name="HTTPSampler.path">/</stringProp>
            <stringProp name="HTTPSampler.method">GET</stringProp>
          </HTTPSamplerProxy>
          
          <!-- Product Search -->
          <HTTPSamplerProxy testname="Product Search">
            <stringProp name="HTTPSampler.domain">${base_url}</stringProp>
            <stringProp name="HTTPSampler.path">/search</stringProp>
            <stringProp name="HTTPSampler.method">GET</stringProp>
            <elementProp name="HTTPsampler.Arguments" elementType="Arguments">
              <collectionProp name="Arguments.arguments">
                <elementProp name="q" elementType="HTTPArgument">
                  <stringProp name="HTTPArgument.name">q</stringProp>
                  <stringProp name="HTTPArgument.value">laptop</stringProp>
                </elementProp>
              </collectionProp>
            </elementProp>
          </HTTPSamplerProxy>
          
          <!-- Response Time Assertions -->
          <ResponseAssertion testname="Response Time Check">
            <collectionProp name="Asserion.test_strings">
              <stringProp>200</stringProp>
            </collectionProp>
            <stringProp name="Assertion.test_field">Assertion.response_code</stringProp>
          </ResponseAssertion>
          
          <!-- Think Time -->
          <UniformRandomTimer testname="Think Time">
            <stringProp name="ConstantTimer.delay">2000</stringProp>
            <stringProp name="RandomTimer.range">3000</stringProp>
          </UniformRandomTimer>
        </hashTree>
      </ThreadGroup>
    </hashTree>
  </hashTree>
</jmeterTestPlan>
```

## Performance Testing Tools

### Open Source Tools

**k6**
```bash
# Installation
npm install -g k6

# Run load test
k6 run --vus 100 --duration 30s load-test.js

# Run with custom thresholds
k6 run --vus 100 --duration 5m \
  --threshold http_req_duration=p(95)<500 \
  --threshold http_req_failed=rate<0.01 \
  load-test.js
```

**Apache JMeter**
```bash
# GUI Mode (for test development)
jmeter

# Command Line Mode (for execution)
jmeter -n -t test-plan.jmx -l results.jtl -e -o report-folder

# Distributed Testing
jmeter -n -t test-plan.jmx -R server1,server2,server3
```

**Artillery**
```yaml
# artillery-config.yml
config:
  target: 'https://api.example.com'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
    - duration: 60
      arrivalRate: 10
  payload:
    path: 'users.csv'
    fields:
      - 'username'
      - 'password'

scenarios:
  - name: 'User Login and Browse'
    weight: 70
    flow:
      - post:
          url: '/login'
          json:
            username: '{{ username }}'
            password: '{{ password }}'
      - get:
          url: '/dashboard'
      - think: 5
      - get:
          url: '/products'

  - name: 'Product Purchase'
    weight: 30
    flow:
      - post:
          url: '/login'
      - get:
          url: '/products/{{ $randomInt(1, 1000) }}'
      - post:
          url: '/cart/add'
          json:
            productId: '{{ $randomInt(1, 1000) }}'
            quantity: 1
      - post:
          url: '/checkout'
```

### Cloud-Based Tools

**AWS Load Testing Solution**
```json
{
  "testName": "E-commerce Load Test",
  "testDescription": "Peak traffic simulation",
  "testTaskConfigs": [
    {
      "region": "us-east-1",
      "concurrency": 500,
      "taskCount": 10,
      "testType": "simple"
    }
  ],
  "testScenario": {
    "execution": [
      {
        "ramp-up": "5m",
        "hold-for": "30m",
        "scenario": "user-journey"
      }
    ],
    "scenarios": {
      "user-journey": {
        "requests": [
          {
            "url": "https://shop.example.com/",
            "method": "GET",
            "think-time": "2s"
          },
          {
            "url": "https://shop.example.com/search?q=laptop",
            "method": "GET",
            "think-time": "3s"
          }
        ]
      }
    }
  }
}
```

## Test Result Analysis

### Key Metrics to Analyze

**Response Time Analysis**:
```
Response Time Distribution:
- P50 (Median): 150ms
- P90: 400ms
- P95: 650ms
- P99: 1.2s
- P99.9: 3.5s

Analysis:
✅ Good: Median response time is fast
⚠️  Warning: P99 approaching threshold (2s)
❌ Issue: P99.9 exceeds acceptable limits
```

**Throughput Analysis**:
```
Throughput Over Time:
- Start: 100 RPS
- Peak: 850 RPS
- End: 95 RPS

Analysis:
✅ Good: Achieved target throughput (800 RPS)
⚠️  Warning: Slight degradation at end of test
📊 Recommendation: Monitor for memory leaks
```

**Error Rate Analysis**:
```
Error Breakdown:
- Total Requests: 100,000
- Successful (2xx): 99,750 (99.75%)
- Client Errors (4xx): 150 (0.15%)
- Server Errors (5xx): 100 (0.10%)

Error Types:
- 404 Not Found: 120 (0.12%)
- 500 Internal Server Error: 80 (0.08%)
- 503 Service Unavailable: 20 (0.02%)
```

### Performance Bottleneck Identification

**CPU Bottleneck Indicators**:
```
Symptoms:
- High CPU utilization (>90%)
- Response times increase with load
- Throughput plateaus despite increased load

Solutions:
- Optimize algorithms and code efficiency
- Add more CPU cores (vertical scaling)
- Distribute load across more servers (horizontal scaling)
```

**Memory Bottleneck Indicators**:
```
Symptoms:
- High memory utilization
- Frequent garbage collection
- Out of memory errors
- Performance degrades over time

Solutions:
- Optimize memory usage and object lifecycle
- Increase available memory
- Implement memory caching strategies
- Fix memory leaks
```

**Database Bottleneck Indicators**:
```
Symptoms:
- High database response times
- Connection pool exhaustion
- Lock contention and deadlocks
- Slow query log entries

Solutions:
- Optimize queries and add indexes
- Implement connection pooling
- Add read replicas
- Partition or shard data
```

**Network Bottleneck Indicators**:
```
Symptoms:
- High network latency
- Bandwidth saturation
- Packet loss
- Connection timeouts

Solutions:
- Optimize payload sizes
- Implement compression
- Use CDN for static content
- Improve network infrastructure
```

## Performance Testing Best Practices

### 1. Test Early and Often

```
Integration into Development Lifecycle:
- Unit Performance Tests: Test individual components
- Integration Performance Tests: Test service interactions
- System Performance Tests: Test complete user journeys
- Regression Performance Tests: Ensure changes don't degrade performance
```

### 2. Realistic Test Scenarios

```
Realistic Testing Checklist:
✅ Use production-like data volumes
✅ Simulate realistic user behavior patterns
✅ Include think time between requests
✅ Test with realistic network conditions
✅ Include error scenarios and edge cases
✅ Test during different time periods
```

### 3. Comprehensive Monitoring

```
Monitoring Stack:
- Application Performance: Response times, throughput, errors
- Infrastructure: CPU, memory, disk, network
- Database: Query performance, connection pools, locks
- External Services: Third-party API response times
- Business Metrics: Transaction completion rates, revenue impact
```

### 4. Automated Performance Testing

```yaml
# CI/CD Pipeline Integration
performance_test:
  stage: test
  script:
    - k6 run --quiet --summary-trend-stats="avg,min,med,max,p(95),p(99)" performance-test.js
  artifacts:
    reports:
      performance: performance-report.json
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
    - if: $CI_MERGE_REQUEST_ID
  allow_failure: false
```

### 5. Performance Budgets

```
Performance Budget Example:
- Page Load Time: < 3 seconds (P95)
- API Response Time: < 500ms (P95)
- Error Rate: < 0.1%
- Throughput: > 1000 RPS
- Resource Utilization: < 80% CPU, < 85% Memory

Budget Enforcement:
- Fail builds that exceed performance budgets
- Alert when approaching budget limits
- Track performance trends over time
```

## Common Performance Testing Pitfalls

### 1. Unrealistic Test Conditions

❌ **Wrong**: Testing with empty database and perfect network conditions
✅ **Right**: Using production-sized data and realistic network latency

### 2. Insufficient Ramp-Up Time

❌ **Wrong**: Immediately jumping to full load
✅ **Right**: Gradually increasing load to allow system warm-up

### 3. Ignoring Think Time

❌ **Wrong**: Sending requests as fast as possible
✅ **Right**: Including realistic pauses between user actions

### 4. Testing Only Happy Paths

❌ **Wrong**: Only testing successful scenarios
✅ **Right**: Including error conditions and edge cases

### 5. Inadequate Monitoring

❌ **Wrong**: Only monitoring response times
✅ **Right**: Comprehensive monitoring of all system layers

## Summary

Performance testing is essential for building reliable, scalable systems:

- **Multiple test types** (load, stress, spike, volume, endurance) serve different purposes
- **Realistic scenarios** and test data are crucial for meaningful results
- **Comprehensive monitoring** across all system layers provides actionable insights
- **Early and continuous testing** prevents performance issues from reaching production
- **Automated testing** and performance budgets maintain quality over time
- **Proper analysis** of results leads to effective optimization strategies

Remember: Performance testing is not a one-time activity but an ongoing practice that should be integrated into your development lifecycle. The goal is not just to find problems, but to understand your system's behavior and capacity limits before your users do.

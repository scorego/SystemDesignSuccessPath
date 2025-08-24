# Capacity Estimation Calculator Template

## Overview
This template provides a systematic approach to capacity estimation for system design interviews. Use the formulas and tables below to calculate realistic system requirements.

## User and Traffic Estimation

### Basic User Metrics Template
```markdown
| Metric | Value | Calculation Method | Notes |
|--------|-------|-------------------|-------|
| Total Registered Users | [X] million | Given or estimated | Market size analysis |
| Monthly Active Users (MAU) | [X] million | 60-80% of registered | Industry average |
| Daily Active Users (DAU) | [X] million | 20-30% of MAU | Engagement rate |
| Peak Concurrent Users | [X] thousand | 10-20% of DAU | Peak hour analysis |
| Average Session Duration | [X] minutes | User behavior analysis | App type dependent |
| Sessions per User per Day | [X] | Usage pattern analysis | Engagement frequency |
```

### Traffic Calculation Formulas
```markdown
## Request Volume Calculations

### Daily Request Volume
- **Formula**: DAU × Average Sessions × Requests per Session
- **Example**: 10M DAU × 3 sessions × 50 requests = 1.5B requests/day

### Requests per Second (QPS)
- **Average QPS**: Daily Requests ÷ 86,400 seconds
- **Peak QPS**: Average QPS × Peak Factor (typically 2-5x)
- **Example**: 1.5B ÷ 86,400 = 17,361 average QPS
- **Peak**: 17,361 × 3 = 52,083 peak QPS

### Read vs Write Ratio
- **Social Media**: 100:1 (read-heavy)
- **Chat Applications**: 1:1 (balanced)
- **Analytics Systems**: 1000:1 (read-heavy)
- **Trading Systems**: 1:10 (write-heavy)
```

## Data Storage Estimation

### Data Size Calculation Template
```markdown
| Data Type | Size per Item | Items per User | Total per User | Notes |
|-----------|---------------|----------------|----------------|-------|
| User Profile | 1 KB | 1 | 1 KB | Basic info |
| User Posts | 500 bytes | 10/month | 5 KB/month | Text content |
| Images | 200 KB | 5/month | 1 MB/month | Compressed |
| Videos | 10 MB | 1/month | 10 MB/month | Compressed |
| Metadata | 100 bytes | 50/month | 5 KB/month | Likes, comments |
| **Total per User** | - | - | **~11 MB/month** | Sum of all |
```

### Storage Growth Projection
```markdown
## Storage Calculation Formula

### Current Storage Requirement
- **Formula**: Active Users × Data per User
- **Example**: 100M users × 1 GB = 100 TB

### Growth Projection
- **Monthly Growth**: New Users × Data per User + Existing Users × Monthly Data Growth
- **Example**: 1M new users × 1 GB + 100M × 100 MB = 11 TB/month

### 5-Year Projection
- **Formula**: Current Storage + (Monthly Growth × 60 months) × Growth Factor
- **Growth Factor**: 1.2-1.5 (accounts for feature expansion)
- **Example**: 100 TB + (11 TB × 60) × 1.3 = 958 TB ≈ 1 PB
```

## Bandwidth Estimation

### Network Bandwidth Template
```markdown
| Traffic Type | Request Size | Response Size | QPS | Bandwidth |
|--------------|--------------|---------------|-----|-----------|
| User Login | 1 KB | 2 KB | 1,000 | 3 MB/s |
| Feed Fetch | 500 bytes | 50 KB | 10,000 | 505 MB/s |
| Image Upload | 200 KB | 1 KB | 100 | 20.1 MB/s |
| Video Stream | 1 KB | 1 MB | 5,000 | 5 GB/s |
| **Total Peak** | - | - | **16,100** | **~5.5 GB/s** |
```

### Bandwidth Calculation Formulas
```markdown
## Bandwidth Formulas

### Per-Request Bandwidth
- **Formula**: (Request Size + Response Size) × QPS
- **Example**: (1 KB + 50 KB) × 1000 QPS = 51 MB/s

### Total System Bandwidth
- **Ingress**: Sum of all request sizes × respective QPS
- **Egress**: Sum of all response sizes × respective QPS
- **Total**: Ingress + Egress

### CDN Bandwidth Savings
- **Cache Hit Ratio**: 80-95% for static content
- **Bandwidth Reduction**: Original × (1 - Cache Hit Ratio)
- **Example**: 1 GB/s × (1 - 0.9) = 100 MB/s origin bandwidth
```

## Database and Cache Sizing

### Database Sizing Template
```markdown
| Component | Size Calculation | Example | Notes |
|-----------|------------------|---------|-------|
| **Primary Data** | Users × Avg Data per User | 100M × 10 KB = 1 TB | Core user data |
| **Indexes** | 20-30% of primary data | 1 TB × 0.25 = 250 GB | B-tree indexes |
| **Replication** | Primary × Replica Count | 1.25 TB × 2 = 2.5 TB | Master + 2 replicas |
| **Growth Buffer** | Total × Growth Factor | 2.5 TB × 1.5 = 3.75 TB | 50% buffer |
| **Backup Storage** | Total × Backup Retention | 3.75 TB × 7 = 26.25 TB | 7 days retention |
```

### Cache Sizing Template
```markdown
| Cache Layer | Hit Ratio | Data Size | Cache Size | Notes |
|-------------|-----------|-----------|------------|-------|
| **L1 (Application)** | 60-80% | Hot data | 10-20% of DB | In-memory |
| **L2 (Redis/Memcached)** | 80-95% | Warm data | 5-15% of DB | Distributed |
| **L3 (CDN)** | 90-99% | Static content | Based on content | Edge caches |

## Cache Size Calculation
- **Working Set**: Frequently accessed data (80/20 rule)
- **Cache Size**: Working Set × Safety Factor (1.2-1.5)
- **Example**: 100 GB working set × 1.3 = 130 GB cache
```

## Server and Infrastructure Sizing

### Server Capacity Template
```markdown
| Server Type | CPU Cores | RAM | Storage | Capacity | Notes |
|-------------|-----------|-----|---------|----------|-------|
| **Web Server** | 8-16 | 32-64 GB | 500 GB SSD | 1000-5000 QPS | Stateless |
| **App Server** | 16-32 | 64-128 GB | 1 TB SSD | 500-2000 QPS | Business logic |
| **DB Server** | 32-64 | 256-512 GB | 10 TB SSD | 10K-50K QPS | I/O intensive |
| **Cache Server** | 8-16 | 128-256 GB | 500 GB SSD | 100K+ QPS | Memory intensive |
```

### Infrastructure Calculation
```markdown
## Server Count Estimation

### Web/App Servers
- **Formula**: Peak QPS ÷ QPS per Server
- **Example**: 50,000 QPS ÷ 2,000 QPS = 25 servers
- **With Redundancy**: 25 × 1.5 = 38 servers

### Database Servers
- **Read Replicas**: Based on read QPS and replication lag tolerance
- **Shards**: Based on data size and query patterns
- **Example**: 100 TB data ÷ 10 TB per shard = 10 shards

### Load Balancer Capacity
- **Throughput**: Should handle 2-3x peak traffic
- **Connections**: Concurrent connections × safety factor
```

## Cost Estimation Template

### Infrastructure Cost Breakdown
```markdown
| Component | Unit Cost | Quantity | Monthly Cost | Annual Cost |
|-----------|-----------|----------|--------------|-------------|
| **Compute** | $200/server | 50 servers | $10,000 | $120,000 |
| **Storage** | $0.10/GB | 100 TB | $10,000 | $120,000 |
| **Bandwidth** | $0.05/GB | 1 PB | $50,000 | $600,000 |
| **CDN** | $0.02/GB | 500 TB | $10,000 | $120,000 |
| **Database** | $500/TB | 50 TB | $25,000 | $300,000 |
| **Monitoring** | $100/server | 50 servers | $5,000 | $60,000 |
| **Total** | - | - | **$110,000** | **$1,320,000** |
```

## Quick Reference Formulas

### Essential Calculations
```markdown
## Time Conversions
- 1 day = 86,400 seconds
- 1 month = 2.6 million seconds (30 days)
- 1 year = 31.5 million seconds

## Data Size Conversions
- 1 KB = 1,024 bytes
- 1 MB = 1,024 KB = ~1 million bytes
- 1 GB = 1,024 MB = ~1 billion bytes
- 1 TB = 1,024 GB = ~1 trillion bytes

## Common Ratios
- DAU/MAU: 20-30%
- Peak/Average QPS: 2-5x
- Cache Hit Ratio: 80-95%
- Read/Write Ratio: Varies by application
- Index Size: 20-30% of data size

## Performance Benchmarks
- SSD Random Read: 100K IOPS
- SSD Sequential Read: 500 MB/s
- Network Latency: 1ms (same DC), 50ms (cross-region)
- Database Query: 1-10ms (simple), 100ms+ (complex)
- Cache Lookup: 0.1-1ms
```

## Estimation Checklist

### Before You Start
- [ ] Clarify the scale (users, geography, features)
- [ ] Understand the use case and user behavior
- [ ] Identify read vs write patterns
- [ ] Consider peak vs average load

### During Estimation
- [ ] Start with user metrics and work down
- [ ] Use round numbers for easier calculation
- [ ] Show your work and assumptions
- [ ] Consider growth over time
- [ ] Account for redundancy and failover

### Validation
- [ ] Sanity check your numbers
- [ ] Compare with known systems
- [ ] Consider if the scale makes sense
- [ ] Verify units and conversions
- [ ] Account for overhead and inefficiencies

## Common Estimation Mistakes

### Avoid These Pitfalls
- **Over-precision**: Don't calculate to exact bytes
- **Ignoring Growth**: Plan for 2-3 years ahead
- **Forgetting Overhead**: Add 20-50% buffer
- **Wrong Units**: Double-check KB vs MB vs GB
- **Unrealistic Ratios**: Use industry benchmarks
- **Missing Redundancy**: Account for replication
- **Ignoring Peaks**: Design for peak, not average
- **Complex First**: Start simple, then add complexity
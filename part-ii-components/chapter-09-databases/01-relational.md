# Relational Databases

## Overview

Relational databases have been the backbone of data storage for decades, providing structured data management through tables, relationships, and SQL. Understanding their principles, strengths, and limitations is crucial for system design decisions.

## ACID Properties

### Atomicity
Transactions are all-or-nothing operations. Either all changes in a transaction succeed, or none do.

```sql
-- Example: Bank transfer transaction
BEGIN TRANSACTION;
UPDATE accounts SET balance = balance - 100 WHERE account_id = 'A123';
UPDATE accounts SET balance = balance + 100 WHERE account_id = 'B456';
COMMIT; -- Both updates succeed or both fail
```

### Consistency
Database remains in a valid state before and after transactions, maintaining all defined rules and constraints.

```sql
-- Constraint example
ALTER TABLE accounts ADD CONSTRAINT positive_balance 
CHECK (balance >= 0);
```

### Isolation
Concurrent transactions don't interfere with each other. Different isolation levels provide varying degrees of protection.

### Durability
Committed transactions persist even in case of system failures through write-ahead logging and checkpoints.

## Database Schema Design

### Normalization

**First Normal Form (1NF)**
- Eliminate repeating groups
- Each column contains atomic values

```sql
-- Violates 1NF (repeating groups)
CREATE TABLE orders_bad (
    order_id INT,
    customer_name VARCHAR(100),
    items VARCHAR(500) -- "item1,item2,item3"
);

-- Follows 1NF
CREATE TABLE orders (
    order_id INT PRIMARY KEY,
    customer_name VARCHAR(100)
);

CREATE TABLE order_items (
    order_id INT,
    item_name VARCHAR(100),
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);
```

**Second Normal Form (2NF)**
- Must be in 1NF
- No partial dependencies on composite primary keys

**Third Normal Form (3NF)**
- Must be in 2NF
- No transitive dependencies

### Denormalization Trade-offs

| Aspect | Normalized | Denormalized |
|--------|------------|--------------|
| Storage | Efficient | Redundant |
| Updates | Simple | Complex |
| Reads | May require joins | Fast single-table |
| Consistency | Easier to maintain | Risk of anomalies |

## Indexing Strategies

### Index Types

**B-Tree Indexes (Default)**
```sql
-- Primary key automatically creates clustered index
CREATE TABLE users (
    user_id INT PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP
);

-- Secondary index for frequent queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

**Composite Indexes**
```sql
-- Order matters: (status, created_at) vs (created_at, status)
CREATE INDEX idx_orders_status_date ON orders(status, created_at);

-- Efficient for queries like:
SELECT * FROM orders WHERE status = 'pending' AND created_at > '2024-01-01';
```

**Partial Indexes**
```sql
-- Index only active users
CREATE INDEX idx_active_users ON users(email) WHERE status = 'active';
```

### Index Performance Impact

```mermaid
graph TD
    A[Query] --> B{Index Available?}
    B -->|Yes| C[Index Scan O(log n)]
    B -->|No| D[Table Scan O(n)]
    C --> E[Fast Result]
    D --> F[Slow Result]
```

## Query Optimization

### Execution Plans

```sql
-- Analyze query performance
EXPLAIN ANALYZE 
SELECT u.name, COUNT(o.order_id) as order_count
FROM users u
LEFT JOIN orders o ON u.user_id = o.user_id
WHERE u.created_at > '2024-01-01'
GROUP BY u.user_id, u.name
ORDER BY order_count DESC;
```

### Common Optimization Techniques

**1. Use Appropriate Indexes**
```sql
-- Before: Full table scan
SELECT * FROM orders WHERE customer_id = 123 AND status = 'pending';

-- After: Add composite index
CREATE INDEX idx_orders_customer_status ON orders(customer_id, status);
```

**2. Avoid SELECT ***
```sql
-- Inefficient
SELECT * FROM users WHERE email = 'user@example.com';

-- Efficient
SELECT user_id, name FROM users WHERE email = 'user@example.com';
```

**3. Use LIMIT for Large Result Sets**
```sql
-- Pagination
SELECT * FROM orders 
ORDER BY created_at DESC 
LIMIT 20 OFFSET 100;
```

**4. Optimize JOIN Operations**
```sql
-- Ensure JOIN columns are indexed
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_users_id ON users(user_id);

-- Use appropriate JOIN types
SELECT u.name, o.total
FROM users u
INNER JOIN orders o ON u.user_id = o.user_id  -- Only users with orders
WHERE u.status = 'active';
```

## Popular Relational Databases

### Comparison Table

| Database | Strengths | Use Cases | Limitations |
|----------|-----------|-----------|-------------|
| **PostgreSQL** | Advanced features, JSON support, extensibility | Complex queries, analytics, geospatial | Learning curve |
| **MySQL** | Performance, replication, wide adoption | Web applications, read-heavy workloads | Limited advanced features |
| **Oracle** | Enterprise features, performance, reliability | Large enterprises, mission-critical | Cost, complexity |
| **SQL Server** | Integration with Microsoft stack, BI tools | Enterprise applications, .NET ecosystem | Windows-centric, licensing |
| **SQLite** | Embedded, serverless, zero-config | Mobile apps, prototyping, small applications | Single writer, limited concurrency |

### PostgreSQL Example Configuration

```sql
-- Advanced PostgreSQL features
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    metadata JSONB,  -- JSON with indexing support
    tags TEXT[],     -- Array type
    created_at TIMESTAMP DEFAULT NOW()
);

-- JSON indexing
CREATE INDEX idx_products_metadata ON products USING GIN (metadata);

-- Array operations
SELECT * FROM products WHERE 'electronics' = ANY(tags);

-- JSON queries
SELECT * FROM products WHERE metadata->>'category' = 'laptop';
```

## Performance Considerations

### Connection Pooling

```python
# Example with Python and PostgreSQL
import psycopg2.pool

# Create connection pool
connection_pool = psycopg2.pool.ThreadedConnectionPool(
    minconn=5,
    maxconn=20,
    host="localhost",
    database="mydb",
    user="user",
    password="password"
)

def execute_query(query, params=None):
    conn = connection_pool.getconn()
    try:
        with conn.cursor() as cursor:
            cursor.execute(query, params)
            return cursor.fetchall()
    finally:
        connection_pool.putconn(conn)
```

### Query Caching

```sql
-- PostgreSQL shared_preload_libraries configuration
shared_preload_libraries = 'pg_stat_statements'

-- Monitor query performance
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

## Best Practices

### Schema Design
- Use appropriate data types (INT vs BIGINT, VARCHAR vs TEXT)
- Define proper constraints and foreign keys
- Consider partitioning for large tables
- Plan for future schema evolution

### Performance
- Monitor slow queries regularly
- Use connection pooling
- Implement proper indexing strategy
- Consider read replicas for read-heavy workloads

### Security
- Use parameterized queries to prevent SQL injection
- Implement proper authentication and authorization
- Encrypt sensitive data at rest and in transit
- Regular security updates and patches

## When to Choose Relational Databases

**Ideal For:**
- Applications requiring ACID transactions
- Complex relationships between entities
- Strong consistency requirements
- Mature tooling and expertise availability
- Regulatory compliance needs

**Consider Alternatives When:**
- Extremely high write throughput needed
- Flexible schema requirements
- Horizontal scaling is primary concern
- Simple key-value or document storage sufficient

## Summary

Relational databases remain a solid choice for many applications due to their:
- **Mature ecosystem** with extensive tooling and expertise
- **ACID guarantees** ensuring data consistency
- **Powerful query capabilities** with SQL
- **Strong consistency** model
- **Proven scalability** patterns (though with limitations)

Understanding their strengths and limitations helps make informed decisions about when to use them versus NoSQL alternatives in your system architecture.
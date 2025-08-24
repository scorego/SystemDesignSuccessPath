# Transaction Isolation Levels

## Introduction

Transaction isolation levels define the degree to which concurrent transactions are isolated from each other. They represent a spectrum of trade-offs between data consistency and system performance, allowing developers to choose the appropriate level based on their application's requirements.

The SQL standard defines four isolation levels, each preventing different types of read phenomena that can occur when multiple transactions access the same data simultaneously. Understanding these levels is crucial for designing systems that balance data integrity with performance requirements.

Isolation levels are implemented through various concurrency control mechanisms, including locking, multi-version concurrency control (MVCC), and timestamp ordering. Each approach has different performance characteristics and is suitable for different use cases.

## Read Phenomena and Concurrency Problems

Before exploring isolation levels, let's understand the problems they're designed to prevent:

### Dirty Read

**Definition**: Reading uncommitted changes from another transaction that might be rolled back.

**Example Scenario**:
```sql
-- Time 1: Transaction A starts
BEGIN TRANSACTION A;
UPDATE accounts SET balance = 1500 WHERE account_id = 'ACC001';
-- Balance changed from 1000 to 1500, but not committed

-- Time 2: Transaction B reads uncommitted data
BEGIN TRANSACTION B;
SELECT balance FROM accounts WHERE account_id = 'ACC001';
-- Returns 1500 (dirty read)

-- Time 3: Transaction A rolls back
ROLLBACK TRANSACTION A;
-- Balance is back to 1000

-- Transaction B made decisions based on incorrect data (1500)
COMMIT TRANSACTION B;
```

**Real-World Impact**:
- **Banking**: Loan approval based on incorrect account balance
- **E-commerce**: Inventory decisions based on uncommitted stock changes
- **Reporting**: Financial reports with inaccurate data

### Non-Repeatable Read

**Definition**: Getting different values when reading the same data twice within a transaction.

**Example Scenario**:
```sql
-- Transaction A: Generating a report
BEGIN TRANSACTION A;
SELECT balance FROM accounts WHERE account_id = 'ACC001';
-- Returns 1000

-- Some business logic processing...

-- Transaction B: Updates the account (concurrent)
BEGIN TRANSACTION B;
UPDATE accounts SET balance = 1500 WHERE account_id = 'ACC001';
COMMIT TRANSACTION B;

-- Transaction A: Reads the same data again
SELECT balance FROM accounts WHERE account_id = 'ACC001';
-- Returns 1500 (different from first read)
COMMIT TRANSACTION A;
```

**Real-World Impact**:
- **Financial Reports**: Inconsistent totals within the same report
- **Audit Trails**: Data changes during audit process
- **Batch Processing**: Inconsistent calculations within a batch

### Phantom Read

**Definition**: New rows appearing or disappearing between reads when using range queries.

**Example Scenario**:
```sql
-- Transaction A: Counting high-value accounts
BEGIN TRANSACTION A;
SELECT COUNT(*) FROM accounts WHERE balance > 10000;
-- Returns 5

-- Transaction B: Adds a new high-value account (concurrent)
BEGIN TRANSACTION B;
INSERT INTO accounts (account_id, balance) VALUES ('ACC999', 15000);
COMMIT TRANSACTION B;

-- Transaction A: Counts again with same criteria
SELECT COUNT(*) FROM accounts WHERE balance > 10000;
-- Returns 6 (phantom row appeared)
COMMIT TRANSACTION A;
```

**Real-World Impact**:
- **Pagination**: Inconsistent page results
- **Aggregation**: Changing totals during calculation
- **Batch Processing**: Processing different record sets

### Lost Update

**Definition**: One transaction's update overwrites another transaction's update.

**Example Scenario**:
```sql
-- Both transactions read the same initial value
-- Transaction A
BEGIN TRANSACTION A;
SELECT balance FROM accounts WHERE account_id = 'ACC001'; -- Returns 1000

-- Transaction B (concurrent)
BEGIN TRANSACTION B;
SELECT balance FROM accounts WHERE account_id = 'ACC001'; -- Returns 1000

-- Both update based on the same initial value
-- Transaction A: Add 100
UPDATE accounts SET balance = 1100 WHERE account_id = 'ACC001';
COMMIT TRANSACTION A;

-- Transaction B: Add 200 (overwrites A's change)
UPDATE accounts SET balance = 1200 WHERE account_id = 'ACC001';
COMMIT TRANSACTION B;

-- Final balance: 1200 (should be 1300)
-- Transaction A's update is lost
```

## The Four SQL Isolation Levels

### Read Uncommitted (Level 0)

**Definition**: The lowest isolation level where transactions can read uncommitted changes from other transactions.

**Prevents**: None of the read phenomena
**Allows**: Dirty reads, non-repeatable reads, phantom reads

**Characteristics**:
- No read locks are acquired
- Write locks are held until transaction completion
- Highest performance, lowest consistency

**Implementation Example**:
```sql
-- PostgreSQL
BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
SELECT * FROM accounts WHERE balance > 1000;
-- May see uncommitted changes from other transactions
COMMIT;

-- MySQL
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
START TRANSACTION;
SELECT * FROM accounts WHERE balance > 1000;
COMMIT;
```

**Use Cases**:
- **Approximate Reporting**: Dashboard metrics where exact accuracy isn't critical
- **Data Warehousing**: ETL processes reading from OLTP systems
- **Monitoring Systems**: Real-time metrics that can tolerate some inaccuracy

**Example - Real-Time Dashboard**:
```javascript
// Acceptable for dashboard showing approximate user counts
const getDashboardMetrics = async () => {
  // Fast, potentially dirty reads for real-time feel
  const query = `
    SELECT 
      COUNT(*) as active_users,
      AVG(session_duration) as avg_session
    FROM user_sessions 
    WHERE last_activity > NOW() - INTERVAL '5 minutes'
  `;
  
  return await db.query(query, {
    isolationLevel: 'READ UNCOMMITTED'
  });
};
```

### Read Committed (Level 1)

**Definition**: Transactions can only read committed data, but the data can change between reads within the same transaction.

**Prevents**: Dirty reads
**Allows**: Non-repeatable reads, phantom reads

**Characteristics**:
- Read locks are acquired and released immediately after each statement
- Write locks are held until transaction completion
- Default isolation level for most databases

**Implementation Example**:
```sql
-- PostgreSQL (default)
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
SELECT balance FROM accounts WHERE account_id = 'ACC001'; -- 1000
-- Another transaction commits a change
SELECT balance FROM accounts WHERE account_id = 'ACC001'; -- 1500 (changed)
COMMIT;
```

**MVCC Implementation**:
```sql
-- PostgreSQL uses MVCC for Read Committed
-- Each transaction sees a consistent snapshot at statement level
BEGIN;
SELECT balance, xmin FROM accounts WHERE account_id = 'ACC001';
-- xmin shows the transaction ID that created this version
```

**Use Cases**:
- **Web Applications**: Most CRUD operations where slight inconsistencies are acceptable
- **E-commerce**: Product browsing, user profiles, non-critical updates
- **Content Management**: Blog posts, comments, user-generated content

**Example - E-commerce Product Listing**:
```javascript
const getProductListing = async (categoryId, page) => {
  // Read committed is sufficient for product browsing
  // Users can tolerate if product count changes between page loads
  const products = await db.query(`
    SELECT product_id, name, price, stock_quantity
    FROM products 
    WHERE category_id = $1 
    ORDER BY popularity DESC
    LIMIT 20 OFFSET $2
  `, [categoryId, page * 20], {
    isolationLevel: 'READ COMMITTED'
  });
  
  return products;
};
```

### Repeatable Read (Level 2)

**Definition**: Ensures that if a transaction reads a row, subsequent reads of the same row within the transaction will return the same value.

**Prevents**: Dirty reads, non-repeatable reads
**Allows**: Phantom reads

**Characteristics**:
- Read locks are held until transaction completion
- Write locks are held until transaction completion
- Consistent snapshot of data for the entire transaction

**Implementation Example**:
```sql
-- PostgreSQL
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
SELECT balance FROM accounts WHERE account_id = 'ACC001'; -- 1000
-- Another transaction commits a change to this account
SELECT balance FROM accounts WHERE account_id = 'ACC001'; -- Still 1000
-- But new accounts might appear in range queries
SELECT COUNT(*) FROM accounts WHERE balance > 500; -- May change
COMMIT;
```

**Snapshot Isolation**:
```sql
-- PostgreSQL implements Repeatable Read using Snapshot Isolation
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
-- Transaction sees a consistent snapshot from this point
SELECT txid_current_snapshot(); -- Shows the snapshot details
```

**Use Cases**:
- **Financial Reports**: Ensuring consistent data throughout report generation
- **Batch Processing**: Processing a consistent set of data
- **Data Migration**: Ensuring referential integrity during migration

**Example - Financial Report Generation**:
```javascript
const generateMonthlyReport = async (month, year) => {
  // Need consistent data throughout report generation
  const transaction = await db.beginTransaction({
    isolationLevel: 'REPEATABLE READ'
  });
  
  try {
    // All these queries see the same consistent snapshot
    const totalRevenue = await transaction.query(`
      SELECT SUM(amount) FROM transactions 
      WHERE EXTRACT(MONTH FROM created_at) = $1 
      AND EXTRACT(YEAR FROM created_at) = $2
    `, [month, year]);
    
    const customerCount = await transaction.query(`
      SELECT COUNT(DISTINCT customer_id) FROM transactions
      WHERE EXTRACT(MONTH FROM created_at) = $1 
      AND EXTRACT(YEAR FROM created_at) = $2
    `, [month, year]);
    
    const avgOrderValue = await transaction.query(`
      SELECT AVG(amount) FROM transactions
      WHERE EXTRACT(MONTH FROM created_at) = $1 
      AND EXTRACT(YEAR FROM created_at) = $2
    `, [month, year]);
    
    await transaction.commit();
    
    return {
      month,
      year,
      totalRevenue: totalRevenue.rows[0].sum,
      customerCount: customerCount.rows[0].count,
      avgOrderValue: avgOrderValue.rows[0].avg
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
```

### Serializable (Level 3)

**Definition**: The highest isolation level that provides complete isolation, making transactions appear as if they were executed serially.

**Prevents**: Dirty reads, non-repeatable reads, phantom reads
**Allows**: None of the read phenomena

**Characteristics**:
- Strictest isolation with highest consistency guarantees
- May use predicate locking or serialization conflict detection
- Highest overhead, potential for serialization failures

**Implementation Approaches**:

**1. Two-Phase Locking (2PL)**:
```sql
-- Traditional approach with range locks
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
SELECT * FROM accounts WHERE balance > 1000;
-- Acquires predicate lock preventing new accounts with balance > 1000
```

**2. Serializable Snapshot Isolation (SSI)**:
```sql
-- PostgreSQL approach - detects serialization conflicts
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
-- Uses MVCC with conflict detection
-- May fail with serialization_failure error
```

**Handling Serialization Failures**:
```javascript
const transferMoney = async (fromAccount, toAccount, amount) => {
  let retries = 3;
  
  while (retries > 0) {
    const transaction = await db.beginTransaction({
      isolationLevel: 'SERIALIZABLE'
    });
    
    try {
      // Check sufficient balance
      const balance = await transaction.query(
        'SELECT balance FROM accounts WHERE id = $1', 
        [fromAccount]
      );
      
      if (balance.rows[0].balance < amount) {
        throw new Error('Insufficient funds');
      }
      
      // Perform transfer
      await transaction.query(
        'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
        [amount, fromAccount]
      );
      
      await transaction.query(
        'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
        [amount, toAccount]
      );
      
      await transaction.commit();
      return { success: true };
      
    } catch (error) {
      await transaction.rollback();
      
      if (error.code === '40001') { // Serialization failure
        retries--;
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, Math.random() * 100 * (4 - retries))
        );
        continue;
      }
      
      throw error;
    }
  }
  
  throw new Error('Transaction failed after retries');
};
```

**Use Cases**:
- **Financial Transactions**: Money transfers, trading systems
- **Inventory Management**: Critical stock operations
- **Audit Systems**: Ensuring complete data integrity
- **Regulatory Compliance**: Systems requiring strict consistency

## Isolation Level Comparison

| Level | Dirty Read | Non-Repeatable Read | Phantom Read | Performance | Use Cases |
|-------|------------|-------------------|--------------|-------------|-----------|
| **Read Uncommitted** | ✗ Allowed | ✗ Allowed | ✗ Allowed | ⭐⭐⭐⭐⭐ | Analytics, Monitoring |
| **Read Committed** | ✅ Prevented | ✗ Allowed | ✗ Allowed | ⭐⭐⭐⭐ | Web Apps, CRUD |
| **Repeatable Read** | ✅ Prevented | ✅ Prevented | ✗ Allowed | ⭐⭐⭐ | Reports, Batch Jobs |
| **Serializable** | ✅ Prevented | ✅ Prevented | ✅ Prevented | ⭐⭐ | Financial, Critical |

## Database-Specific Implementations

### PostgreSQL
```sql
-- Default: Read Committed
-- Repeatable Read uses Snapshot Isolation
-- Serializable uses Serializable Snapshot Isolation (SSI)

SET default_transaction_isolation = 'repeatable read';
BEGIN;
-- Transaction uses repeatable read
```

### MySQL (InnoDB)
```sql
-- Default: Repeatable Read
-- Uses MVCC with gap locking for Repeatable Read
-- Serializable uses locking reads

SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;
START TRANSACTION;
-- Transaction uses read committed
```

### Oracle
```sql
-- Default: Read Committed
-- Uses MVCC extensively
-- Serializable mode available

ALTER SESSION SET ISOLATION_LEVEL = SERIALIZABLE;
```

### SQL Server
```sql
-- Default: Read Committed
-- Supports snapshot isolation as alternative
-- Row versioning available

SET TRANSACTION ISOLATION LEVEL SNAPSHOT;
BEGIN TRANSACTION;
```

## Choosing the Right Isolation Level

### Decision Framework

**1. Analyze Consistency Requirements**:
```javascript
const analyzeConsistencyNeeds = (operation) => {
  const requirements = {
    financial: 'SERIALIZABLE',      // Money must be exact
    inventory: 'REPEATABLE READ',   // Stock levels need consistency
    userProfile: 'READ COMMITTED', // Minor inconsistencies OK
    analytics: 'READ UNCOMMITTED'  // Speed over accuracy
  };
  
  return requirements[operation.type] || 'READ COMMITTED';
};
```

**2. Consider Performance Impact**:
```javascript
const performanceMetrics = {
  'READ UNCOMMITTED': { latency: 'lowest', throughput: 'highest', locks: 'none' },
  'READ COMMITTED': { latency: 'low', throughput: 'high', locks: 'minimal' },
  'REPEATABLE READ': { latency: 'medium', throughput: 'medium', locks: 'moderate' },
  'SERIALIZABLE': { latency: 'high', throughput: 'low', locks: 'extensive' }
};
```

**3. Application-Level Strategies**:
```javascript
// Mixed isolation levels within same application
const userService = {
  // Critical operations
  async transferMoney(from, to, amount) {
    return await db.transaction({ isolation: 'SERIALIZABLE' }, async (tx) => {
      // Money transfer logic
    });
  },
  
  // Regular operations  
  async updateProfile(userId, data) {
    return await db.transaction({ isolation: 'READ COMMITTED' }, async (tx) => {
      // Profile update logic
    });
  },
  
  // Analytics operations
  async getDashboardStats() {
    return await db.query(sql, { isolation: 'READ UNCOMMITTED' });
  }
};
```

## Best Practices

### 1. Start with Read Committed
```javascript
// Use Read Committed as default, upgrade when needed
const defaultConfig = {
  isolationLevel: 'READ COMMITTED',
  timeout: 30000,
  retryOnConflict: true
};
```

### 2. Handle Serialization Failures
```javascript
const withRetry = async (operation, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (error.code === 'SERIALIZATION_FAILURE' && i < maxRetries - 1) {
        await sleep(Math.random() * 100 * Math.pow(2, i));
        continue;
      }
      throw error;
    }
  }
};
```

### 3. Monitor Lock Contention
```sql
-- PostgreSQL: Monitor lock waits
SELECT 
  blocked_locks.pid AS blocked_pid,
  blocked_activity.usename AS blocked_user,
  blocking_locks.pid AS blocking_pid,
  blocking_activity.usename AS blocking_user,
  blocked_activity.query AS blocked_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity 
  ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks 
  ON blocking_locks.locktype = blocked_locks.locktype
WHERE NOT blocked_locks.granted;
```

### 4. Use Connection Pooling Wisely
```javascript
// Different pools for different isolation levels
const pools = {
  serializable: new Pool({ 
    max: 5,  // Fewer connections for high-isolation
    isolationLevel: 'SERIALIZABLE'
  }),
  readCommitted: new Pool({ 
    max: 20, // More connections for regular operations
    isolationLevel: 'READ COMMITTED'
  })
};
```

## Summary

Transaction isolation levels provide a spectrum of consistency vs performance trade-offs:

- **Read Uncommitted**: Maximum performance, minimal consistency guarantees
- **Read Committed**: Good balance for most web applications
- **Repeatable Read**: Consistent snapshots for reports and batch processing
- **Serializable**: Maximum consistency for critical operations

**Key Takeaways**:
1. Choose isolation level based on business requirements, not technical preferences
2. Higher isolation levels provide stronger guarantees but lower performance
3. Handle serialization failures gracefully with retry logic
4. Monitor lock contention and adjust isolation levels as needed
5. Consider using different isolation levels for different operations

**Next**: Learn about [Distributed Transactions](04-distributed-transactions.md) and the challenges of maintaining consistency across multiple systems.

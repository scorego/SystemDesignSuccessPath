# Database Scaling Strategies

## Overview

Database scaling is one of the most critical aspects of system design. As applications grow, databases often become the bottleneck. Understanding various scaling strategies helps design systems that can handle increasing load while maintaining performance and reliability.

## Vertical Scaling (Scale Up)

### Concept
Increasing the capacity of a single database server by adding more CPU, RAM, or storage.

```mermaid
graph TD
    A[Application] --> B[Single Database Server]
    B --> C[CPU: 4 cores → 16 cores]
    B --> D[RAM: 16GB → 128GB]
    B --> E[Storage: HDD → NVMe SSD]
```

### Implementation Example

```sql
-- PostgreSQL configuration for high-performance server
-- postgresql.conf optimizations

# Memory settings
shared_buffers = 32GB                    # 25% of total RAM
effective_cache_size = 96GB              # 75% of total RAM
work_mem = 256MB                         # Per query operation
maintenance_work_mem = 2GB               # For maintenance operations

# Connection settings
max_connections = 200                    # Limit concurrent connections
shared_preload_libraries = 'pg_stat_statements'

# Write-ahead logging
wal_buffers = 64MB
checkpoint_completion_target = 0.9
wal_compression = on

# Query optimization
random_page_cost = 1.1                   # For SSD storage
effective_io_concurrency = 200           # For SSD storage
```

### Advantages and Limitations

| Advantages | Limitations |
|------------|-------------|
| Simple to implement | Hardware limits |
| No application changes | Single point of failure |
| ACID properties maintained | Expensive at scale |
| Familiar tooling | Downtime for upgrades |

## Horizontal Scaling (Scale Out)

### Read Replicas

**Master-Slave Replication**

```mermaid
graph TD
    A[Application] --> B[Master DB<br/>Writes Only]
    A --> C[Read Replica 1]
    A --> D[Read Replica 2]
    A --> E[Read Replica 3]
    B -.->|Async Replication| C
    B -.->|Async Replication| D
    B -.->|Async Replication| E
```

**MySQL Master-Slave Setup**

```sql
-- Master configuration (my.cnf)
[mysqld]
server-id = 1
log-bin = mysql-bin
binlog-format = ROW
gtid-mode = ON
enforce-gtid-consistency = ON

-- Create replication user
CREATE USER 'replication'@'%' IDENTIFIED BY 'password';
GRANT REPLICATION SLAVE ON *.* TO 'replication'@'%';

-- Slave configuration
[mysqld]
server-id = 2
relay-log = relay-bin
read-only = 1
gtid-mode = ON
enforce-gtid-consistency = ON

-- Start replication on slave
CHANGE MASTER TO
    MASTER_HOST='master-server',
    MASTER_USER='replication',
    MASTER_PASSWORD='password',
    MASTER_AUTO_POSITION=1;
START SLAVE;
```

**Application-Level Read/Write Splitting**

```python
import random
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

class DatabaseRouter:
    def __init__(self):
        # Master for writes
        self.master_engine = create_engine('postgresql://user:pass@master:5432/db')
        
        # Read replicas
        self.read_engines = [
            create_engine('postgresql://user:pass@replica1:5432/db'),
            create_engine('postgresql://user:pass@replica2:5432/db'),
            create_engine('postgresql://user:pass@replica3:5432/db')
        ]
        
        self.MasterSession = sessionmaker(bind=self.master_engine)
        self.ReadSessions = [sessionmaker(bind=engine) for engine in self.read_engines]
    
    def get_write_session(self):
        return self.MasterSession()
    
    def get_read_session(self):
        # Load balance across read replicas
        session_class = random.choice(self.ReadSessions)
        return session_class()

# Usage example
db_router = DatabaseRouter()

# Write operations
with db_router.get_write_session() as session:
    user = User(name="John", email="john@example.com")
    session.add(user)
    session.commit()

# Read operations
with db_router.get_read_session() as session:
    users = session.query(User).filter(User.status == 'active').all()
```

### Master-Master Replication

```mermaid
graph TD
    A[Application] --> B[Master 1]
    A --> C[Master 2]
    B <-.->|Bidirectional<br/>Replication| C
    B --> D[Read Replica 1A]
    B --> E[Read Replica 1B]
    C --> F[Read Replica 2A]
    C --> G[Read Replica 2B]
```

**Conflict Resolution Strategies**

```sql
-- MySQL auto-increment offset for multi-master
-- Master 1 configuration
auto_increment_increment = 2
auto_increment_offset = 1

-- Master 2 configuration  
auto_increment_increment = 2
auto_increment_offset = 2

-- This ensures Master 1 uses odd IDs (1,3,5...) and Master 2 uses even IDs (2,4,6...)
```

## Database Sharding

### Horizontal Partitioning Strategies

**Range-Based Sharding**

```mermaid
graph TD
    A[Application] --> B[Shard Router]
    B --> C[Shard 1<br/>user_id: 1-1000000]
    B --> D[Shard 2<br/>user_id: 1000001-2000000]
    B --> E[Shard 3<br/>user_id: 2000001-3000000]
    B --> F[Shard N<br/>user_id: N...]
```

```python
class RangeShardRouter:
    def __init__(self):
        self.shards = {
            'shard1': {'min': 1, 'max': 1000000, 'connection': 'postgresql://shard1:5432/db'},
            'shard2': {'min': 1000001, 'max': 2000000, 'connection': 'postgresql://shard2:5432/db'},
            'shard3': {'min': 2000001, 'max': 3000000, 'connection': 'postgresql://shard3:5432/db'}
        }
    
    def get_shard(self, user_id):
        for shard_name, config in self.shards.items():
            if config['min'] <= user_id <= config['max']:
                return shard_name, config['connection']
        raise ValueError(f"No shard found for user_id: {user_id}")
    
    def execute_query(self, user_id, query, params=None):
        shard_name, connection_string = self.get_shard(user_id)
        engine = create_engine(connection_string)
        with engine.connect() as conn:
            return conn.execute(query, params or {})
```

**Hash-Based Sharding**

```python
import hashlib

class HashShardRouter:
    def __init__(self, shard_count=4):
        self.shard_count = shard_count
        self.shards = {
            i: f'postgresql://shard{i}:5432/db' 
            for i in range(shard_count)
        }
    
    def get_shard(self, key):
        # Consistent hashing
        hash_value = int(hashlib.md5(str(key).encode()).hexdigest(), 16)
        shard_id = hash_value % self.shard_count
        return shard_id, self.shards[shard_id]
    
    def execute_query(self, key, query, params=None):
        shard_id, connection_string = self.get_shard(key)
        engine = create_engine(connection_string)
        with engine.connect() as conn:
            return conn.execute(query, params or {})

# Usage
router = HashShardRouter(shard_count=4)
shard_id, connection = router.get_shard("user123")
```

**Directory-Based Sharding**

```python
class DirectoryShardRouter:
    def __init__(self):
        # Lookup service that maps keys to shards
        self.directory = {}
        self.shards = {
            'shard1': 'postgresql://shard1:5432/db',
            'shard2': 'postgresql://shard2:5432/db',
            'shard3': 'postgresql://shard3:5432/db'
        }
    
    def register_key(self, key, shard_name):
        """Register which shard contains a specific key"""
        self.directory[key] = shard_name
    
    def get_shard(self, key):
        shard_name = self.directory.get(key)
        if not shard_name:
            raise ValueError(f"Key {key} not found in directory")
        return shard_name, self.shards[shard_name]
    
    def migrate_key(self, key, new_shard):
        """Move a key to a different shard"""
        old_shard = self.directory.get(key)
        if old_shard:
            # 1. Copy data to new shard
            # 2. Update directory
            self.directory[key] = new_shard
            # 3. Remove from old shard
            pass
```

### Cross-Shard Operations

**Scatter-Gather Pattern**

```python
import asyncio
import aiopg

class ScatterGatherQuery:
    def __init__(self, shard_connections):
        self.shard_connections = shard_connections
    
    async def execute_across_shards(self, query, params=None):
        """Execute query across all shards and aggregate results"""
        tasks = []
        
        for shard_name, connection_string in self.shard_connections.items():
            task = self.execute_on_shard(shard_name, connection_string, query, params)
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Aggregate results
        aggregated = []
        for result in results:
            if isinstance(result, Exception):
                print(f"Shard query failed: {result}")
                continue
            aggregated.extend(result)
        
        return aggregated
    
    async def execute_on_shard(self, shard_name, connection_string, query, params):
        try:
            async with aiopg.connect(connection_string) as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute(query, params)
                    return await cursor.fetchall()
        except Exception as e:
            print(f"Error querying shard {shard_name}: {e}")
            return []

# Usage example
async def get_user_stats():
    scatter_gather = ScatterGatherQuery({
        'shard1': 'postgresql://shard1:5432/db',
        'shard2': 'postgresql://shard2:5432/db',
        'shard3': 'postgresql://shard3:5432/db'
    })
    
    # Get total user count across all shards
    results = await scatter_gather.execute_across_shards(
        "SELECT COUNT(*) FROM users WHERE status = %s",
        ('active',)
    )
    
    total_users = sum(row[0] for row in results)
    return total_users
```

## Federation (Functional Partitioning)

### Splitting by Service Boundaries

```mermaid
graph TD
    A[Application] --> B[User Service DB]
    A --> C[Order Service DB]
    A --> D[Product Service DB]
    A --> E[Payment Service DB]
    
    B --> F[Users, Profiles, Auth]
    C --> G[Orders, Order Items]
    D --> H[Products, Inventory]
    E --> I[Payments, Transactions]
```

**Microservices Database Pattern**

```python
# User Service
class UserService:
    def __init__(self):
        self.db = create_engine('postgresql://user-db:5432/users')
    
    def create_user(self, user_data):
        with self.db.connect() as conn:
            result = conn.execute(
                "INSERT INTO users (name, email) VALUES (%s, %s) RETURNING id",
                (user_data['name'], user_data['email'])
            )
            return result.fetchone()[0]

# Order Service
class OrderService:
    def __init__(self):
        self.db = create_engine('postgresql://order-db:5432/orders')
        self.user_service = UserService()
    
    def create_order(self, user_id, items):
        # Validate user exists (cross-service call)
        user = self.user_service.get_user(user_id)
        if not user:
            raise ValueError("User not found")
        
        with self.db.connect() as conn:
            # Create order
            order_result = conn.execute(
                "INSERT INTO orders (user_id, total) VALUES (%s, %s) RETURNING id",
                (user_id, sum(item['price'] for item in items))
            )
            order_id = order_result.fetchone()[0]
            
            # Add order items
            for item in items:
                conn.execute(
                    "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (%s, %s, %s, %s)",
                    (order_id, item['product_id'], item['quantity'], item['price'])
                )
            
            return order_id
```

## Database Clustering

### PostgreSQL Streaming Replication

```bash
# Primary server configuration (postgresql.conf)
wal_level = replica
max_wal_senders = 3
wal_keep_segments = 64
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/archive/%f'

# Create replication user
sudo -u postgres psql -c "CREATE USER replicator REPLICATION LOGIN CONNECTION LIMIT 1 ENCRYPTED PASSWORD 'password';"
```

```bash
# Standby server setup
# 1. Stop PostgreSQL on standby
sudo systemctl stop postgresql

# 2. Remove existing data directory
sudo rm -rf /var/lib/postgresql/12/main/*

# 3. Create base backup from primary
sudo -u postgres pg_basebackup -h primary-server -D /var/lib/postgresql/12/main -U replicator -v -P -W

# 4. Create recovery.conf
sudo -u postgres cat > /var/lib/postgresql/12/main/recovery.conf << EOF
standby_mode = 'on'
primary_conninfo = 'host=primary-server port=5432 user=replicator password=password'
trigger_file = '/tmp/postgresql.trigger'
EOF

# 5. Start standby server
sudo systemctl start postgresql
```

### MySQL Group Replication

```sql
-- Configure Group Replication on all nodes
SET SQL_LOG_BIN=0;
CREATE USER 'repl'@'%' IDENTIFIED BY 'password';
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'%';
FLUSH PRIVILEGES;
SET SQL_LOG_BIN=1;

-- Install Group Replication plugin
INSTALL PLUGIN group_replication SONAME 'group_replication.so';

-- Configure group replication settings
SET GLOBAL group_replication_group_name="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
SET GLOBAL group_replication_start_on_boot=off;
SET GLOBAL group_replication_local_address= "node1:33061";
SET GLOBAL group_replication_group_seeds= "node1:33061,node2:33061,node3:33061";
SET GLOBAL group_replication_bootstrap_group=on;

-- Start group replication
START GROUP_REPLICATION;
```

## Caching Strategies for Database Scaling

### Application-Level Caching

```python
import redis
import json
from functools import wraps

class DatabaseCache:
    def __init__(self):
        self.redis_client = redis.Redis(host='localhost', port=6379, db=0)
        self.default_ttl = 3600  # 1 hour
    
    def cache_query(self, ttl=None):
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                # Create cache key from function name and arguments
                cache_key = f"{func.__name__}:{hash(str(args) + str(kwargs))}"
                
                # Try to get from cache
                cached_result = self.redis_client.get(cache_key)
                if cached_result:
                    return json.loads(cached_result)
                
                # Execute query and cache result
                result = func(*args, **kwargs)
                self.redis_client.setex(
                    cache_key, 
                    ttl or self.default_ttl, 
                    json.dumps(result, default=str)
                )
                return result
            return wrapper
        return decorator

# Usage
cache = DatabaseCache()

@cache.cache_query(ttl=1800)  # Cache for 30 minutes
def get_user_profile(user_id):
    with db.connect() as conn:
        result = conn.execute(
            "SELECT id, name, email, profile_data FROM users WHERE id = %s",
            (user_id,)
        )
        return dict(result.fetchone())
```

### Query Result Caching

```python
class QueryCache:
    def __init__(self, redis_client):
        self.redis = redis_client
    
    def get_or_set(self, query, params, ttl=3600):
        # Create deterministic cache key
        cache_key = f"query:{hashlib.md5((query + str(params)).encode()).hexdigest()}"
        
        # Try cache first
        cached = self.redis.get(cache_key)
        if cached:
            return json.loads(cached)
        
        # Execute query
        with db.connect() as conn:
            result = conn.execute(query, params).fetchall()
            result_list = [dict(row) for row in result]
        
        # Cache result
        self.redis.setex(cache_key, ttl, json.dumps(result_list, default=str))
        return result_list

# Usage
query_cache = QueryCache(redis.Redis())

def get_popular_products():
    return query_cache.get_or_set(
        "SELECT * FROM products WHERE rating > 4.0 ORDER BY sales_count DESC LIMIT 20",
        {},
        ttl=1800  # Cache for 30 minutes
    )
```

## Performance Monitoring and Optimization

### Database Metrics to Monitor

```python
import psutil
import psycopg2
from datetime import datetime

class DatabaseMonitor:
    def __init__(self, connection_string):
        self.conn_string = connection_string
    
    def get_connection_stats(self):
        with psycopg2.connect(self.conn_string) as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        state,
                        COUNT(*) as connection_count
                    FROM pg_stat_activity 
                    WHERE datname = current_database()
                    GROUP BY state
                """)
                return dict(cursor.fetchall())
    
    def get_slow_queries(self, min_duration_ms=1000):
        with psycopg2.connect(self.conn_string) as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        query,
                        calls,
                        total_time,
                        mean_time,
                        rows
                    FROM pg_stat_statements 
                    WHERE mean_time > %s
                    ORDER BY total_time DESC
                    LIMIT 10
                """, (min_duration_ms,))
                return cursor.fetchall()
    
    def get_table_sizes(self):
        with psycopg2.connect(self.conn_string) as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        schemaname,
                        tablename,
                        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
                    FROM pg_tables 
                    WHERE schemaname = 'public'
                    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
                """)
                return cursor.fetchall()
    
    def get_index_usage(self):
        with psycopg2.connect(self.conn_string) as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        schemaname,
                        tablename,
                        indexname,
                        idx_tup_read,
                        idx_tup_fetch
                    FROM pg_stat_user_indexes
                    ORDER BY idx_tup_read DESC
                """)
                return cursor.fetchall()

# Usage
monitor = DatabaseMonitor("postgresql://user:pass@localhost/db")
print("Connection Stats:", monitor.get_connection_stats())
print("Slow Queries:", monitor.get_slow_queries())
print("Table Sizes:", monitor.get_table_sizes())
```

## Scaling Decision Framework

### When to Scale Vertically

```python
def should_scale_vertically(metrics):
    """
    Determine if vertical scaling is appropriate
    """
    cpu_usage = metrics.get('cpu_usage_percent', 0)
    memory_usage = metrics.get('memory_usage_percent', 0)
    disk_io_wait = metrics.get('disk_io_wait_percent', 0)
    
    # Scale vertically if:
    # - CPU usage consistently > 80%
    # - Memory usage > 85%
    # - High disk I/O wait times
    # - Single-threaded workload
    
    if cpu_usage > 80 or memory_usage > 85 or disk_io_wait > 20:
        return True, f"High resource usage: CPU={cpu_usage}%, Memory={memory_usage}%, IO Wait={disk_io_wait}%"
    
    return False, "Resource usage within acceptable limits"

def should_scale_horizontally(metrics):
    """
    Determine if horizontal scaling is needed
    """
    connection_count = metrics.get('active_connections', 0)
    max_connections = metrics.get('max_connections', 100)
    read_write_ratio = metrics.get('read_write_ratio', 1)
    
    # Scale horizontally if:
    # - Connection pool exhaustion
    # - Read-heavy workload (ratio > 3:1)
    # - Geographic distribution needed
    
    if connection_count > (max_connections * 0.8):
        return True, f"Connection pool near capacity: {connection_count}/{max_connections}"
    
    if read_write_ratio > 3:
        return True, f"Read-heavy workload detected: {read_write_ratio}:1 ratio"
    
    return False, "Horizontal scaling not immediately needed"
```

### Scaling Implementation Checklist

```python
class ScalingPlan:
    def __init__(self):
        self.steps = []
    
    def add_step(self, step, estimated_time, risk_level):
        self.steps.append({
            'step': step,
            'estimated_time': estimated_time,
            'risk_level': risk_level,
            'completed': False
        })
    
    def create_read_replica_plan(self):
        self.add_step("Set up monitoring and alerting", "2 hours", "Low")
        self.add_step("Configure master for replication", "1 hour", "Medium")
        self.add_step("Create read replica instance", "30 minutes", "Low")
        self.add_step("Test replication lag", "1 hour", "Low")
        self.add_step("Update application connection logic", "4 hours", "High")
        self.add_step("Deploy with feature flag", "1 hour", "Medium")
        self.add_step("Monitor and validate performance", "24 hours", "Low")
        return self
    
    def create_sharding_plan(self):
        self.add_step("Analyze data distribution patterns", "8 hours", "Low")
        self.add_step("Design shard key strategy", "4 hours", "High")
        self.add_step("Implement shard routing logic", "16 hours", "High")
        self.add_step("Create migration scripts", "8 hours", "Medium")
        self.add_step("Set up shard infrastructure", "4 hours", "Medium")
        self.add_step("Migrate data in batches", "48 hours", "High")
        self.add_step("Update application queries", "24 hours", "High")
        self.add_step("Test cross-shard operations", "8 hours", "Medium")
        return self
```

## Best Practices

### Planning and Design
- **Understand your data access patterns** before choosing scaling strategy
- **Start with vertical scaling** for simplicity when possible
- **Plan for read replicas** early in read-heavy applications
- **Design shard keys carefully** to avoid hotspots
- **Consider eventual consistency** implications in distributed setups

### Implementation
- **Use connection pooling** to manage database connections efficiently
- **Implement proper monitoring** before scaling issues occur
- **Test failover scenarios** regularly
- **Plan for data migration** with minimal downtime
- **Use feature flags** for gradual rollout of scaling changes

### Operations
- **Monitor replication lag** in master-slave setups
- **Implement automated failover** for high availability
- **Regular backup and recovery testing**
- **Capacity planning** based on growth projections
- **Document runbooks** for scaling operations

## Summary

Database scaling requires careful consideration of:

- **Vertical scaling** for immediate performance gains with minimal complexity
- **Read replicas** for read-heavy workloads and geographic distribution
- **Sharding** for massive scale but with significant complexity
- **Federation** for service-oriented architectures
- **Caching strategies** to reduce database load
- **Monitoring and alerting** to make informed scaling decisions

The key is to scale incrementally, starting with simpler solutions and moving to more complex ones as requirements demand, always considering the trade-offs between performance, consistency, and operational complexity.
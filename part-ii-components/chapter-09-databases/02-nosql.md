# NoSQL Databases

## Overview

NoSQL databases emerged to address limitations of relational databases in handling large-scale, distributed systems with varying data models. They sacrifice some ACID properties for improved scalability, flexibility, and performance in specific use cases.

## NoSQL Categories

### Document Databases

**Characteristics:**
- Store data as documents (JSON, BSON, XML)
- Flexible schema within documents
- Support for nested structures and arrays

**Popular Examples:** MongoDB, CouchDB, Amazon DocumentDB

```javascript
// MongoDB document example
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "user_id": "user123",
  "profile": {
    "name": "John Doe",
    "email": "john@example.com",
    "preferences": {
      "theme": "dark",
      "notifications": true
    }
  },
  "orders": [
    {
      "order_id": "ord_001",
      "total": 99.99,
      "items": ["laptop", "mouse"]
    }
  ],
  "created_at": ISODate("2024-01-15T10:30:00Z")
}
```

**MongoDB Operations:**
```javascript
// Insert document
db.users.insertOne({
  user_id: "user456",
  profile: { name: "Jane Smith", email: "jane@example.com" },
  tags: ["premium", "verified"]
});

// Query with nested fields
db.users.find({ "profile.email": "john@example.com" });

// Update nested field
db.users.updateOne(
  { user_id: "user123" },
  { $set: { "profile.preferences.theme": "light" } }
);

// Array operations
db.users.updateOne(
  { user_id: "user123" },
  { $push: { tags: "vip" } }
);
```

### Key-Value Stores

**Characteristics:**
- Simple key-value pairs
- Extremely fast lookups
- Minimal query capabilities
- Horizontal scaling

**Popular Examples:** Redis, Amazon DynamoDB, Riak

```python
# Redis examples
import redis

r = redis.Redis(host='localhost', port=6379, db=0)

# Basic operations
r.set('user:123:name', 'John Doe')
r.set('user:123:email', 'john@example.com')
name = r.get('user:123:name')

# Hash operations
r.hset('user:123', mapping={
    'name': 'John Doe',
    'email': 'john@example.com',
    'age': 30
})

# List operations (for activity feeds)
r.lpush('user:123:activities', 'logged_in')
r.lpush('user:123:activities', 'viewed_product')
activities = r.lrange('user:123:activities', 0, 9)  # Last 10 activities

# Set operations (for tags, followers)
r.sadd('user:123:tags', 'premium', 'verified')
r.sadd('user:456:followers', 'user123', 'user789')

# Expiration
r.setex('session:abc123', 3600, 'user123')  # Expires in 1 hour
```

### Column-Family (Wide-Column)

**Characteristics:**
- Data stored in column families
- Flexible columns per row
- Optimized for write-heavy workloads
- Time-series data friendly

**Popular Examples:** Cassandra, HBase, Amazon DynamoDB

```cql
-- Cassandra example
CREATE KEYSPACE ecommerce WITH replication = {
  'class': 'SimpleStrategy',
  'replication_factor': 3
};

CREATE TABLE user_activities (
    user_id UUID,
    activity_time TIMESTAMP,
    activity_type TEXT,
    details MAP<TEXT, TEXT>,
    PRIMARY KEY (user_id, activity_time)
) WITH CLUSTERING ORDER BY (activity_time DESC);

-- Insert data
INSERT INTO user_activities (user_id, activity_time, activity_type, details)
VALUES (uuid(), '2024-01-15 10:30:00', 'page_view', 
        {'page': '/products', 'duration': '45'});

-- Query recent activities
SELECT * FROM user_activities 
WHERE user_id = 550e8400-e29b-41d4-a716-446655440000
AND activity_time > '2024-01-01'
LIMIT 100;
```

### Graph Databases

**Characteristics:**
- Nodes and relationships as first-class citizens
- Optimized for traversing connections
- Complex relationship queries
- Social networks, recommendation engines

**Popular Examples:** Neo4j, Amazon Neptune, ArangoDB

```cypher
// Neo4j Cypher examples

// Create nodes and relationships
CREATE (john:User {name: 'John Doe', email: 'john@example.com'})
CREATE (jane:User {name: 'Jane Smith', email: 'jane@example.com'})
CREATE (product:Product {name: 'Laptop', price: 999.99})

CREATE (john)-[:FOLLOWS]->(jane)
CREATE (john)-[:PURCHASED]->(product)
CREATE (jane)-[:VIEWED]->(product)

// Find friends of friends
MATCH (user:User {name: 'John Doe'})-[:FOLLOWS]->(friend)-[:FOLLOWS]->(fof)
WHERE fof <> user
RETURN fof.name AS recommendation

// Product recommendations based on purchases
MATCH (user:User {name: 'John Doe'})-[:PURCHASED]->(product)<-[:PURCHASED]-(other)
MATCH (other)-[:PURCHASED]->(recommendation)
WHERE NOT (user)-[:PURCHASED]->(recommendation)
RETURN recommendation.name, COUNT(*) AS score
ORDER BY score DESC
LIMIT 5
```

## NoSQL Database Comparison

| Type | Examples | Best For | Limitations |
|------|----------|----------|-------------|
| **Document** | MongoDB, CouchDB | Content management, catalogs, user profiles | Limited cross-document transactions |
| **Key-Value** | Redis, DynamoDB | Caching, session storage, real-time recommendations | Simple queries only |
| **Column-Family** | Cassandra, HBase | Time-series, IoT data, high-write workloads | Learning curve, eventual consistency |
| **Graph** | Neo4j, Neptune | Social networks, fraud detection, recommendations | Not suitable for simple data models |

## CAP Theorem and NoSQL

```mermaid
graph TD
    A[CAP Theorem] --> B[Consistency]
    A --> C[Availability]
    A --> D[Partition Tolerance]
    
    B --> E[MongoDB<br/>Strong Consistency]
    C --> F[Cassandra<br/>High Availability]
    D --> G[All Distributed<br/>Systems Need This]
    
    E --> H[CP Systems<br/>Sacrifice Availability]
    F --> I[AP Systems<br/>Sacrifice Consistency]
```

### Consistency Models in NoSQL

**Strong Consistency (CP)**
```javascript
// MongoDB with write concern
db.users.insertOne(
  { name: "John", email: "john@example.com" },
  { writeConcern: { w: "majority", j: true } }
);
```

**Eventual Consistency (AP)**
```python
# Cassandra - eventually consistent reads
from cassandra.cluster import Cluster

cluster = Cluster(['127.0.0.1'])
session = cluster.connect('ecommerce')

# Write with consistency level ONE (fast, but may not be immediately consistent)
session.execute(
    "INSERT INTO users (id, name, email) VALUES (?, ?, ?)",
    [user_id, "John", "john@example.com"],
    consistency_level=ConsistencyLevel.ONE
)
```

## Data Modeling Patterns

### Document Database Patterns

**Embedding vs Referencing**

```javascript
// Embedding (denormalized) - good for 1:few relationships
{
  "_id": "order_123",
  "customer": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "items": [
    { "product": "Laptop", "price": 999.99, "quantity": 1 },
    { "product": "Mouse", "price": 29.99, "quantity": 2 }
  ]
}

// Referencing (normalized) - good for 1:many relationships
{
  "_id": "order_123",
  "customer_id": "customer_456",
  "items": ["item_789", "item_790"]
}
```

### Key-Value Patterns

**Composite Keys for Hierarchical Data**
```python
# User session data
r.hset('session:user123:2024-01-15', mapping={
    'login_time': '10:30:00',
    'last_activity': '11:45:00',
    'page_views': 15
})

# Product inventory by location
r.set('inventory:warehouse1:product123', 50)
r.set('inventory:warehouse2:product123', 25)
```

### Column-Family Patterns

**Time-Series Data Modeling**
```cql
-- Partition by time bucket for efficient queries
CREATE TABLE sensor_data (
    sensor_id UUID,
    time_bucket TEXT,  -- '2024-01-15-10' (hour bucket)
    timestamp TIMESTAMP,
    temperature DECIMAL,
    humidity DECIMAL,
    PRIMARY KEY ((sensor_id, time_bucket), timestamp)
);
```

## Performance Optimization

### MongoDB Optimization

```javascript
// Indexing strategies
db.users.createIndex({ "email": 1 })  // Single field
db.users.createIndex({ "status": 1, "created_at": -1 })  // Compound
db.users.createIndex({ "profile.location": "2dsphere" })  // Geospatial

// Aggregation pipeline optimization
db.orders.aggregate([
  { $match: { status: "completed", created_at: { $gte: new Date("2024-01-01") } } },
  { $group: { _id: "$customer_id", total_spent: { $sum: "$total" } } },
  { $sort: { total_spent: -1 } },
  { $limit: 100 }
]);
```

### Redis Optimization

```python
# Pipeline for batch operations
pipe = r.pipeline()
for i in range(1000):
    pipe.set(f'key:{i}', f'value:{i}')
pipe.execute()

# Lua scripts for atomic operations
lua_script = """
local current = redis.call('GET', KEYS[1])
if current == false or tonumber(current) < tonumber(ARGV[1]) then
    redis.call('SET', KEYS[1], ARGV[1])
    return 1
else
    return 0
end
"""
script = r.register_script(lua_script)
result = script(keys=['max_score:user123'], args=[150])
```

### Cassandra Optimization

```cql
-- Partition key design for even distribution
CREATE TABLE user_events (
    user_id UUID,
    event_date DATE,
    event_time TIMESTAMP,
    event_type TEXT,
    data TEXT,
    PRIMARY KEY ((user_id, event_date), event_time)
);

-- Batch statements for related writes
BEGIN BATCH
    INSERT INTO users (id, name, email) VALUES (?, ?, ?);
    INSERT INTO user_profiles (user_id, bio, avatar) VALUES (?, ?, ?);
    UPDATE user_stats SET total_users = total_users + 1 WHERE stat_type = 'global';
APPLY BATCH;
```

## Scaling Patterns

### Horizontal Scaling

**MongoDB Sharding**
```javascript
// Enable sharding on database
sh.enableSharding("ecommerce")

// Shard collection by user_id
sh.shardCollection("ecommerce.orders", { "user_id": 1 })

// Compound shard key for better distribution
sh.shardCollection("ecommerce.products", { "category": 1, "product_id": 1 })
```

**Cassandra Ring Architecture**
```cql
-- Replication strategy
CREATE KEYSPACE ecommerce WITH replication = {
  'class': 'NetworkTopologyStrategy',
  'datacenter1': 3,
  'datacenter2': 2
};
```

### Read Scaling

**MongoDB Read Replicas**
```javascript
// Connection with read preference
const client = new MongoClient(uri, {
  readPreference: 'secondaryPreferred',
  readConcern: { level: 'majority' }
});
```

**Redis Clustering**
```python
from rediscluster import RedisCluster

startup_nodes = [
    {"host": "127.0.0.1", "port": "7000"},
    {"host": "127.0.0.1", "port": "7001"},
    {"host": "127.0.0.1", "port": "7002"}
]

rc = RedisCluster(startup_nodes=startup_nodes, decode_responses=True)
rc.set("key", "value")
```

## Use Case Selection Guide

### When to Use Document Databases
- **Content Management Systems**: Flexible document structure
- **Product Catalogs**: Varying product attributes
- **User Profiles**: Nested user data and preferences
- **Real-time Analytics**: Flexible event data structure

### When to Use Key-Value Stores
- **Caching Layer**: Fast data retrieval
- **Session Storage**: User session data
- **Real-time Recommendations**: Quick lookups
- **Gaming Leaderboards**: Simple ranking data

### When to Use Column-Family
- **Time-Series Data**: IoT sensors, metrics, logs
- **High-Write Workloads**: Activity feeds, audit logs
- **Large-Scale Analytics**: Data warehousing scenarios
- **Distributed Systems**: Multi-datacenter deployments

### When to Use Graph Databases
- **Social Networks**: Friend relationships, connections
- **Recommendation Engines**: Complex relationship analysis
- **Fraud Detection**: Pattern recognition in transactions
- **Knowledge Graphs**: Semantic data relationships

## Migration Strategies

### SQL to NoSQL Migration

```python
# Example: Migrating user data from PostgreSQL to MongoDB
import psycopg2
import pymongo

# Source: PostgreSQL
pg_conn = psycopg2.connect("postgresql://user:pass@localhost/db")
pg_cursor = pg_conn.cursor()

# Target: MongoDB
mongo_client = pymongo.MongoClient("mongodb://localhost:27017/")
mongo_db = mongo_client.ecommerce
users_collection = mongo_db.users

# Migration script
pg_cursor.execute("""
    SELECT u.id, u.name, u.email, u.created_at,
           array_agg(o.id) as order_ids
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    GROUP BY u.id, u.name, u.email, u.created_at
""")

for row in pg_cursor.fetchall():
    user_doc = {
        "user_id": row[0],
        "name": row[1],
        "email": row[2],
        "created_at": row[3],
        "order_ids": row[4] if row[4][0] is not None else []
    }
    users_collection.insert_one(user_doc)
```

## Best Practices

### Data Modeling
- **Understand access patterns** before choosing schema
- **Denormalize for read performance** when appropriate
- **Consider data growth** and partitioning strategies
- **Plan for eventual consistency** in distributed systems

### Performance
- **Choose appropriate consistency levels** based on requirements
- **Use connection pooling** and proper client configurations
- **Monitor query performance** and optimize indexes
- **Implement proper caching strategies**

### Operations
- **Plan for backup and recovery** procedures
- **Monitor cluster health** and performance metrics
- **Implement proper security** (authentication, encryption)
- **Test disaster recovery** scenarios regularly

## Summary

NoSQL databases provide powerful alternatives to relational databases for specific use cases:

- **Document databases** excel at flexible, nested data structures
- **Key-value stores** provide ultra-fast simple lookups
- **Column-family** databases handle massive write workloads
- **Graph databases** optimize complex relationship queries

The key is understanding your data model, access patterns, and consistency requirements to choose the right tool for each component of your system architecture.
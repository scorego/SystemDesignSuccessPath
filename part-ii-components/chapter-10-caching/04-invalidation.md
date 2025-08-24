# Cache Invalidation

## Overview

Cache invalidation is one of the hardest problems in computer science. It involves determining when cached data is no longer valid and needs to be refreshed or removed. Effective invalidation strategies ensure data consistency while maintaining performance benefits.

> "There are only two hard things in Computer Science: cache invalidation and naming things." - Phil Karlton

## Time-Based Invalidation (TTL)

### Basic TTL Implementation

Time-To-Live (TTL) is the simplest invalidation strategy where cached data expires after a predetermined time.

```python
import time
import redis
import json
from typing import Optional, Any

class TTLCache:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
    
    def set_with_ttl(self, key: str, data: Any, ttl_seconds: int):
        """Set data with explicit TTL"""
        serialized = json.dumps(data, default=str)
        return self.redis.setex(key, ttl_seconds, serialized)
    
    def get_with_ttl_info(self, key: str) -> tuple:
        """Get data along with remaining TTL"""
        pipe = self.redis.pipeline()
        pipe.get(key)
        pipe.ttl(key)
        
        data, remaining_ttl = pipe.execute()
        
        if data is None:
            return None, -1
        
        return json.loads(data), remaining_ttl
    
    def refresh_ttl(self, key: str, ttl_seconds: int) -> bool:
        """Refresh TTL without changing data"""
        return self.redis.expire(key, ttl_seconds)

# TTL strategies for different data types
class SmartTTLCache:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        
        # Different TTL strategies based on data characteristics
        self.ttl_strategies = {
            'user_profile': 3600,      # 1 hour - changes occasionally
            'user_session': 1800,      # 30 minutes - security sensitive
            'product_catalog': 7200,   # 2 hours - changes infrequently
            'real_time_prices': 60,    # 1 minute - changes frequently
            'static_content': 86400,   # 24 hours - rarely changes
            'analytics_data': 300,     # 5 minutes - needs freshness
        }
    
    def set_smart_ttl(self, key: str, data: Any, data_type: str):
        """Set data with appropriate TTL based on type"""
        ttl = self.ttl_strategies.get(data_type, 3600)  # Default 1 hour
        
        # Adjust TTL based on data characteristics
        if isinstance(data, dict):
            # Shorter TTL for frequently changing data
            if 'last_updated' in data:
                last_updated = data.get('last_updated', 0)
                age = time.time() - last_updated
                if age < 300:  # Recently updated
                    ttl = min(ttl, 600)  # Max 10 minutes
        
        return self.set_with_ttl(key, data, ttl)
    
    def adaptive_ttl(self, key: str, data: Any, access_pattern: dict):
        """Adaptive TTL based on access patterns"""
        base_ttl = 3600
        
        # Increase TTL for frequently accessed data
        access_frequency = access_pattern.get('hits_per_hour', 0)
        if access_frequency > 100:
            base_ttl *= 2  # Double TTL for hot data
        elif access_frequency < 10:
            base_ttl //= 2  # Half TTL for cold data
        
        # Adjust based on update frequency
        update_frequency = access_pattern.get('updates_per_hour', 0)
        if update_frequency > 10:
            base_ttl = min(base_ttl, 300)  # Max 5 minutes for frequently updated data
        
        return self.set_with_ttl(key, data, base_ttl)

# Usage examples
cache = SmartTTLCache(redis.Redis())

# Cache user profile with appropriate TTL
user_profile = {
    'id': 1001,
    'name': 'John Doe',
    'email': 'john@example.com',
    'last_updated': time.time()
}
cache.set_smart_ttl('user:1001:profile', user_profile, 'user_profile')

# Cache with adaptive TTL
access_pattern = {
    'hits_per_hour': 150,  # Frequently accessed
    'updates_per_hour': 2   # Infrequently updated
}
cache.adaptive_ttl('popular_product:123', product_data, access_pattern)
```

### Sliding Window TTL

```python
class SlidingWindowTTL:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
    
    def get_with_sliding_ttl(self, key: str, base_ttl: int = 3600) -> Optional[Any]:
        """Get data and refresh TTL on access (sliding window)"""
        data = self.redis.get(key)
        if data is None:
            return None
        
        # Refresh TTL on access
        self.redis.expire(key, base_ttl)
        return json.loads(data)
    
    def set_sliding_ttl(self, key: str, data: Any, base_ttl: int = 3600):
        """Set data with sliding TTL"""
        serialized = json.dumps(data, default=str)
        return self.redis.setex(key, base_ttl, serialized)

# Usage
sliding_cache = SlidingWindowTTL(redis.Redis())

# Data stays cached as long as it's being accessed
sliding_cache.set_sliding_ttl('active_user_session:abc123', session_data, 1800)
session = sliding_cache.get_with_sliding_ttl('active_user_session:abc123', 1800)
```

## Event-Based Invalidation

### Database Trigger Invalidation

```sql
-- PostgreSQL trigger for cache invalidation
CREATE OR REPLACE FUNCTION invalidate_user_cache()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify application to invalidate cache
    PERFORM pg_notify('cache_invalidation', 
        json_build_object(
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'user_id', COALESCE(NEW.id, OLD.id)
        )::text
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER user_cache_invalidation
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION invalidate_user_cache();

CREATE TRIGGER user_profile_cache_invalidation
    AFTER INSERT OR UPDATE OR DELETE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION invalidate_user_cache();
```

```python
import psycopg2
import psycopg2.extensions
import json
import threading
import redis

class DatabaseCacheInvalidator:
    def __init__(self, db_connection, redis_client):
        self.db = db_connection
        self.redis = redis_client
        self.db.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)
        
        # Start listening for notifications
        self.listener_thread = threading.Thread(target=self._listen_for_notifications, daemon=True)
        self.listener_thread.start()
    
    def _listen_for_notifications(self):
        """Listen for database notifications and invalidate cache"""
        cursor = self.db.cursor()
        cursor.execute("LISTEN cache_invalidation;")
        
        while True:
            self.db.poll()
            while self.db.notifies:
                notify = self.db.notifies.pop(0)
                self._handle_invalidation(json.loads(notify.payload))
    
    def _handle_invalidation(self, notification):
        """Handle cache invalidation based on database notification"""
        table = notification['table']
        operation = notification['operation']
        user_id = notification.get('user_id')
        
        if table == 'users' and user_id:
            # Invalidate user-related cache keys
            keys_to_invalidate = [
                f"user:{user_id}:profile",
                f"user:{user_id}:preferences",
                f"user:{user_id}:permissions"
            ]
            
            for key in keys_to_invalidate:
                self.redis.delete(key)
            
            print(f"Invalidated cache for user {user_id} due to {operation} on {table}")
        
        elif table == 'user_profiles' and user_id:
            # Invalidate specific profile cache
            self.redis.delete(f"user:{user_id}:profile")
            print(f"Invalidated profile cache for user {user_id}")

# Usage
db_conn = psycopg2.connect("postgresql://user:pass@localhost/db")
redis_client = redis.Redis()
invalidator = DatabaseCacheInvalidator(db_conn, redis_client)
```

### Application-Level Event Invalidation

```python
from typing import Set, Callable
import threading
from enum import Enum

class CacheEvent(Enum):
    USER_UPDATED = "user_updated"
    PRODUCT_UPDATED = "product_updated"
    ORDER_CREATED = "order_created"
    INVENTORY_CHANGED = "inventory_changed"

class EventBasedCacheInvalidator:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.event_handlers = {}
        self.lock = threading.RLock()
    
    def register_handler(self, event: CacheEvent, handler: Callable):
        """Register event handler for cache invalidation"""
        with self.lock:
            if event not in self.event_handlers:
                self.event_handlers[event] = []
            self.event_handlers[event].append(handler)
    
    def emit_event(self, event: CacheEvent, data: dict):
        """Emit event and trigger cache invalidation"""
        with self.lock:
            handlers = self.event_handlers.get(event, [])
            for handler in handlers:
                try:
                    handler(data)
                except Exception as e:
                    print(f"Error in cache invalidation handler: {e}")
    
    def invalidate_user_cache(self, data: dict):
        """Invalidate user-related cache entries"""
        user_id = data.get('user_id')
        if user_id:
            patterns = [
                f"user:{user_id}:*",
                f"user_orders:{user_id}",
                f"user_recommendations:{user_id}"
            ]
            
            for pattern in patterns:
                keys = self.redis.keys(pattern)
                if keys:
                    self.redis.delete(*keys)
    
    def invalidate_product_cache(self, data: dict):
        """Invalidate product-related cache entries"""
        product_id = data.get('product_id')
        category_id = data.get('category_id')
        
        keys_to_invalidate = []
        
        if product_id:
            keys_to_invalidate.extend([
                f"product:{product_id}",
                f"product:{product_id}:details",
                f"product:{product_id}:reviews"
            ])
        
        if category_id:
            # Invalidate category-based caches
            category_keys = self.redis.keys(f"category:{category_id}:*")
            keys_to_invalidate.extend(category_keys)
        
        # Invalidate general product listings
        listing_keys = self.redis.keys("products:*")
        keys_to_invalidate.extend(listing_keys)
        
        if keys_to_invalidate:
            self.redis.delete(*keys_to_invalidate)

# Setup event-based invalidation
invalidator = EventBasedCacheInvalidator(redis.Redis())

# Register handlers
invalidator.register_handler(CacheEvent.USER_UPDATED, invalidator.invalidate_user_cache)
invalidator.register_handler(CacheEvent.PRODUCT_UPDATED, invalidator.invalidate_product_cache)

# Usage in application code
def update_user_profile(user_id: int, profile_data: dict):
    # Update database
    db.execute(
        "UPDATE users SET name = %s, email = %s WHERE id = %s",
        (profile_data['name'], profile_data['email'], user_id)
    )
    
    # Emit cache invalidation event
    invalidator.emit_event(CacheEvent.USER_UPDATED, {'user_id': user_id})

def update_product(product_id: int, product_data: dict):
    # Update database
    db.execute(
        "UPDATE products SET name = %s, price = %s, category_id = %s WHERE id = %s",
        (product_data['name'], product_data['price'], product_data['category_id'], product_id)
    )
    
    # Emit cache invalidation event
    invalidator.emit_event(CacheEvent.PRODUCT_UPDATED, {
        'product_id': product_id,
        'category_id': product_data['category_id']
    })
```

## Tag-Based Invalidation

### Implementation with Redis

```python
class TagBasedCache:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.tag_prefix = "tag:"
        self.default_ttl = 3600
    
    def set_with_tags(self, key: str, data: Any, tags: Set[str], ttl: int = None):
        """Set cache data with associated tags"""
        ttl = ttl or self.default_ttl
        
        # Store the actual data
        serialized = json.dumps(data, default=str)
        self.redis.setex(key, ttl, serialized)
        
        # Associate key with tags
        for tag in tags:
            tag_key = f"{self.tag_prefix}{tag}"
            self.redis.sadd(tag_key, key)
            # Set tag expiration slightly longer than data
            self.redis.expire(tag_key, ttl + 60)
    
    def get(self, key: str) -> Optional[Any]:
        """Get cached data"""
        data = self.redis.get(key)
        if data:
            return json.loads(data)
        return None
    
    def invalidate_by_tag(self, tag: str) -> int:
        """Invalidate all cache entries with a specific tag"""
        tag_key = f"{self.tag_prefix}{tag}"
        
        # Get all keys associated with this tag
        keys = self.redis.smembers(tag_key)
        
        if keys:
            # Delete all associated keys
            deleted_count = self.redis.delete(*keys)
            # Delete the tag set itself
            self.redis.delete(tag_key)
            return deleted_count
        
        return 0
    
    def invalidate_by_tags(self, tags: Set[str]) -> int:
        """Invalidate cache entries associated with any of the given tags"""
        all_keys = set()
        tag_keys = []
        
        for tag in tags:
            tag_key = f"{self.tag_prefix}{tag}"
            tag_keys.append(tag_key)
            keys = self.redis.smembers(tag_key)
            all_keys.update(keys)
        
        if all_keys:
            # Delete all associated keys and tag sets
            deleted_count = self.redis.delete(*all_keys, *tag_keys)
            return deleted_count
        
        return 0
    
    def get_tags_for_key(self, key: str) -> Set[str]:
        """Get all tags associated with a key"""
        tags = set()
        
        # This is expensive - scan all tag keys
        # In production, consider maintaining reverse mapping
        for tag_key in self.redis.scan_iter(match=f"{self.tag_prefix}*"):
            if self.redis.sismember(tag_key, key):
                tag = tag_key[len(self.tag_prefix):]
                tags.add(tag)
        
        return tags

# Advanced tag-based cache with hierarchical tags
class HierarchicalTagCache(TagBasedCache):
    def __init__(self, redis_client):
        super().__init__(redis_client)
    
    def set_with_hierarchical_tags(self, key: str, data: Any, tags: Set[str], ttl: int = None):
        """Set cache with hierarchical tags (e.g., 'user:1001', 'user:1001:profile')"""
        expanded_tags = set(tags)
        
        # Expand hierarchical tags
        for tag in tags:
            parts = tag.split(':')
            for i in range(1, len(parts)):
                parent_tag = ':'.join(parts[:i])
                expanded_tags.add(parent_tag)
        
        self.set_with_tags(key, data, expanded_tags, ttl)
    
    def invalidate_hierarchy(self, tag: str) -> int:
        """Invalidate tag and all its children"""
        pattern = f"{self.tag_prefix}{tag}*"
        tag_keys = list(self.redis.scan_iter(match=pattern))
        
        all_keys = set()
        for tag_key in tag_keys:
            keys = self.redis.smembers(tag_key)
            all_keys.update(keys)
        
        if all_keys:
            # Delete all keys and tag sets
            deleted_count = self.redis.delete(*all_keys, *tag_keys)
            return deleted_count
        
        return 0

# Usage examples
tag_cache = HierarchicalTagCache(redis.Redis())

# Cache user profile with hierarchical tags
user_profile = {'id': 1001, 'name': 'John', 'department': 'Engineering'}
tag_cache.set_with_hierarchical_tags(
    'user:1001:profile',
    user_profile,
    tags={'user:1001:profile', 'user:1001', 'department:engineering'},
    ttl=1800
)

# Cache product with multiple tags
product_data = {'id': 123, 'name': 'Laptop', 'category': 'Electronics', 'brand': 'TechCorp'}
tag_cache.set_with_tags(
    'product:123',
    product_data,
    tags={'product:123', 'category:electronics', 'brand:techcorp'},
    ttl=3600
)

# Invalidate all engineering department data
tag_cache.invalidate_by_tag('department:engineering')

# Invalidate all user 1001 data (including profile, preferences, etc.)
tag_cache.invalidate_hierarchy('user:1001')
```

## Version-Based Invalidation

### Optimistic Locking with Versions

```python
import time
import hashlib

class VersionedCache:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.version_suffix = ":version"
    
    def set_with_version(self, key: str, data: Any, ttl: int = 3600) -> str:
        """Set data with version for optimistic locking"""
        # Generate version based on data and timestamp
        data_str = json.dumps(data, sort_keys=True, default=str)
        version = hashlib.md5(f"{data_str}:{time.time()}".encode()).hexdigest()
        
        # Store data and version
        pipe = self.redis.pipeline()
        pipe.setex(key, ttl, json.dumps(data, default=str))
        pipe.setex(f"{key}{self.version_suffix}", ttl, version)
        pipe.execute()
        
        return version
    
    def get_with_version(self, key: str) -> tuple:
        """Get data with its version"""
        pipe = self.redis.pipeline()
        pipe.get(key)
        pipe.get(f"{key}{self.version_suffix}")
        
        data, version = pipe.execute()
        
        if data is None:
            return None, None
        
        return json.loads(data), version
    
    def update_if_version_matches(self, key: str, data: Any, expected_version: str, ttl: int = 3600) -> bool:
        """Update data only if version matches (optimistic locking)"""
        current_data, current_version = self.get_with_version(key)
        
        if current_version != expected_version:
            return False  # Version mismatch, update failed
        
        # Version matches, proceed with update
        new_version = self.set_with_version(key, data, ttl)
        return True
    
    def invalidate_version(self, key: str):
        """Invalidate both data and version"""
        pipe = self.redis.pipeline()
        pipe.delete(key)
        pipe.delete(f"{key}{self.version_suffix}")
        pipe.execute()

# ETags for HTTP caching
class ETagCache:
    def __init__(self, redis_client):
        self.redis = redis_client
    
    def generate_etag(self, data: Any) -> str:
        """Generate ETag for data"""
        data_str = json.dumps(data, sort_keys=True, default=str)
        return hashlib.md5(data_str.encode()).hexdigest()
    
    def set_with_etag(self, key: str, data: Any, ttl: int = 3600) -> str:
        """Set data with ETag"""
        etag = self.generate_etag(data)
        
        cache_entry = {
            'data': data,
            'etag': etag,
            'timestamp': time.time()
        }
        
        self.redis.setex(key, ttl, json.dumps(cache_entry, default=str))
        return etag
    
    def get_with_etag(self, key: str) -> tuple:
        """Get data with ETag"""
        cached = self.redis.get(key)
        if not cached:
            return None, None
        
        cache_entry = json.loads(cached)
        return cache_entry['data'], cache_entry['etag']
    
    def is_modified(self, key: str, client_etag: str) -> bool:
        """Check if data has been modified since client's ETag"""
        _, current_etag = self.get_with_etag(key)
        return current_etag != client_etag

# Usage in web application
from flask import Flask, request, jsonify

app = Flask(__name__)
etag_cache = ETagCache(redis.Redis())

@app.route('/api/users/<int:user_id>')
def get_user(user_id):
    cache_key = f"user:{user_id}"
    client_etag = request.headers.get('If-None-Match')
    
    # Check if client has current version
    if client_etag and not etag_cache.is_modified(cache_key, client_etag):
        return '', 304  # Not Modified
    
    # Get user data
    user_data, etag = etag_cache.get_with_etag(cache_key)
    
    if not user_data:
        # Fetch from database
        user_data = fetch_user_from_db(user_id)
        etag = etag_cache.set_with_etag(cache_key, user_data)
    
    response = jsonify(user_data)
    response.headers['ETag'] = etag
    response.headers['Cache-Control'] = 'max-age=300'  # 5 minutes
    
    return response
```

## Dependency-Based Invalidation

### Cache Dependency Graphs

```python
from collections import defaultdict, deque
from typing import Dict, Set, List

class DependencyBasedCache:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.dependencies = defaultdict(set)  # key -> set of dependent keys
        self.dependents = defaultdict(set)    # key -> set of keys it depends on
        self.lock = threading.RLock()
    
    def set_with_dependencies(self, key: str, data: Any, depends_on: Set[str] = None, ttl: int = 3600):
        """Set cache data with dependencies"""
        depends_on = depends_on or set()
        
        with self.lock:
            # Store the data
            self.redis.setex(key, ttl, json.dumps(data, default=str))
            
            # Update dependency graph
            self.dependents[key] = depends_on.copy()
            
            for dependency in depends_on:
                self.dependencies[dependency].add(key)
    
    def get(self, key: str) -> Optional[Any]:
        """Get cached data"""
        data = self.redis.get(key)
        if data:
            return json.loads(data)
        return None
    
    def invalidate_with_dependencies(self, key: str) -> Set[str]:
        """Invalidate key and all dependent keys"""
        invalidated = set()
        
        with self.lock:
            # Use BFS to find all dependent keys
            queue = deque([key])
            visited = set()
            
            while queue:
                current_key = queue.popleft()
                if current_key in visited:
                    continue
                
                visited.add(current_key)
                invalidated.add(current_key)
                
                # Delete from cache
                self.redis.delete(current_key)
                
                # Add dependent keys to queue
                dependent_keys = self.dependencies.get(current_key, set())
                for dependent_key in dependent_keys:
                    if dependent_key not in visited:
                        queue.append(dependent_key)
            
            # Clean up dependency graph
            for invalidated_key in invalidated:
                self._remove_from_dependency_graph(invalidated_key)
        
        return invalidated
    
    def _remove_from_dependency_graph(self, key: str):
        """Remove key from dependency graph"""
        # Remove from dependencies
        if key in self.dependencies:
            del self.dependencies[key]
        
        # Remove from dependents
        depends_on = self.dependents.get(key, set())
        for dependency in depends_on:
            self.dependencies[dependency].discard(key)
        
        if key in self.dependents:
            del self.dependents[key]
    
    def get_dependency_chain(self, key: str) -> Dict[str, List[str]]:
        """Get the full dependency chain for debugging"""
        with self.lock:
            return {
                'depends_on': list(self.dependents.get(key, set())),
                'dependents': list(self.dependencies.get(key, set()))
            }

# Smart dependency detection
class SmartDependencyCache(DependencyBasedCache):
    def __init__(self, redis_client):
        super().__init__(redis_client)
        self.access_tracker = defaultdict(set)  # Track which keys are accessed together
    
    def track_access(self, keys: Set[str], context: str = None):
        """Track which keys are accessed together"""
        if len(keys) > 1:
            for key in keys:
                self.access_tracker[key].update(keys - {key})
    
    def suggest_dependencies(self, key: str) -> Set[str]:
        """Suggest dependencies based on access patterns"""
        return self.access_tracker.get(key, set())
    
    def auto_set_dependencies(self, key: str, data: Any, ttl: int = 3600):
        """Automatically set dependencies based on access patterns"""
        suggested_deps = self.suggest_dependencies(key)
        
        # Filter to only existing keys
        existing_deps = {dep for dep in suggested_deps if self.redis.exists(dep)}
        
        self.set_with_dependencies(key, data, existing_deps, ttl)

# Usage example
dep_cache = SmartDependencyCache(redis.Redis())

# Set up cache with explicit dependencies
user_profile = {'id': 1001, 'name': 'John', 'department_id': 5}
dep_cache.set_with_dependencies(
    'user:1001:profile',
    user_profile,
    depends_on={'department:5', 'user:1001:base'},
    ttl=1800
)

# Set department data
department_data = {'id': 5, 'name': 'Engineering', 'budget': 1000000}
dep_cache.set_with_dependencies('department:5', department_data, ttl=3600)

# When department changes, user profile is automatically invalidated
invalidated_keys = dep_cache.invalidate_with_dependencies('department:5')
print(f"Invalidated keys: {invalidated_keys}")  # Will include user:1001:profile
```

## Invalidation Strategies Comparison

### Strategy Selection Matrix

| Strategy | Consistency | Performance | Complexity | Use Cases |
|----------|-------------|-------------|------------|-----------|
| **TTL** | Eventual | High | Low | Static content, acceptable staleness |
| **Event-Based** | Strong | Medium | Medium | Real-time updates, critical data |
| **Tag-Based** | Strong | Medium | Medium | Related data groups, bulk invalidation |
| **Version-Based** | Strong | Medium | High | Optimistic locking, conflict detection |
| **Dependency-Based** | Strong | Low | High | Complex relationships, cascading updates |

### Hybrid Invalidation Strategy

```python
class HybridCacheInvalidator:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.ttl_cache = TTLCache(redis_client)
        self.tag_cache = TagBasedCache(redis_client)
        self.event_invalidator = EventBasedCacheInvalidator(redis_client)
        self.dependency_cache = DependencyBasedCache(redis_client)
    
    def set_hybrid(self, key: str, data: Any, strategy_config: dict):
        """Set cache data with hybrid invalidation strategy"""
        strategies = strategy_config.get('strategies', ['ttl'])
        ttl = strategy_config.get('ttl', 3600)
        tags = strategy_config.get('tags', set())
        dependencies = strategy_config.get('dependencies', set())
        
        if 'ttl' in strategies:
            self.ttl_cache.set_with_ttl(key, data, ttl)
        
        if 'tag' in strategies and tags:
            self.tag_cache.set_with_tags(key, data, tags, ttl)
        
        if 'dependency' in strategies and dependencies:
            self.dependency_cache.set_with_dependencies(key, data, dependencies, ttl)
    
    def invalidate_hybrid(self, key: str, strategy: str = 'all'):
        """Invalidate using specified strategy"""
        if strategy == 'all' or strategy == 'direct':
            self.redis.delete(key)
        
        if strategy == 'all' or strategy == 'dependency':
            self.dependency_cache.invalidate_with_dependencies(key)
        
        # Tag-based invalidation would be triggered by events

# Configuration-driven invalidation
CACHE_STRATEGIES = {
    'user_profile': {
        'strategies': ['ttl', 'tag', 'event'],
        'ttl': 1800,
        'tags': lambda user_id: {f'user:{user_id}', 'user_profiles'},
        'events': [CacheEvent.USER_UPDATED]
    },
    'product_catalog': {
        'strategies': ['ttl', 'tag', 'dependency'],
        'ttl': 3600,
        'tags': lambda product_id, category_id: {f'product:{product_id}', f'category:{category_id}'},
        'dependencies': lambda category_id: {f'category:{category_id}'}
    },
    'real_time_data': {
        'strategies': ['ttl'],
        'ttl': 60  # Very short TTL for real-time data
    }
}

def cache_with_strategy(key: str, data: Any, strategy_name: str, **kwargs):
    """Cache data using predefined strategy"""
    config = CACHE_STRATEGIES.get(strategy_name, {})
    
    # Resolve dynamic values
    if 'tags' in config and callable(config['tags']):
        config['tags'] = config['tags'](**kwargs)
    
    if 'dependencies' in config and callable(config['dependencies']):
        config['dependencies'] = config['dependencies'](**kwargs)
    
    hybrid_invalidator.set_hybrid(key, data, config)
```

## Best Practices

### Invalidation Strategy Selection

1. **Start Simple**: Begin with TTL-based invalidation for most use cases
2. **Add Complexity Gradually**: Introduce event-based or tag-based invalidation as needed
3. **Consider Data Characteristics**: 
   - Frequently changing data: Short TTL or event-based
   - Related data: Tag-based or dependency-based
   - Critical consistency: Event-based or version-based
4. **Monitor and Measure**: Track cache hit rates and invalidation effectiveness

### Implementation Guidelines

- **Graceful Degradation**: Handle invalidation failures gracefully
- **Batch Operations**: Invalidate multiple keys efficiently
- **Avoid Over-Invalidation**: Be precise to maintain cache effectiveness
- **Test Invalidation Logic**: Ensure invalidation works correctly under all conditions
- **Document Dependencies**: Maintain clear documentation of cache relationships

### Performance Optimization

- **Lazy Invalidation**: Remove expired entries during normal operations
- **Background Cleanup**: Run periodic cleanup processes
- **Efficient Key Patterns**: Use consistent key naming for pattern-based operations
- **Monitor Invalidation Overhead**: Ensure invalidation doesn't become a bottleneck

## Summary

Effective cache invalidation requires:

- **Understanding Data Patterns**: Know how your data changes and relates
- **Choosing Appropriate Strategies**: Match invalidation strategy to use case
- **Balancing Consistency and Performance**: Find the right trade-off for your application
- **Monitoring and Optimization**: Continuously improve invalidation effectiveness

The key is starting with simple strategies and evolving to more sophisticated approaches as your application's requirements become more complex.
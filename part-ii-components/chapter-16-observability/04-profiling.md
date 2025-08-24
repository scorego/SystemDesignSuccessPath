# Profiling

Profiling is the deep dive into your application's performance characteristics. While metrics tell you *what* is slow, profiling tells you *why* it's slow. It's the difference between knowing your API response time is 2 seconds versus knowing that 1.8 seconds of that time is spent in a single database query.

## Understanding Profiling

### What Is Profiling?

Profiling is the process of analyzing your application's runtime behavior to understand:
- **Where time is spent** (CPU profiling)
- **How memory is used** (Memory profiling)
- **What's blocking execution** (I/O and lock profiling)
- **How resources flow** (Allocation profiling)

### Types of Profiling

**CPU Profiling**: Shows where your application spends CPU time
**Memory Profiling**: Reveals memory allocation patterns and leaks
**I/O Profiling**: Identifies blocking operations and wait times
**Lock Profiling**: Finds contention points in concurrent code

## CPU Profiling

### Understanding CPU Profiles

CPU profiles show you which functions consume the most CPU time. They're typically visualized as flame graphs or call trees.

**Example: Python CPU Profiling with cProfile**

```python
import cProfile
import pstats
from pstats import SortKey

def slow_function():
    # Simulate CPU-intensive work
    total = 0
    for i in range(1000000):
        total += i * i
    return total

def another_slow_function():
    # Simulate string operations
    result = ""
    for i in range(10000):
        result += f"Item {i} "
    return result

def main():
    result1 = slow_function()
    result2 = another_slow_function()
    return result1, result2

if __name__ == "__main__":
    # Profile the main function
    profiler = cProfile.Profile()
    profiler.enable()
    
    main()
    
    profiler.disable()
    
    # Analyze results
    stats = pstats.Stats(profiler)
    stats.sort_stats(SortKey.CUMULATIVE)
    stats.print_stats(10)  # Top 10 functions
```

**Output Analysis:**
```
         4 function calls in 0.234 seconds

   Ordered by: cumulative time

   ncalls  tottime  percall  cumtime  percall filename:lineno(function)
        1    0.000    0.000    0.234    0.234 <string>:1(<module>)
        1    0.000    0.000    0.234    0.234 profile_example.py:15(main)
        1    0.123    0.123    0.123    0.123 profile_example.py:3(slow_function)
        1    0.111    0.111    0.111    0.111 profile_example.py:9(another_slow_function)
```

**Key Metrics:**
- **ncalls**: Number of calls to the function
- **tottime**: Total time spent in function (excluding sub-calls)
- **percall**: Time per call (tottime/ncalls)
- **cumtime**: Cumulative time (including sub-calls)

### Production CPU Profiling

**Example: Go pprof Integration**

```go
package main

import (
    "log"
    "net/http"
    _ "net/http/pprof"  // Import for side effects
    "time"
)

func expensiveOperation() {
    // Simulate CPU-intensive work
    for i := 0; i < 1000000; i++ {
        _ = i * i * i
    }
}

func handler(w http.ResponseWriter, r *http.Request) {
    start := time.Now()
    
    // Do some work
    expensiveOperation()
    
    duration := time.Since(start)
    w.Write([]byte(fmt.Sprintf("Operation took %v", duration)))
}

func main() {
    // Enable pprof endpoint
    go func() {
        log.Println(http.ListenAndServe("localhost:6060", nil))
    }()
    
    http.HandleFunc("/", handler)
    log.Fatal(http.ListenAndServe(":8080", nil))
}
```

**Collecting CPU Profile:**
```bash
# Collect 30-second CPU profile
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30

# Analyze in interactive mode
(pprof) top10
(pprof) list expensiveOperation
(pprof) web  # Generate flame graph
```

### Continuous Profiling in Production

**Example: DataDog Continuous Profiler**

```python
import ddtrace.profiling.auto  # Auto-instrument

# Or manual setup
from ddtrace.profiling import Profiler

profiler = Profiler(
    env="production",
    service="user-service",
    version="1.2.3"
)
profiler.start()

# Your application code
def process_user_data(user_id):
    # This function will be automatically profiled
    user_data = fetch_user_from_db(user_id)
    processed_data = complex_processing(user_data)
    return processed_data
```

## Memory Profiling

### Understanding Memory Usage

Memory profiling helps identify:
- **Memory leaks**: Objects that aren't being garbage collected
- **High allocation rates**: Functions creating too many objects
- **Memory bloat**: Inefficient data structures

**Example: Python Memory Profiling with memory_profiler**

```python
from memory_profiler import profile
import numpy as np

@profile
def memory_intensive_function():
    # Line-by-line memory usage will be tracked
    
    # Create large array
    large_array = np.zeros((1000, 1000))  # ~8MB
    
    # Create list of strings
    string_list = []
    for i in range(100000):
        string_list.append(f"String number {i}")
    
    # Create dictionary
    large_dict = {}
    for i in range(50000):
        large_dict[f"key_{i}"] = list(range(100))
    
    return large_array, string_list, large_dict

if __name__ == "__main__":
    memory_intensive_function()
```

**Output:**
```
Line #    Mem usage    Increment  Occurrences   Line Contents
=============================================================
     3     15.2 MiB     15.2 MiB           1   @profile
     4                                         def memory_intensive_function():
     7     22.9 MiB      7.7 MiB           1       large_array = np.zeros((1000, 1000))
     9     22.9 MiB      0.0 MiB           1       string_list = []
    10     35.4 MiB     12.5 MiB      100001       for i in range(100000):
    11     35.4 MiB      0.0 MiB      100000           string_list.append(f"String number {i}")
    13     35.4 MiB      0.0 MiB           1       large_dict = {}
    14     89.2 MiB     53.8 MiB       50001       for i in range(50000):
    15     89.2 MiB      0.0 MiB       50000           large_dict[f"key_{i}"] = list(range(100))
```

### Heap Profiling in Production

**Example: Go Heap Profiling**

```go
package main

import (
    "fmt"
    "runtime"
    "time"
)

type UserData struct {
    ID       int
    Name     string
    Email    string
    Metadata map[string]interface{}
}

var globalCache = make(map[int]*UserData)

func createUser(id int) *UserData {
    user := &UserData{
        ID:       id,
        Name:     fmt.Sprintf("User %d", id),
        Email:    fmt.Sprintf("user%d@example.com", id),
        Metadata: make(map[string]interface{}),
    }
    
    // Add to global cache (potential memory leak!)
    globalCache[id] = user
    
    return user
}

func main() {
    // Create many users
    for i := 0; i < 100000; i++ {
        createUser(i)
        
        if i%10000 == 0 {
            var m runtime.MemStats
            runtime.ReadMemStats(&m)
            fmt.Printf("Alloc = %d KB", bToKb(m.Alloc))
            fmt.Printf(", TotalAlloc = %d KB", bToKb(m.TotalAlloc))
            fmt.Printf(", Sys = %d KB", bToKb(m.Sys))
            fmt.Printf(", NumGC = %v\n", m.NumGC)
        }
    }
    
    // Keep program running for heap analysis
    time.Sleep(time.Hour)
}

func bToKb(b uint64) uint64 {
    return b / 1024
}
```

**Analyzing Heap:**
```bash
# Get heap profile
go tool pprof http://localhost:6060/debug/pprof/heap

# Commands in pprof
(pprof) top10          # Top memory consumers
(pprof) list createUser # Memory usage in specific function
(pprof) web            # Visual representation
```

## I/O and Blocking Profiling

### Identifying Blocking Operations

I/O profiling helps find operations that block your application threads.

**Example: Async I/O Profiling in Python**

```python
import asyncio
import aiohttp
import time
from contextlib import asynccontextmanager

class IOProfiler:
    def __init__(self):
        self.operations = []
    
    @asynccontextmanager
    async def profile_operation(self, operation_name):
        start_time = time.time()
        try:
            yield
        finally:
            duration = time.time() - start_time
            self.operations.append({
                'operation': operation_name,
                'duration': duration,
                'timestamp': start_time
            })
    
    def report(self):
        sorted_ops = sorted(self.operations, key=lambda x: x['duration'], reverse=True)
        print("Slowest I/O Operations:")
        for op in sorted_ops[:10]:
            print(f"  {op['operation']}: {op['duration']:.3f}s")

profiler = IOProfiler()

async def fetch_user_data(session, user_id):
    async with profiler.profile_operation(f"fetch_user_{user_id}"):
        async with session.get(f"https://api.example.com/users/{user_id}") as response:
            return await response.json()

async def fetch_user_posts(session, user_id):
    async with profiler.profile_operation(f"fetch_posts_{user_id}"):
        async with session.get(f"https://api.example.com/users/{user_id}/posts") as response:
            return await response.json()

async def process_user(session, user_id):
    # These operations can run concurrently
    user_data, user_posts = await asyncio.gather(
        fetch_user_data(session, user_id),
        fetch_user_posts(session, user_id)
    )
    
    # Simulate processing time
    async with profiler.profile_operation(f"process_user_{user_id}"):
        await asyncio.sleep(0.1)  # Simulate CPU work
    
    return {
        'user': user_data,
        'posts': user_posts
    }

async def main():
    async with aiohttp.ClientSession() as session:
        tasks = []
        for user_id in range(1, 11):
            tasks.append(process_user(session, user_id))
        
        results = await asyncio.gather(*tasks)
        profiler.report()

if __name__ == "__main__":
    asyncio.run(main())
```

### Database Query Profiling

**Example: SQL Query Performance Analysis**

```python
import time
import psycopg2
from contextlib import contextmanager

class DatabaseProfiler:
    def __init__(self):
        self.queries = []
    
    @contextmanager
    def profile_query(self, query_name, query_sql):
        start_time = time.time()
        try:
            yield
        finally:
            duration = time.time() - start_time
            self.queries.append({
                'name': query_name,
                'sql': query_sql,
                'duration': duration
            })
    
    def report_slow_queries(self, threshold=0.1):
        slow_queries = [q for q in self.queries if q['duration'] > threshold]
        slow_queries.sort(key=lambda x: x['duration'], reverse=True)
        
        print(f"Queries slower than {threshold}s:")
        for query in slow_queries:
            print(f"  {query['name']}: {query['duration']:.3f}s")
            print(f"    SQL: {query['sql'][:100]}...")

profiler = DatabaseProfiler()

def get_user_with_posts(conn, user_id):
    cursor = conn.cursor()
    
    # Inefficient query - N+1 problem
    with profiler.profile_query("get_user", "SELECT * FROM users WHERE id = %s"):
        cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
    
    with profiler.profile_query("get_user_posts", "SELECT * FROM posts WHERE user_id = %s"):
        cursor.execute("SELECT * FROM posts WHERE user_id = %s", (user_id,))
        posts = cursor.fetchall()
    
    return user, posts

def get_user_with_posts_optimized(conn, user_id):
    cursor = conn.cursor()
    
    # Optimized query - single JOIN
    query = """
    SELECT u.*, p.id as post_id, p.title, p.content, p.created_at as post_created
    FROM users u
    LEFT JOIN posts p ON u.id = p.user_id
    WHERE u.id = %s
    """
    
    with profiler.profile_query("get_user_posts_optimized", query):
        cursor.execute(query, (user_id,))
        results = cursor.fetchall()
    
    return results

# Usage
conn = psycopg2.connect("postgresql://user:pass@localhost/db")

# Profile both approaches
for user_id in range(1, 11):
    get_user_with_posts(conn, user_id)
    get_user_with_posts_optimized(conn, user_id)

profiler.report_slow_queries()
```

## Advanced Profiling Techniques

### Flame Graphs

Flame graphs provide an intuitive visualization of where your application spends time.

**Generating Flame Graphs:**

```bash
# For Go applications
go tool pprof -http=:8080 http://localhost:6060/debug/pprof/profile

# For Python with py-spy
pip install py-spy
py-spy record -o profile.svg --duration 60 --pid <PID>

# For Java with async-profiler
java -jar async-profiler.jar -d 60 -f profile.html <PID>
```

### Differential Profiling

Compare profiles before and after changes to measure impact.

**Example: A/B Testing Performance**

```python
import cProfile
import pstats
from contextlib import contextmanager

class DifferentialProfiler:
    def __init__(self):
        self.profiles = {}
    
    @contextmanager
    def profile_version(self, version_name):
        profiler = cProfile.Profile()
        profiler.enable()
        try:
            yield
        finally:
            profiler.disable()
            self.profiles[version_name] = pstats.Stats(profiler)
    
    def compare_versions(self, version_a, version_b):
        if version_a not in self.profiles or version_b not in self.profiles:
            print("Both versions must be profiled first")
            return
        
        stats_a = self.profiles[version_a]
        stats_b = self.profiles[version_b]
        
        print(f"Comparing {version_a} vs {version_b}:")
        
        # Get top functions from both profiles
        stats_a.sort_stats('cumulative')
        stats_b.sort_stats('cumulative')
        
        # This is a simplified comparison - real tools provide better analysis
        print("Performance comparison would show function-by-function differences")

# Usage
profiler = DifferentialProfiler()

def algorithm_v1(data):
    # Original implementation
    result = []
    for item in data:
        if item % 2 == 0:
            result.append(item * 2)
    return result

def algorithm_v2(data):
    # Optimized implementation
    return [item * 2 for item in data if item % 2 == 0]

test_data = list(range(100000))

with profiler.profile_version("v1"):
    for _ in range(100):
        algorithm_v1(test_data)

with profiler.profile_version("v2"):
    for _ in range(100):
        algorithm_v2(test_data)

profiler.compare_versions("v1", "v2")
```

### Sampling vs Instrumentation

**Sampling Profilers** (like pprof, py-spy):
- Low overhead (1-5%)
- Statistical sampling
- Good for production use
- May miss short-lived functions

**Instrumentation Profilers** (like cProfile):
- Higher overhead (10-50%)
- Exact measurements
- Better for development
- Captures all function calls

## Production Profiling Best Practices

### 1. Always-On Profiling

```python
# Example: Conditional profiling based on sampling
import random
from ddtrace.profiling import Profiler

class ConditionalProfiler:
    def __init__(self, sample_rate=0.01):  # 1% sampling
        self.sample_rate = sample_rate
        self.profiler = Profiler()
        self.profiler.start()
    
    def should_profile_request(self):
        return random.random() < self.sample_rate
    
    @contextmanager
    def profile_request(self, request_id):
        if self.should_profile_request():
            # Add request context to profile
            with self.profiler.profile():
                yield
        else:
            yield

profiler = ConditionalProfiler()

def handle_request(request):
    with profiler.profile_request(request.id):
        # Process request
        return process_request(request)
```

### 2. Profile-Guided Optimization

```python
# Example: Automatic optimization based on profiling data
class ProfileGuidedOptimizer:
    def __init__(self):
        self.function_stats = {}
    
    def record_function_time(self, func_name, duration):
        if func_name not in self.function_stats:
            self.function_stats[func_name] = []
        
        self.function_stats[func_name].append(duration)
        
        # Keep only recent measurements
        if len(self.function_stats[func_name]) > 1000:
            self.function_stats[func_name] = self.function_stats[func_name][-1000:]
    
    def get_optimization_candidates(self):
        candidates = []
        for func_name, times in self.function_stats.items():
            if len(times) >= 100:  # Enough data points
                avg_time = sum(times) / len(times)
                if avg_time > 0.1:  # Functions taking > 100ms on average
                    candidates.append({
                        'function': func_name,
                        'avg_time': avg_time,
                        'call_count': len(times)
                    })
        
        return sorted(candidates, key=lambda x: x['avg_time'] * x['call_count'], reverse=True)

optimizer = ProfileGuidedOptimizer()

def profile_function(func):
    def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            return func(*args, **kwargs)
        finally:
            duration = time.time() - start_time
            optimizer.record_function_time(func.__name__, duration)
    
    return wrapper

@profile_function
def expensive_operation(data):
    # This function will be automatically tracked
    return complex_processing(data)
```

### 3. Profiling Alerts

```yaml
# Alert when profiling detects performance regressions
- alert: PerformanceRegression
  expr: |
    (
      avg_over_time(function_duration_seconds{function="critical_path"}[1h]) >
      1.5 * avg_over_time(function_duration_seconds{function="critical_path"}[1h] offset 24h)
    )
  for: 10m
  labels:
    severity: medium
  annotations:
    summary: "Performance regression detected in critical path"
    description: "Function duration increased by 50% compared to yesterday"
    action: "Check recent deployments and profile data"
```

## Profiling Tools Comparison

| Tool | Language | Type | Overhead | Production Ready | Visualization |
|------|----------|------|----------|------------------|---------------|
| **pprof** | Go | Sampling | <1% | Yes | Flame graphs, Web UI |
| **py-spy** | Python | Sampling | <1% | Yes | Flame graphs |
| **cProfile** | Python | Instrumentation | 10-50% | No | Text reports |
| **perf** | Any (Linux) | Sampling | <5% | Yes | Flame graphs |
| **DataDog Profiler** | Multi | Sampling | <1% | Yes | Web UI, comparisons |
| **async-profiler** | Java | Sampling | <1% | Yes | Flame graphs |
| **Instruments** | Any (macOS) | Both | Varies | No | Rich GUI |

## Common Profiling Pitfalls

### 1. Observer Effect

Profiling can change the behavior you're trying to measure.

```python
# Bad: Heavy instrumentation changes timing
def bad_profiling():
    start = time.time()
    result = expensive_function()
    end = time.time()
    
    # This logging might affect performance
    logger.info(f"Function took {end - start}s")
    return result

# Good: Lightweight sampling
def good_profiling():
    if should_sample():  # Only sample 1% of calls
        with profiler.profile():
            return expensive_function()
    else:
        return expensive_function()
```

### 2. Profiling the Wrong Thing

```python
# Bad: Profiling development environment
def profile_dev_environment():
    # Small dataset, different hardware, debug mode
    with profiler.profile():
        process_data(small_test_dataset)

# Good: Profiling production-like conditions
def profile_production_like():
    # Production dataset size, optimized build
    with profiler.profile():
        process_data(production_sized_dataset)
```

### 3. Ignoring Context

```python
# Bad: Profiling without context
def profile_without_context():
    with profiler.profile():
        result = database_query()
    # Missing: What was the database load? Network conditions?

# Good: Profiling with context
def profile_with_context():
    context = {
        'db_connections': get_db_connection_count(),
        'cpu_usage': get_cpu_usage(),
        'memory_usage': get_memory_usage()
    }
    
    with profiler.profile(context=context):
        result = database_query()
```

Profiling is your microscope into application performance. Use it to understand not just what's slow, but why it's slow. Combine different profiling techniques—CPU, memory, I/O—to get a complete picture of your application's behavior. And remember: profile in production-like conditions to get actionable insights that actually improve user experience.
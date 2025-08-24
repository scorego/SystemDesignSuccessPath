# Load Balancing Algorithms

## Overview

Load balancing algorithms determine how incoming requests are distributed across multiple backend servers. The choice of algorithm significantly impacts system performance, resource utilization, and user experience.

## Round Robin

The simplest algorithm that distributes requests sequentially across all available servers.

### Implementation

```python
class RoundRobinBalancer:
    def __init__(self, servers):
        self.servers = servers
        self.current_index = 0
    
    def get_server(self):
        if not self.servers:
            return None
        
        server = self.servers[self.current_index]
        self.current_index = (self.current_index + 1) % len(self.servers)
        return server
```

### Nginx Configuration

```nginx
upstream backend {
    server backend1.example.com;
    server backend2.example.com;
    server backend3.example.com;
}
```

## Weighted Round Robin

Assigns weights to servers based on their capacity.

### Implementation

```python
class WeightedRoundRobinBalancer:
    def __init__(self, servers_with_weights):
        self.servers = []
        self.weights = []
        self.current_weights = []
        
        for server, weight in servers_with_weights:
            self.servers.append(server)
            self.weights.append(weight)
            self.current_weights.append(0)
    
    def get_server(self):
        if not self.servers:
            return None
        
        # Increase current weights
        for i in range(len(self.current_weights)):
            self.current_weights[i] += self.weights[i]
        
        # Find server with highest current weight
        max_weight_index = self.current_weights.index(max(self.current_weights))
        selected_server = self.servers[max_weight_index]
        
        # Decrease selected server's current weight by total weight
        total_weight = sum(self.weights)
        self.current_weights[max_weight_index] -= total_weight
        
        return selected_server
```

## Least Connections

Routes requests to the server with the fewest active connections.

### Implementation

```python
from collections import defaultdict

class LeastConnectionsBalancer:
    def __init__(self, servers):
        self.servers = servers
        self.connections = defaultdict(int)
    
    def get_server(self):
        if not self.servers:
            return None
        
        # Find server with minimum connections
        min_connections = min(self.connections[server] for server in self.servers)
        
        # Get servers with minimum connections
        candidates = [
            server for server in self.servers 
            if self.connections[server] == min_connections
        ]
        
        selected_server = candidates[0]
        self.connections[selected_server] += 1
        
        return selected_server
    
    def release_connection(self, server):
        if server in self.connections and self.connections[server] > 0:
            self.connections[server] -= 1
```

## IP Hash

Routes requests from the same client IP to the same server for session affinity.

### Implementation

```python
import hashlib

class IPHashBalancer:
    def __init__(self, servers):
        self.servers = servers
    
    def get_server(self, client_ip):
        if not self.servers:
            return None
        
        # Create hash of client IP
        ip_hash = hashlib.md5(client_ip.encode()).hexdigest()
        hash_int = int(ip_hash, 16)
        server_index = hash_int % len(self.servers)
        
        return self.servers[server_index]
```

## Algorithm Comparison

| Algorithm | Complexity | Session Affinity | Use Case |
|-----------|------------|------------------|----------|
| Round Robin | O(1) | No | Simple, stateless apps |
| Weighted RR | O(1) | No | Mixed server capacities |
| Least Connections | O(n) | No | Long-lived connections |
| IP Hash | O(1) | Yes | Session-based apps |

## Best Practices

1. **Start Simple**: Begin with Round Robin for most applications
2. **Consider Server Capacity**: Use weighted algorithms for mixed server capacities
3. **Session Requirements**: Use IP Hash for session affinity
4. **Connection Patterns**: Use Least Connections for long-lived connections
5. **Health Checking**: Implement health checks for all algorithms

## Summary

Load balancing algorithms provide different trade-offs between simplicity, performance, and features. The key is understanding your application's requirements and choosing the algorithm that best matches your traffic patterns and server characteristics.
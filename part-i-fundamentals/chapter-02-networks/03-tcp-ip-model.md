# TCP/IP 4-Layer Model

## Introduction

The TCP/IP (Transmission Control Protocol/Internet Protocol) model is the practical networking framework that powers the modern internet. Unlike the theoretical OSI model, TCP/IP was designed from real-world implementation experience and is the actual protocol suite used in virtually all networked systems today.

Understanding TCP/IP is essential for system design because:
- It's the foundation of internet communication
- All modern applications use TCP/IP protocols
- System performance is directly affected by TCP/IP behavior
- Network troubleshooting requires TCP/IP knowledge
- Cloud and distributed systems rely heavily on TCP/IP

## TCP/IP vs OSI Model Comparison

```mermaid
graph TD
    subgraph "OSI Model"
        A1[Application]
        A2[Presentation]
        A3[Session]
        A4[Transport]
        A5[Network]
        A6[Data Link]
        A7[Physical]
    end
    
    subgraph "TCP/IP Model"
        B1[Application Layer<br/>HTTP, FTP, SMTP, DNS]
        B2[Transport Layer<br/>TCP, UDP]
        B3[Internet Layer<br/>IP, ICMP, ARP]
        B4[Network Access Layer<br/>Ethernet, Wi-Fi]
    end
    
    A1 --> B1
    A2 --> B1
    A3 --> B1
    A4 --> B2
    A5 --> B3
    A6 --> B4
    A7 --> B4
```

| OSI Layers | TCP/IP Layer | Key Protocols | Purpose |
|------------|--------------|---------------|---------|
| Application, Presentation, Session | Application | HTTP, HTTPS, FTP, SMTP, DNS | End-user services |
| Transport | Transport | TCP, UDP | Reliable/unreliable delivery |
| Network | Internet | IP, ICMP, ARP | Routing and addressing |
| Data Link, Physical | Network Access | Ethernet, Wi-Fi, PPP | Physical network access |

## Layer 1: Network Access Layer (Link Layer)

### Purpose
Handles the physical transmission of data over the local network medium and manages access to the physical network.

### Responsibilities
- **Physical addressing**: MAC addresses for local network identification
- **Frame formatting**: Organizing data into frames for transmission
- **Error detection**: Basic error checking at the hardware level
- **Media access control**: Managing access to shared network media

### Key Technologies

#### Ethernet
Most common wired LAN technology:
```
Ethernet Frame Format:
| Preamble | Dest MAC | Src MAC | Type/Length | Data | FCS |
|    8     |    6     |    6    |      2      |46-1500| 4  |
```

#### Wi-Fi (802.11)
Wireless LAN standard with multiple variants:
- **802.11n**: Up to 600 Mbps
- **802.11ac**: Up to 6.93 Gbps  
- **802.11ax (Wi-Fi 6)**: Up to 9.6 Gbps

### Real-World Example: Ethernet Switch Operation
```mermaid
graph TD
    A[Computer A<br/>MAC: 00:1A:2B:3C:4D:5E] --> S[Ethernet Switch<br/>MAC Address Table]
    B[Computer B<br/>MAC: 00:1F:2E:3D:4C:5B] --> S
    C[Server<br/>MAC: 00:2A:3B:4C:5D:6E] --> S
    
    S --> D["MAC Table Learning:<br/>Port 1 → 00:1A:2B:3C:4D:5E<br/>Port 2 → 00:1F:2E:3D:4C:5B<br/>Port 3 → 00:2A:3B:4C:5D:6E"]
```

### Network Access Layer in System Design
```python
# Example: Network interface monitoring
import psutil
import time

def monitor_network_interfaces():
    """Monitor network interface statistics"""
    interfaces = psutil.net_io_counters(pernic=True)
    
    for interface_name, stats in interfaces.items():
        print(f"Interface: {interface_name}")
        print(f"  Bytes sent: {stats.bytes_sent:,}")
        print(f"  Bytes received: {stats.bytes_recv:,}")
        print(f"  Packets sent: {stats.packets_sent:,}")
        print(f"  Packets received: {stats.packets_recv:,}")
        print(f"  Errors in: {stats.errin}")
        print(f"  Errors out: {stats.errout}")
        print(f"  Dropped in: {stats.dropin}")
        print(f"  Dropped out: {stats.dropout}")
        print()

# Usage in system monitoring
monitor_network_interfaces()
```

## Layer 2: Internet Layer (Network Layer)

### Purpose
Provides logical addressing and routing to enable communication across different networks.

### Key Protocols

#### IP (Internet Protocol)
The fundamental protocol for internet communication:

**IPv4 Header Structure:**
```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|Version|  IHL  |Type of Service|          Total Length         |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|         Identification        |Flags|      Fragment Offset    |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|  Time to Live |    Protocol   |         Header Checksum       |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                       Source Address                          |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                    Destination Address                        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

#### IPv4 vs IPv6 Comparison

| Feature | IPv4 | IPv6 |
|---------|------|------|
| Address Length | 32 bits | 128 bits |
| Address Format | 192.168.1.1 | 2001:0db8:85a3::8a2e:0370:7334 |
| Address Space | ~4.3 billion | ~340 undecillion |
| Header Size | 20-60 bytes | 40 bytes (fixed) |
| Fragmentation | Router and sender | Sender only |
| Checksum | Yes | No (handled by other layers) |

#### ICMP (Internet Control Message Protocol)
Used for network diagnostics and error reporting:

```bash
# Common ICMP tools
ping google.com                    # Test connectivity
traceroute google.com             # Trace route to destination
ping -c 4 -s 1472 google.com     # Test MTU size
```

#### ARP (Address Resolution Protocol)
Maps IP addresses to MAC addresses on local networks:

```mermaid
sequenceDiagram
    participant A as Computer A<br/>192.168.1.10
    participant B as Computer B<br/>192.168.1.20
    
    Note over A,B: ARP Request (Broadcast)
    A->>B: Who has 192.168.1.20? Tell 192.168.1.10
    Note over A,B: ARP Reply (Unicast)
    B->>A: 192.168.1.20 is at MAC: 00:1F:2E:3D:4C:5B
    
    Note over A: ARP Cache Updated
    A->>B: Direct communication using MAC address
```

### Routing Fundamentals

#### Routing Table Example
```bash
# Linux routing table
$ ip route show
default via 192.168.1.1 dev eth0 proto dhcp metric 100
192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.100
172.17.0.0/16 dev docker0 proto kernel scope link src 172.17.0.1
```

#### Routing Decision Process
```mermaid
graph TD
    A[Packet Arrives] --> B{Destination in<br/>Local Network?}
    B -->|Yes| C[Send Directly<br/>via ARP]
    B -->|No| D[Check Routing Table]
    D --> E{Specific Route<br/>Found?}
    E -->|Yes| F[Forward to<br/>Next Hop]
    E -->|No| G[Use Default<br/>Gateway]
    F --> H[Send to Next Router]
    G --> H
    C --> I[Deliver Locally]
    H --> J[Process Repeats<br/>at Next Router]
```

### Subnetting and CIDR

#### CIDR Notation Examples
```
192.168.1.0/24    = 192.168.1.0 - 192.168.1.255 (256 addresses)
192.168.1.0/25    = 192.168.1.0 - 192.168.1.127 (128 addresses)
192.168.1.128/25  = 192.168.1.128 - 192.168.1.255 (128 addresses)
10.0.0.0/8        = 10.0.0.0 - 10.255.255.255 (16,777,216 addresses)
```

#### Subnet Calculation
```python
import ipaddress

def analyze_subnet(cidr):
    """Analyze subnet information"""
    network = ipaddress.IPv4Network(cidr, strict=False)
    
    print(f"Network: {network}")
    print(f"Network Address: {network.network_address}")
    print(f"Broadcast Address: {network.broadcast_address}")
    print(f"Subnet Mask: {network.netmask}")
    print(f"Total Addresses: {network.num_addresses}")
    print(f"Usable Addresses: {network.num_addresses - 2}")
    print(f"First Usable: {list(network.hosts())[0]}")
    print(f"Last Usable: {list(network.hosts())[-1]}")

# Example usage
analyze_subnet("192.168.1.0/24")
```

### Internet Layer in System Design

#### Load Balancer IP Configuration
```python
# Example: Health check using ICMP
import subprocess
import ipaddress

class HealthChecker:
    def __init__(self, backend_ips):
        self.backend_ips = [ipaddress.IPv4Address(ip) for ip in backend_ips]
        self.healthy_backends = set()
    
    def ping_check(self, ip_address, timeout=3):
        """Check if backend is reachable via ICMP ping"""
        try:
            result = subprocess.run(
                ['ping', '-c', '1', '-W', str(timeout), str(ip_address)],
                capture_output=True,
                text=True,
                timeout=timeout + 1
            )
            return result.returncode == 0
        except subprocess.TimeoutExpired:
            return False
    
    def update_health_status(self):
        """Update health status of all backends"""
        for ip in self.backend_ips:
            if self.ping_check(ip):
                self.healthy_backends.add(ip)
            else:
                self.healthy_backends.discard(ip)
        
        return list(self.healthy_backends)

# Usage in load balancer
backends = ["10.0.1.10", "10.0.1.11", "10.0.1.12"]
health_checker = HealthChecker(backends)
healthy_ips = health_checker.update_health_status()
```

## Layer 3: Transport Layer

### Purpose
Provides reliable or unreliable delivery of data between applications on different hosts.

### TCP (Transmission Control Protocol)

#### TCP Features
- **Connection-oriented**: Three-way handshake establishes connection
- **Reliable**: Guarantees delivery and correct order
- **Flow control**: Prevents overwhelming the receiver
- **Congestion control**: Adapts to network conditions
- **Error recovery**: Detects and retransmits lost data

#### TCP Connection Lifecycle
```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    
    Note over C,S: Connection Establishment
    C->>S: SYN (seq=100)
    S->>C: SYN-ACK (seq=200, ack=101)
    C->>S: ACK (seq=101, ack=201)
    
    Note over C,S: Data Transfer
    C->>S: Data (seq=101, len=50)
    S->>C: ACK (ack=151)
    S->>C: Data (seq=201, len=100)
    C->>S: ACK (ack=301)
    
    Note over C,S: Connection Termination
    C->>S: FIN (seq=151)
    S->>C: ACK (ack=152)
    S->>C: FIN (seq=301)
    C->>S: ACK (ack=302)
```

#### TCP Header Structure
```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|          Source Port          |       Destination Port        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                        Sequence Number                        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                    Acknowledgment Number                      |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|  Data |           |U|A|P|R|S|F|                               |
| Offset| Reserved  |R|C|S|S|Y|I|            Window             |
|       |           |G|K|H|T|N|N|                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|           Checksum            |         Urgent Pointer        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

#### TCP Flow Control (Sliding Window)
```python
class TCPSlidingWindow:
    def __init__(self, window_size=65536):
        self.window_size = window_size
        self.send_base = 0
        self.next_seq_num = 0
        self.buffer = {}
        self.ack_received = {}
    
    def send_data(self, data):
        """Send data with flow control"""
        if self.next_seq_num < self.send_base + self.window_size:
            # Within window, can send
            self.buffer[self.next_seq_num] = data
            print(f"Sending packet {self.next_seq_num}")
            self.next_seq_num += len(data)
            return True
        else:
            # Window full, must wait
            print("Window full, waiting for ACK")
            return False
    
    def receive_ack(self, ack_num):
        """Process received acknowledgment"""
        if ack_num > self.send_base:
            # Mark packets as acknowledged
            for seq in range(self.send_base, ack_num):
                if seq in self.buffer:
                    del self.buffer[seq]
            
            self.send_base = ack_num
            print(f"ACK received for {ack_num}, window advanced")
```

### UDP (User Datagram Protocol)

#### UDP Features
- **Connectionless**: No connection establishment
- **Unreliable**: No delivery guarantees
- **Fast**: Minimal overhead
- **Simple**: Basic packet delivery

#### UDP Header Structure
```
 0      7 8     15 16    23 24    31
+--------+--------+--------+--------+
|     Source      |   Destination   |
|      Port       |      Port       |
+--------+--------+--------+--------+
|                 |                 |
|     Length      |    Checksum     |
+--------+--------+--------+--------+
|                                   |
|              Data                 |
+-----------------------------------+
```

#### TCP vs UDP Comparison

| Feature | TCP | UDP |
|---------|-----|-----|
| Connection | Connection-oriented | Connectionless |
| Reliability | Reliable delivery | Best-effort delivery |
| Ordering | Ordered delivery | No ordering guarantee |
| Speed | Slower (overhead) | Faster (minimal overhead) |
| Header Size | 20+ bytes | 8 bytes |
| Flow Control | Yes | No |
| Congestion Control | Yes | No |
| Use Cases | Web, email, file transfer | Gaming, streaming, DNS |

### Port Numbers and Socket Programming

#### Well-Known Ports
```python
WELL_KNOWN_PORTS = {
    20: "FTP Data",
    21: "FTP Control", 
    22: "SSH",
    23: "Telnet",
    25: "SMTP",
    53: "DNS",
    80: "HTTP",
    110: "POP3",
    143: "IMAP",
    443: "HTTPS",
    993: "IMAPS",
    995: "POP3S"
}
```

#### Socket Programming Example
```python
import socket
import threading

# TCP Server
class TCPServer:
    def __init__(self, host='localhost', port=8080):
        self.host = host
        self.port = port
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    
    def start(self):
        self.socket.bind((self.host, self.port))
        self.socket.listen(5)
        print(f"TCP Server listening on {self.host}:{self.port}")
        
        while True:
            client_socket, address = self.socket.accept()
            print(f"Connection from {address}")
            
            # Handle client in separate thread
            client_thread = threading.Thread(
                target=self.handle_client,
                args=(client_socket,)
            )
            client_thread.start()
    
    def handle_client(self, client_socket):
        try:
            while True:
                data = client_socket.recv(1024)
                if not data:
                    break
                
                # Echo back to client
                response = f"Echo: {data.decode()}"
                client_socket.send(response.encode())
        
        except Exception as e:
            print(f"Error handling client: {e}")
        finally:
            client_socket.close()

# UDP Server
class UDPServer:
    def __init__(self, host='localhost', port=8081):
        self.host = host
        self.port = port
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    
    def start(self):
        self.socket.bind((self.host, self.port))
        print(f"UDP Server listening on {self.host}:{self.port}")
        
        while True:
            data, address = self.socket.recvfrom(1024)
            print(f"Received from {address}: {data.decode()}")
            
            # Echo back to client
            response = f"Echo: {data.decode()}"
            self.socket.sendto(response.encode(), address)

# Usage
if __name__ == "__main__":
    # Start TCP server
    tcp_server = TCPServer()
    tcp_thread = threading.Thread(target=tcp_server.start)
    tcp_thread.daemon = True
    tcp_thread.start()
    
    # Start UDP server
    udp_server = UDPServer()
    udp_server.start()
```

### Transport Layer in System Design

#### Connection Pooling
```python
import queue
import threading
import socket
import time

class ConnectionPool:
    def __init__(self, host, port, max_connections=10):
        self.host = host
        self.port = port
        self.max_connections = max_connections
        self.pool = queue.Queue(maxsize=max_connections)
        self.active_connections = 0
        self.lock = threading.Lock()
    
    def get_connection(self, timeout=30):
        """Get connection from pool or create new one"""
        try:
            # Try to get existing connection
            conn = self.pool.get(timeout=1)
            return conn
        except queue.Empty:
            # Create new connection if under limit
            with self.lock:
                if self.active_connections < self.max_connections:
                    conn = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    conn.connect((self.host, self.port))
                    self.active_connections += 1
                    return conn
                else:
                    # Wait for connection to be returned
                    return self.pool.get(timeout=timeout)
    
    def return_connection(self, conn):
        """Return connection to pool"""
        try:
            self.pool.put(conn, timeout=1)
        except queue.Full:
            # Pool full, close connection
            conn.close()
            with self.lock:
                self.active_connections -= 1
    
    def close_all(self):
        """Close all connections in pool"""
        while not self.pool.empty():
            try:
                conn = self.pool.get_nowait()
                conn.close()
            except queue.Empty:
                break
        
        with self.lock:
            self.active_connections = 0

# Usage in web application
pool = ConnectionPool('database.example.com', 5432, max_connections=20)

def make_database_request(query):
    conn = pool.get_connection()
    try:
        # Use connection for database query
        result = execute_query(conn, query)
        return result
    finally:
        pool.return_connection(conn)
```

## Layer 4: Application Layer

### Purpose
Provides network services directly to applications and end users.

### Key Application Protocols

#### HTTP/HTTPS (Web Communication)
```http
# HTTP Request
GET /api/users/123 HTTP/1.1
Host: api.example.com
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
Accept: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Connection: keep-alive

# HTTP Response
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 156
Cache-Control: max-age=3600
Connection: keep-alive

{
  "id": 123,
  "name": "John Doe",
  "email": "john@example.com",
  "created_at": "2023-01-15T10:30:00Z"
}
```

#### DNS (Domain Name System)
```mermaid
sequenceDiagram
    participant C as Client
    participant R as Recursive Resolver
    participant Root as Root Server
    participant TLD as .com TLD Server
    participant Auth as Authoritative Server
    
    C->>R: Query: www.example.com
    R->>Root: Query: www.example.com
    Root->>R: Refer to .com TLD
    R->>TLD: Query: www.example.com
    TLD->>R: Refer to example.com NS
    R->>Auth: Query: www.example.com
    Auth->>R: A record: 93.184.216.34
    R->>C: Response: 93.184.216.34
```

#### SMTP (Email)
```
# SMTP Session Example
S: 220 mail.example.com ESMTP Postfix
C: EHLO client.example.com
S: 250-mail.example.com
S: 250-PIPELINING
S: 250-SIZE 10240000
S: 250-VRFY
S: 250 8BITMIME
C: MAIL FROM:<sender@example.com>
S: 250 2.1.0 Ok
C: RCPT TO:<recipient@example.com>
S: 250 2.1.5 Ok
C: DATA
S: 354 End data with <CR><LF>.<CR><LF>
C: Subject: Test Email
C: From: sender@example.com
C: To: recipient@example.com
C: 
C: This is a test message.
C: .
S: 250 2.0.0 Ok: queued as 12345
C: QUIT
S: 221 2.0.0 Bye
```

### Application Layer Protocols in System Design

#### RESTful API Design
```python
from flask import Flask, jsonify, request
import json

app = Flask(__name__)

# HTTP methods mapping to CRUD operations
@app.route('/api/users', methods=['GET'])
def get_users():
    """GET /api/users - Retrieve all users"""
    users = database.get_all_users()
    return jsonify({
        'users': users,
        'total': len(users),
        'page': request.args.get('page', 1),
        'per_page': request.args.get('per_page', 10)
    })

@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """GET /api/users/{id} - Retrieve specific user"""
    user = database.get_user(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify(user)

@app.route('/api/users', methods=['POST'])
def create_user():
    """POST /api/users - Create new user"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'email']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing field: {field}'}), 400
    
    user = database.create_user(data)
    return jsonify(user), 201

@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """PUT /api/users/{id} - Update user"""
    data = request.get_json()
    user = database.update_user(user_id, data)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify(user)

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """DELETE /api/users/{id} - Delete user"""
    success = database.delete_user(user_id)
    
    if not success:
        return jsonify({'error': 'User not found'}), 404
    
    return '', 204

# Error handling
@app.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad request'}), 400

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500
```

#### WebSocket Implementation
```python
import asyncio
import websockets
import json

class WebSocketServer:
    def __init__(self):
        self.clients = set()
        self.rooms = {}
    
    async def register_client(self, websocket, path):
        """Register new WebSocket client"""
        self.clients.add(websocket)
        print(f"Client connected: {websocket.remote_address}")
        
        try:
            await self.handle_client(websocket)
        except websockets.exceptions.ConnectionClosed:
            print(f"Client disconnected: {websocket.remote_address}")
        finally:
            self.clients.remove(websocket)
    
    async def handle_client(self, websocket):
        """Handle messages from client"""
        async for message in websocket:
            try:
                data = json.loads(message)
                await self.process_message(websocket, data)
            except json.JSONDecodeError:
                await websocket.send(json.dumps({
                    'error': 'Invalid JSON format'
                }))
    
    async def process_message(self, websocket, data):
        """Process different message types"""
        message_type = data.get('type')
        
        if message_type == 'join_room':
            await self.join_room(websocket, data['room'])
        elif message_type == 'leave_room':
            await self.leave_room(websocket, data['room'])
        elif message_type == 'chat_message':
            await self.broadcast_to_room(data['room'], data)
        elif message_type == 'ping':
            await websocket.send(json.dumps({'type': 'pong'}))
    
    async def join_room(self, websocket, room_name):
        """Add client to room"""
        if room_name not in self.rooms:
            self.rooms[room_name] = set()
        
        self.rooms[room_name].add(websocket)
        
        await websocket.send(json.dumps({
            'type': 'room_joined',
            'room': room_name
        }))
    
    async def broadcast_to_room(self, room_name, message):
        """Send message to all clients in room"""
        if room_name in self.rooms:
            disconnected = set()
            
            for client in self.rooms[room_name]:
                try:
                    await client.send(json.dumps(message))
                except websockets.exceptions.ConnectionClosed:
                    disconnected.add(client)
            
            # Remove disconnected clients
            self.rooms[room_name] -= disconnected

# Start WebSocket server
server = WebSocketServer()
start_server = websockets.serve(
    server.register_client, 
    "localhost", 
    8765
)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
```

## TCP/IP Model in System Design

### Protocol Selection Guidelines

#### When to Use TCP
```python
# Example: File upload service (requires reliability)
class FileUploadService:
    def __init__(self):
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        # TCP ensures all file data arrives correctly
    
    def upload_file(self, file_path, server_address):
        try:
            self.socket.connect(server_address)
            
            with open(file_path, 'rb') as file:
                while True:
                    chunk = file.read(8192)
                    if not chunk:
                        break
                    
                    # TCP guarantees delivery and order
                    self.socket.sendall(chunk)
            
            # Receive confirmation
            response = self.socket.recv(1024)
            return response.decode()
        
        finally:
            self.socket.close()
```

#### When to Use UDP
```python
# Example: Real-time game state updates (speed over reliability)
class GameStateUpdater:
    def __init__(self):
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # UDP for low-latency updates
    
    def send_player_position(self, position, server_address):
        # Game can tolerate occasional lost packets
        # but needs low latency
        message = json.dumps({
            'type': 'position_update',
            'x': position.x,
            'y': position.y,
            'timestamp': time.time()
        })
        
        self.socket.sendto(message.encode(), server_address)
    
    def receive_game_updates(self):
        while True:
            try:
                data, address = self.socket.recvfrom(1024)
                update = json.loads(data.decode())
                self.process_game_update(update)
            except socket.timeout:
                # Timeout is acceptable for game updates
                continue
```

### Performance Optimization Strategies

#### TCP Optimization
```python
import socket

def optimize_tcp_socket(sock):
    """Apply TCP optimizations for high-performance applications"""
    
    # Disable Nagle's algorithm for low latency
    sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
    
    # Enable TCP keep-alive
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_KEEPALIVE, 1)
    
    # Set keep-alive parameters (Linux)
    sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPIDLE, 60)
    sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPINTVL, 10)
    sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPCNT, 3)
    
    # Increase socket buffer sizes
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF, 65536)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_SNDBUF, 65536)
    
    # Enable address reuse
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

# Usage in high-performance server
server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
optimize_tcp_socket(server_socket)
```

#### Network Monitoring and Diagnostics
```python
import subprocess
import re
import time

class NetworkDiagnostics:
    def __init__(self):
        self.metrics = {}
    
    def check_tcp_connections(self):
        """Monitor TCP connection states"""
        try:
            result = subprocess.run(['netstat', '-an'], 
                                  capture_output=True, text=True)
            
            states = {}
            for line in result.stdout.split('\n'):
                if 'tcp' in line.lower():
                    parts = line.split()
                    if len(parts) >= 6:
                        state = parts[5]
                        states[state] = states.get(state, 0) + 1
            
            return states
        except Exception as e:
            print(f"Error checking TCP connections: {e}")
            return {}
    
    def measure_latency(self, host, count=4):
        """Measure network latency using ping"""
        try:
            result = subprocess.run(
                ['ping', '-c', str(count), host],
                capture_output=True, text=True
            )
            
            # Parse ping output for latency statistics
            lines = result.stdout.split('\n')
            for line in lines:
                if 'min/avg/max' in line:
                    # Extract average latency
                    match = re.search(r'= ([\d.]+)/([\d.]+)/([\d.]+)', line)
                    if match:
                        return {
                            'min': float(match.group(1)),
                            'avg': float(match.group(2)),
                            'max': float(match.group(3))
                        }
        except Exception as e:
            print(f"Error measuring latency: {e}")
            return None
    
    def check_bandwidth(self, interface='eth0'):
        """Monitor network interface bandwidth usage"""
        try:
            with open(f'/sys/class/net/{interface}/statistics/rx_bytes') as f:
                rx_bytes = int(f.read().strip())
            
            with open(f'/sys/class/net/{interface}/statistics/tx_bytes') as f:
                tx_bytes = int(f.read().strip())
            
            return {
                'rx_bytes': rx_bytes,
                'tx_bytes': tx_bytes,
                'total_bytes': rx_bytes + tx_bytes
            }
        except Exception as e:
            print(f"Error checking bandwidth: {e}")
            return None

# Usage in monitoring system
diagnostics = NetworkDiagnostics()

def monitor_network_health():
    while True:
        # Check TCP connection states
        tcp_states = diagnostics.check_tcp_connections()
        print(f"TCP States: {tcp_states}")
        
        # Measure latency to key services
        latency = diagnostics.measure_latency('google.com')
        if latency:
            print(f"Latency to Google: {latency['avg']:.2f}ms")
        
        # Check bandwidth usage
        bandwidth = diagnostics.check_bandwidth()
        if bandwidth:
            print(f"Network Usage: RX={bandwidth['rx_bytes']:,} TX={bandwidth['tx_bytes']:,}")
        
        time.sleep(60)  # Monitor every minute
```

## Common TCP/IP Interview Questions

### Q: "Explain the difference between TCP and UDP"

**Answer Structure:**
1. **Connection Model**: TCP is connection-oriented, UDP is connectionless
2. **Reliability**: TCP guarantees delivery, UDP is best-effort
3. **Performance**: UDP is faster due to lower overhead
4. **Use Cases**: TCP for web/email, UDP for gaming/streaming
5. **Header Size**: TCP 20+ bytes, UDP 8 bytes

### Q: "How does TCP ensure reliable delivery?"

**Answer Points:**
- **Sequence Numbers**: Track packet order
- **Acknowledgments**: Confirm receipt
- **Retransmission**: Resend lost packets
- **Checksums**: Detect corruption
- **Flow Control**: Prevent buffer overflow
- **Congestion Control**: Adapt to network conditions

### Q: "What happens during a TCP three-way handshake?"

**Answer:**
1. **SYN**: Client sends synchronization request
2. **SYN-ACK**: Server acknowledges and sends its own SYN
3. **ACK**: Client acknowledges server's SYN
4. **Result**: Connection established, data transfer can begin

## Best Practices for System Design

### 1. Choose Appropriate Protocols
```python
# Protocol selection decision tree
def select_protocol(requirements):
    """Select appropriate protocol based on requirements"""
    
    if requirements.get('reliability') == 'critical':
        if requirements.get('real_time') == True:
            return 'TCP with optimizations'
        else:
            return 'TCP'
    
    elif requirements.get('latency') == 'critical':
        if requirements.get('data_loss_tolerance') == 'high':
            return 'UDP'
        else:
            return 'TCP with TCP_NODELAY'
    
    elif requirements.get('throughput') == 'critical':
        return 'TCP with large buffers'
    
    else:
        return 'TCP (default choice)'

# Example usage
web_api_requirements = {
    'reliability': 'critical',
    'real_time': False,
    'latency': 'moderate'
}

gaming_requirements = {
    'reliability': 'moderate',
    'real_time': True,
    'latency': 'critical',
    'data_loss_tolerance': 'high'
}

print(select_protocol(web_api_requirements))  # TCP
print(select_protocol(gaming_requirements))   # UDP
```

### 2. Implement Proper Error Handling
```python
import socket
import time
import random

class RobustNetworkClient:
    def __init__(self, host, port, max_retries=3):
        self.host = host
        self.port = port
        self.max_retries = max_retries
    
    def send_with_retry(self, data):
        """Send data with exponential backoff retry"""
        for attempt in range(self.max_retries):
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(10)  # 10 second timeout
                
                sock.connect((self.host, self.port))
                sock.sendall(data.encode())
                
                response = sock.recv(4096)
                sock.close()
                
                return response.decode()
            
            except (socket.timeout, ConnectionRefusedError, OSError) as e:
                if attempt == self.max_retries - 1:
                    raise e
                
                # Exponential backoff with jitter
                delay = (2 ** attempt) + random.uniform(0, 1)
                print(f"Attempt {attempt + 1} failed, retrying in {delay:.2f}s")
                time.sleep(delay)
```

### 3. Monitor Network Performance
```python
class NetworkPerformanceMonitor:
    def __init__(self):
        self.metrics = {
            'latency_samples': [],
            'throughput_samples': [],
            'error_count': 0,
            'success_count': 0
        }
    
    def record_request(self, latency_ms, bytes_transferred, success):
        """Record network request metrics"""
        self.metrics['latency_samples'].append(latency_ms)
        
        if bytes_transferred > 0:
            throughput = bytes_transferred / (latency_ms / 1000)  # bytes/sec
            self.metrics['throughput_samples'].append(throughput)
        
        if success:
            self.metrics['success_count'] += 1
        else:
            self.metrics['error_count'] += 1
    
    def get_statistics(self):
        """Calculate network performance statistics"""
        latencies = self.metrics['latency_samples']
        throughputs = self.metrics['throughput_samples']
        
        total_requests = self.metrics['success_count'] + self.metrics['error_count']
        
        return {
            'avg_latency_ms': sum(latencies) / len(latencies) if latencies else 0,
            'p95_latency_ms': sorted(latencies)[int(0.95 * len(latencies))] if latencies else 0,
            'avg_throughput_bps': sum(throughputs) / len(throughputs) if throughputs else 0,
            'success_rate': self.metrics['success_count'] / total_requests if total_requests > 0 else 0,
            'total_requests': total_requests
        }

# Usage in application
monitor = NetworkPerformanceMonitor()

def make_api_request(url):
    start_time = time.time()
    try:
        response = requests.get(url, timeout=30)
        end_time = time.time()
        
        latency_ms = (end_time - start_time) * 1000
        bytes_transferred = len(response.content)
        
        monitor.record_request(latency_ms, bytes_transferred, True)
        return response
    
    except Exception as e:
        end_time = time.time()
        latency_ms = (end_time - start_time) * 1000
        
        monitor.record_request(latency_ms, 0, False)
        raise e
```

## Summary

The TCP/IP model is the practical foundation of modern networking:

### Key Takeaways
1. **Four-layer model**: Network Access, Internet, Transport, Application
2. **Protocol selection**: Choose TCP for reliability, UDP for speed
3. **Performance considerations**: Each layer affects overall system performance
4. **Error handling**: Network failures are inevitable, design for resilience
5. **Monitoring**: Track network metrics to identify performance issues

### Practical Applications
- **Web applications**: HTTP over TCP for reliable communication
- **Real-time systems**: UDP for low-latency data transmission
- **Microservices**: TCP for service-to-service communication
- **IoT systems**: UDP for sensor data collection
- **File transfers**: TCP for guaranteed data integrity

### System Design Implications
- Network latency often dominates response time
- Protocol choice affects scalability and performance
- Proper error handling prevents cascade failures
- Monitoring enables proactive issue resolution
- Understanding TCP/IP helps optimize distributed systems

In the next section, we'll explore IP addressing and subnetting in detail, which are crucial for designing network architectures.

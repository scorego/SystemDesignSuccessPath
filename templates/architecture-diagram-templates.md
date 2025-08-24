# Architecture Diagram Templates with Mermaid

## Overview
This document provides standardized Mermaid diagram templates for system design interviews. These templates cover common architectural patterns and can be customized for specific problems.

## High-Level Architecture Templates

### 1. Basic Web Application Architecture
```mermaid
graph TB
    subgraph "Client Layer"
        Web[Web Browser]
        Mobile[Mobile App]
        API_Client[API Client]
    end
    
    subgraph "Load Balancing"
        LB[Load Balancer]
        CDN[CDN]
    end
    
    subgraph "Application Layer"
        API[API Gateway]
        Auth[Auth Service]
        App1[App Server 1]
        App2[App Server 2]
        App3[App Server N]
    end
    
    subgraph "Data Layer"
        Cache[(Redis Cache)]
        DB_Master[(Master DB)]
        DB_Replica1[(Replica 1)]
        DB_Replica2[(Replica 2)]
    end
    
    subgraph "External Services"
        Payment[Payment Service]
        Email[Email Service]
        Analytics[Analytics]
    end
    
    Web --> CDN
    Mobile --> LB
    API_Client --> LB
    CDN --> LB
    LB --> API
    API --> Auth
    API --> App1
    API --> App2
    API --> App3
    
    App1 --> Cache
    App2 --> Cache
    App3 --> Cache
    
    App1 --> DB_Master
    App2 --> DB_Master
    App3 --> DB_Master
    
    App1 --> DB_Replica1
    App2 --> DB_Replica1
    App3 --> DB_Replica2
    
    App1 --> Payment
    App2 --> Email
    App3 --> Analytics
    
    DB_Master --> DB_Replica1
    DB_Master --> DB_Replica2
```

### 2. Microservices Architecture
```mermaid
graph TB
    subgraph "Client Applications"
        Web[Web App]
        Mobile[Mobile App]
        Partner[Partner API]
    end
    
    subgraph "API Gateway Layer"
        Gateway[API Gateway]
        Auth[Authentication]
        RateLimit[Rate Limiter]
    end
    
    subgraph "Microservices"
        UserService[User Service]
        ProductService[Product Service]
        OrderService[Order Service]
        PaymentService[Payment Service]
        NotificationService[Notification Service]
        SearchService[Search Service]
    end
    
    subgraph "Message Queue"
        Queue[Message Queue/Kafka]
    end
    
    subgraph "Data Stores"
        UserDB[(User DB)]
        ProductDB[(Product DB)]
        OrderDB[(Order DB)]
        PaymentDB[(Payment DB)]
        SearchIndex[(Search Index)]
        Cache[(Distributed Cache)]
    end
    
    subgraph "External Services"
        PaymentGateway[Payment Gateway]
        EmailService[Email Service]
        SMSService[SMS Service]
    end
    
    Web --> Gateway
    Mobile --> Gateway
    Partner --> Gateway
    
    Gateway --> Auth
    Gateway --> RateLimit
    Gateway --> UserService
    Gateway --> ProductService
    Gateway --> OrderService
    Gateway --> PaymentService
    Gateway --> SearchService
    
    UserService --> UserDB
    ProductService --> ProductDB
    OrderService --> OrderDB
    PaymentService --> PaymentDB
    SearchService --> SearchIndex
    
    UserService --> Cache
    ProductService --> Cache
    OrderService --> Cache
    
    OrderService --> Queue
    PaymentService --> Queue
    NotificationService --> Queue
    
    PaymentService --> PaymentGateway
    NotificationService --> EmailService
    NotificationService --> SMSService
```

### 3. Event-Driven Architecture
```mermaid
graph TB
    subgraph "Event Producers"
        WebApp[Web Application]
        MobileApp[Mobile App]
        APIService[API Service]
        Scheduler[Scheduled Jobs]
    end
    
    subgraph "Event Streaming Platform"
        EventBus[Event Bus/Kafka]
        EventStore[(Event Store)]
    end
    
    subgraph "Event Processors"
        Processor1[Event Processor 1]
        Processor2[Event Processor 2]
        Processor3[Event Processor 3]
        Aggregator[Event Aggregator]
    end
    
    subgraph "Read Models"
        ReadDB1[(Read Model 1)]
        ReadDB2[(Read Model 2)]
        ReadDB3[(Read Model 3)]
        Analytics[(Analytics DB)]
    end
    
    subgraph "Query Services"
        QueryAPI1[Query API 1]
        QueryAPI2[Query API 2]
        ReportingAPI[Reporting API]
    end
    
    WebApp --> EventBus
    MobileApp --> EventBus
    APIService --> EventBus
    Scheduler --> EventBus
    
    EventBus --> EventStore
    EventBus --> Processor1
    EventBus --> Processor2
    EventBus --> Processor3
    EventBus --> Aggregator
    
    Processor1 --> ReadDB1
    Processor2 --> ReadDB2
    Processor3 --> ReadDB3
    Aggregator --> Analytics
    
    ReadDB1 --> QueryAPI1
    ReadDB2 --> QueryAPI2
    Analytics --> ReportingAPI
```

## Data Flow Sequence Diagrams

### 1. User Authentication Flow
```mermaid
sequenceDiagram
    participant Client
    participant LoadBalancer as Load Balancer
    participant APIGateway as API Gateway
    participant AuthService as Auth Service
    participant UserDB as User Database
    participant Cache
    participant TokenStore as Token Store
    
    Client->>LoadBalancer: Login Request
    LoadBalancer->>APIGateway: Route Request
    APIGateway->>AuthService: Authenticate User
    
    AuthService->>Cache: Check User Cache
    alt User in Cache
        Cache-->>AuthService: Return User Data
    else User not in Cache
        AuthService->>UserDB: Query User
        UserDB-->>AuthService: Return User Data
        AuthService->>Cache: Store User Data
    end
    
    AuthService->>TokenStore: Generate & Store Token
    TokenStore-->>AuthService: Return Token
    AuthService-->>APIGateway: Authentication Success
    APIGateway-->>LoadBalancer: Return Token
    LoadBalancer-->>Client: Login Success + Token
```

### 2. Data Write Flow with Caching
```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Service
    participant Cache
    participant Database
    participant Queue
    
    Client->>API: Write Request
    API->>Service: Process Write
    
    Service->>Database: Write Data
    Database-->>Service: Write Confirmation
    
    Service->>Cache: Invalidate Cache
    Cache-->>Service: Cache Cleared
    
    Service->>Queue: Publish Event
    Queue-->>Service: Event Published
    
    Service-->>API: Write Success
    API-->>Client: Success Response
    
    Note over Queue: Async processing
    Queue->>Service: Process Event
    Service->>Cache: Update Cache
```

### 3. Read-Heavy System Flow
```mermaid
sequenceDiagram
    participant Client
    participant CDN
    participant LoadBalancer as Load Balancer
    participant AppServer as App Server
    participant Cache
    participant ReadReplica as Read Replica
    participant MasterDB as Master DB
    
    Client->>CDN: Request Data
    
    alt Static Content
        CDN-->>Client: Return Cached Content
    else Dynamic Content
        CDN->>LoadBalancer: Forward Request
        LoadBalancer->>AppServer: Route Request
        
        AppServer->>Cache: Check Cache
        alt Cache Hit
            Cache-->>AppServer: Return Data
        else Cache Miss
            AppServer->>ReadReplica: Query Database
            ReadReplica-->>AppServer: Return Data
            AppServer->>Cache: Store in Cache
        end
        
        AppServer-->>LoadBalancer: Return Response
        LoadBalancer-->>CDN: Return Response
        CDN-->>Client: Return Response
    end
```

## Database Design Diagrams

### 1. Database Sharding Architecture
```mermaid
graph TB
    subgraph "Application Layer"
        App1[App Server 1]
        App2[App Server 2]
        App3[App Server 3]
    end
    
    subgraph "Sharding Layer"
        Router[Shard Router]
        ShardMap[(Shard Mapping)]
    end
    
    subgraph "Shard 1 (Users 1-1M)"
        Shard1Master[(Shard 1 Master)]
        Shard1Replica[(Shard 1 Replica)]
    end
    
    subgraph "Shard 2 (Users 1M-2M)"
        Shard2Master[(Shard 2 Master)]
        Shard2Replica[(Shard 2 Replica)]
    end
    
    subgraph "Shard 3 (Users 2M-3M)"
        Shard3Master[(Shard 3 Master)]
        Shard3Replica[(Shard 3 Replica)]
    end
    
    App1 --> Router
    App2 --> Router
    App3 --> Router
    
    Router --> ShardMap
    Router --> Shard1Master
    Router --> Shard2Master
    Router --> Shard3Master
    
    Router --> Shard1Replica
    Router --> Shard2Replica
    Router --> Shard3Replica
    
    Shard1Master --> Shard1Replica
    Shard2Master --> Shard2Replica
    Shard3Master --> Shard3Replica
```

### 2. Master-Slave Replication
```mermaid
graph TB
    subgraph "Application Servers"
        WriteApp[Write App]
        ReadApp1[Read App 1]
        ReadApp2[Read App 2]
        ReadApp3[Read App 3]
    end
    
    subgraph "Database Cluster"
        Master[(Master DB)]
        Slave1[(Slave 1)]
        Slave2[(Slave 2)]
        Slave3[(Slave 3)]
    end
    
    subgraph "Load Balancer"
        ReadLB[Read Load Balancer]
    end
    
    WriteApp --> Master
    ReadApp1 --> ReadLB
    ReadApp2 --> ReadLB
    ReadApp3 --> ReadLB
    
    ReadLB --> Slave1
    ReadLB --> Slave2
    ReadLB --> Slave3
    
    Master -.->|Replication| Slave1
    Master -.->|Replication| Slave2
    Master -.->|Replication| Slave3
```

## Caching Architecture Diagrams

### 1. Multi-Level Caching
```mermaid
graph TB
    subgraph "Client Side"
        Browser[Browser Cache]
        MobileCache[Mobile App Cache]
    end
    
    subgraph "CDN Layer"
        EdgeCache[Edge Cache]
        RegionalCache[Regional Cache]
    end
    
    subgraph "Application Layer"
        LB[Load Balancer]
        AppServer1[App Server 1]
        AppServer2[App Server 2]
    end
    
    subgraph "Caching Layer"
        L1Cache[L1 Cache - In Memory]
        L2Cache[L2 Cache - Redis Cluster]
    end
    
    subgraph "Database Layer"
        DBCache[Database Buffer Pool]
        Database[(Primary Database)]
    end
    
    Browser --> EdgeCache
    MobileCache --> EdgeCache
    EdgeCache --> RegionalCache
    RegionalCache --> LB
    
    LB --> AppServer1
    LB --> AppServer2
    
    AppServer1 --> L1Cache
    AppServer2 --> L1Cache
    AppServer1 --> L2Cache
    AppServer2 --> L2Cache
    
    AppServer1 --> Database
    AppServer2 --> Database
    Database --> DBCache
```

### 2. Cache-Aside Pattern
```mermaid
sequenceDiagram
    participant App as Application
    participant Cache
    participant DB as Database
    
    Note over App,DB: Read Operation
    App->>Cache: Get(key)
    alt Cache Hit
        Cache-->>App: Return Value
    else Cache Miss
        Cache-->>App: Cache Miss
        App->>DB: Query Database
        DB-->>App: Return Data
        App->>Cache: Set(key, data)
        Cache-->>App: Stored
    end
    
    Note over App,DB: Write Operation
    App->>DB: Update Data
    DB-->>App: Update Success
    App->>Cache: Delete(key)
    Cache-->>App: Deleted
```

## Message Queue Architectures

### 1. Pub/Sub Pattern
```mermaid
graph TB
    subgraph "Publishers"
        UserService[User Service]
        OrderService[Order Service]
        PaymentService[Payment Service]
    end
    
    subgraph "Message Broker"
        Topic1[User Events Topic]
        Topic2[Order Events Topic]
        Topic3[Payment Events Topic]
    end
    
    subgraph "Subscribers"
        EmailService[Email Service]
        AnalyticsService[Analytics Service]
        AuditService[Audit Service]
        RecommendationService[Recommendation Service]
    end
    
    UserService --> Topic1
    OrderService --> Topic2
    PaymentService --> Topic3
    
    Topic1 --> EmailService
    Topic1 --> AnalyticsService
    Topic1 --> AuditService
    
    Topic2 --> EmailService
    Topic2 --> AnalyticsService
    Topic2 --> RecommendationService
    
    Topic3 --> AuditService
    Topic3 --> AnalyticsService
```

### 2. Event Sourcing Pattern
```mermaid
graph TB
    subgraph "Command Side"
        Command[Command Handler]
        Aggregate[Aggregate Root]
        EventStore[(Event Store)]
    end
    
    subgraph "Event Processing"
        EventBus[Event Bus]
        Projector1[Projector 1]
        Projector2[Projector 2]
        Projector3[Projector 3]
    end
    
    subgraph "Query Side"
        ReadModel1[(Read Model 1)]
        ReadModel2[(Read Model 2)]
        ReadModel3[(Read Model 3)]
        QueryHandler[Query Handler]
    end
    
    Command --> Aggregate
    Aggregate --> EventStore
    EventStore --> EventBus
    
    EventBus --> Projector1
    EventBus --> Projector2
    EventBus --> Projector3
    
    Projector1 --> ReadModel1
    Projector2 --> ReadModel2
    Projector3 --> ReadModel3
    
    ReadModel1 --> QueryHandler
    ReadModel2 --> QueryHandler
    ReadModel3 --> QueryHandler
```

## Deployment Architecture Diagrams

### 1. Multi-Region Deployment
```mermaid
graph TB
    subgraph "Global"
        DNS[Global DNS/Route 53]
        GlobalLB[Global Load Balancer]
    end
    
    subgraph "US East Region"
        USEastLB[Regional LB]
        USEastApp[App Servers]
        USEastDB[(Primary DB)]
        USEastCache[Cache Cluster]
    end
    
    subgraph "US West Region"
        USWestLB[Regional LB]
        USWestApp[App Servers]
        USWestDB[(Read Replica)]
        USWestCache[Cache Cluster]
    end
    
    subgraph "EU Region"
        EURegionLB[Regional LB]
        EURegionApp[App Servers]
        EURegionDB[(Read Replica)]
        EURegionCache[Cache Cluster]
    end
    
    DNS --> GlobalLB
    GlobalLB --> USEastLB
    GlobalLB --> USWestLB
    GlobalLB --> EURegionLB
    
    USEastLB --> USEastApp
    USWestLB --> USWestApp
    EURegionLB --> EURegionApp
    
    USEastApp --> USEastDB
    USEastApp --> USEastCache
    USWestApp --> USWestDB
    USWestApp --> USWestCache
    EURegionApp --> EURegionDB
    EURegionApp --> EURegionCache
    
    USEastDB -.->|Replication| USWestDB
    USEastDB -.->|Replication| EURegionDB
```

### 2. Container Orchestration
```mermaid
graph TB
    subgraph "Kubernetes Cluster"
        subgraph "Master Nodes"
            APIServer[API Server]
            Scheduler[Scheduler]
            Controller[Controller Manager]
            etcd[(etcd)]
        end
        
        subgraph "Worker Node 1"
            Kubelet1[Kubelet]
            Pod1[App Pod 1]
            Pod2[App Pod 2]
        end
        
        subgraph "Worker Node 2"
            Kubelet2[Kubelet]
            Pod3[App Pod 3]
            Pod4[Cache Pod]
        end
        
        subgraph "Worker Node 3"
            Kubelet3[Kubelet]
            Pod5[DB Pod]
            Pod6[Monitoring Pod]
        end
    end
    
    subgraph "External"
        LoadBalancer[External LB]
        Storage[(Persistent Storage)]
    end
    
    LoadBalancer --> Pod1
    LoadBalancer --> Pod2
    LoadBalancer --> Pod3
    
    APIServer --> etcd
    Scheduler --> APIServer
    Controller --> APIServer
    
    Kubelet1 --> APIServer
    Kubelet2 --> APIServer
    Kubelet3 --> APIServer
    
    Pod5 --> Storage
```

## Monitoring and Observability

### 1. Observability Stack
```mermaid
graph TB
    subgraph "Applications"
        App1[App Service 1]
        App2[App Service 2]
        App3[App Service 3]
        Database[(Database)]
        Cache[(Cache)]
    end
    
    subgraph "Data Collection"
        MetricsAgent[Metrics Agent]
        LogAgent[Log Agent]
        TraceAgent[Trace Agent]
    end
    
    subgraph "Storage & Processing"
        Prometheus[(Prometheus)]
        ElasticSearch[(Elasticsearch)]
        Jaeger[(Jaeger)]
    end
    
    subgraph "Visualization & Alerting"
        Grafana[Grafana]
        Kibana[Kibana]
        AlertManager[Alert Manager]
        PagerDuty[PagerDuty]
    end
    
    App1 --> MetricsAgent
    App2 --> MetricsAgent
    App3 --> MetricsAgent
    Database --> MetricsAgent
    Cache --> MetricsAgent
    
    App1 --> LogAgent
    App2 --> LogAgent
    App3 --> LogAgent
    
    App1 --> TraceAgent
    App2 --> TraceAgent
    App3 --> TraceAgent
    
    MetricsAgent --> Prometheus
    LogAgent --> ElasticSearch
    TraceAgent --> Jaeger
    
    Prometheus --> Grafana
    ElasticSearch --> Kibana
    Jaeger --> Grafana
    
    Prometheus --> AlertManager
    AlertManager --> PagerDuty
```

## Template Usage Guidelines

### Choosing the Right Template
1. **Basic Web App**: Simple CRUD applications, small to medium scale
2. **Microservices**: Complex applications with multiple domains
3. **Event-Driven**: Real-time systems, high scalability requirements
4. **Multi-Region**: Global applications, disaster recovery needs

### Customization Tips
1. **Replace Generic Names**: Use domain-specific service names
2. **Add Specific Components**: Include relevant technologies (Redis, Kafka, etc.)
3. **Show Data Flow**: Add arrows to indicate data direction
4. **Include Metrics**: Add capacity numbers where relevant
5. **Color Coding**: Use colors to group related components

### Best Practices
1. **Start Simple**: Begin with high-level architecture
2. **Progressive Detail**: Add detail in subsequent diagrams
3. **Consistent Naming**: Use consistent service and component names
4. **Clear Relationships**: Make connections and dependencies obvious
5. **Readable Layout**: Ensure diagrams are easy to follow

### Common Patterns to Include
- Load balancing and failover
- Caching at multiple levels
- Database replication and sharding
- Asynchronous processing
- Monitoring and logging
- Security boundaries
- Scaling bottlenecks and solutions
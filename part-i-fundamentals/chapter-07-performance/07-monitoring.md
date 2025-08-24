# Monitoring & Alerting Basics

## Introduction

Monitoring and alerting are essential for maintaining system health, performance, and reliability. Effective monitoring provides visibility into your system's behavior, helps you detect issues before they impact users, and gives you the data needed to make informed decisions about optimization and scaling. Good monitoring is proactive rather than reactive - it helps you prevent problems rather than just respond to them.

## The Three Pillars of Observability

### 1. Metrics

**Definition**: Numerical measurements of system behavior over time, typically aggregated and stored as time series data.

**Characteristics**:
- Quantitative data points
- Efficient storage and querying
- Good for alerting and dashboards
- Limited context for debugging

**Types of Metrics**:
```
Counter Metrics:
- Total requests processed
- Total errors encountered
- Total bytes transferred
- Always increasing values

Gauge Metrics:
- Current CPU usage
- Active connections
- Queue length
- Point-in-time values

Histogram Metrics:
- Response time distribution
- Request size distribution
- Latency percentiles
- Distribution of values over time

Summary Metrics:
- Average response time
- Request rate over time window
- Aggregated statistics
```

**Example Metrics Collection**:
```python
# Python example with Prometheus client
from prometheus_client import Counter, Histogram, Gauge, start_http_server
import time

# Define metrics
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint'])
REQUEST_LATENCY = Histogram('http_request_duration_seconds', 'HTTP request latency')
ACTIVE_CONNECTIONS = Gauge('active_connections', 'Number of active connections')

def process_request(method, endpoint):
    REQUEST_COUNT.labels(method=method, endpoint=endpoint).inc()
    
    with REQUEST_LATENCY.time():
        # Process the request
        time.sleep(0.1)  # Simulate processing
    
    ACTIVE_CONNECTIONS.set(get_active_connection_count())

# Start metrics server
start_http_server(8000)
```

### 2. Logs

**Definition**: Discrete events with timestamps that provide detailed context about what happened in your system.

**Characteristics**:
- Rich contextual information
- Human-readable format
- Good for debugging and forensics
- Can be expensive to store and search

**Log Levels and Usage**:
```
ERROR: System errors, exceptions, failures
- Use for: Issues requiring immediate attention
- Example: "Database connection failed: timeout after 30s"

WARN: Potential issues, degraded performance
- Use for: Issues that might need attention
- Example: "Response time exceeded 2s threshold: 2.3s"

INFO: Important business events, state changes
- Use for: Significant application events
- Example: "User 12345 completed purchase: order #67890"

DEBUG: Detailed diagnostic information
- Use for: Development and troubleshooting
- Example: "Cache miss for key 'user:12345', fetching from database"
```

**Structured Logging Example**:
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "INFO",
  "service": "user-service",
  "traceId": "abc123def456",
  "userId": "12345",
  "action": "login",
  "duration": 150,
  "success": true,
  "metadata": {
    "userAgent": "Mozilla/5.0...",
    "ipAddress": "192.168.1.100",
    "sessionId": "sess_789xyz"
  }
}
```

### 3. Traces

**Definition**: Records of the path a request takes through your system, showing the sequence of operations and their relationships.

**Characteristics**:
- End-to-end request visibility
- Shows service dependencies
- Excellent for debugging distributed systems
- Higher overhead than metrics

**Distributed Tracing Example**:
```
Trace: User Login Request
├── Frontend (50ms)
│   └── API Gateway (20ms)
│       ├── Authentication Service (100ms)
│       │   ├── Database Query (80ms)
│       │   └── Cache Lookup (15ms)
│       └── User Service (30ms)
│           └── Profile Database (25ms)
Total: 200ms
```

## Monitoring Strategy Framework

### 1. The USE Method (Utilization, Saturation, Errors)

**For Every Resource, Monitor**:
```
Utilization: How busy the resource is
- CPU utilization percentage
- Memory usage percentage
- Disk I/O utilization
- Network bandwidth usage

Saturation: How much extra work is queued
- CPU run queue length
- Memory swap usage
- Disk I/O queue depth
- Network buffer overruns

Errors: Count of error events
- Failed requests
- Disk errors
- Network packet drops
- Application exceptions
```

### 2. The RED Method (Rate, Errors, Duration)

**For Every Service, Monitor**:
```
Rate: Number of requests per second
- HTTP requests/second
- Database queries/second
- Message processing rate
- API call frequency

Errors: Number of failed requests per second
- HTTP 4xx/5xx responses
- Database connection failures
- Timeout errors
- Exception rates

Duration: Time taken to process requests
- Response time percentiles (P50, P95, P99)
- Database query latency
- External API call duration
- End-to-end request time
```

### 3. The Four Golden Signals

**Google's SRE Approach**:
```
Latency: Time to process requests
- Successful request latency
- Failed request latency
- Different latency for different request types

Traffic: Demand on your system
- HTTP requests per second
- Database transactions per second
- Network I/O rate
- Concurrent users

Errors: Rate of failed requests
- Explicit failures (HTTP 500s)
- Implicit failures (HTTP 200 with wrong content)
- Policy failures (responses taking too long)

Saturation: How "full" your service is
- Memory utilization
- Thread pool utilization
- I/O utilization
- Critical resource usage
```

## Practical Monitoring Implementation

### Application-Level Monitoring

**Web Application Monitoring**:
```javascript
// Express.js middleware for monitoring
const express = require('express');
const prometheus = require('prom-client');

// Create metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestsTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Monitoring middleware
function monitoringMiddleware(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const labels = {
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode
    };
    
    httpRequestDuration.labels(labels).observe(duration);
    httpRequestsTotal.labels(labels).inc();
  });
  
  next();
}

const app = express();
app.use(monitoringMiddleware);

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(prometheus.register.metrics());
});
```

**Database Monitoring**:
```java
// Java database monitoring with Micrometer
@Component
public class DatabaseMonitor {
    
    private final MeterRegistry meterRegistry;
    private final Timer.Sample sample;
    
    public DatabaseMonitor(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }
    
    @EventListener
    public void handleQueryStart(QueryStartEvent event) {
        Timer.Sample.start(meterRegistry)
            .tag("query.type", event.getQueryType())
            .tag("table", event.getTableName());
    }
    
    @EventListener
    public void handleQueryEnd(QueryEndEvent event) {
        event.getSample().stop(Timer.builder("database.query.duration")
            .description("Database query execution time")
            .tag("query.type", event.getQueryType())
            .tag("table", event.getTableName())
            .tag("success", String.valueOf(event.isSuccess()))
            .register(meterRegistry));
        
        // Count queries
        Counter.builder("database.queries.total")
            .description("Total database queries")
            .tag("query.type", event.getQueryType())
            .tag("table", event.getTableName())
            .register(meterRegistry)
            .increment();
    }
}
```

### Infrastructure Monitoring

**System Metrics Collection**:
```yaml
# Prometheus Node Exporter configuration
# /etc/systemd/system/node_exporter.service
[Unit]
Description=Node Exporter
After=network.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter \
  --collector.systemd \
  --collector.processes \
  --collector.interrupts \
  --collector.tcpstat

[Install]
WantedBy=multi-user.target
```

**Container Monitoring**:
```yaml
# Docker Compose with monitoring
version: '3.8'
services:
  app:
    image: myapp:latest
    ports:
      - "8080:8080"
    labels:
      - "prometheus.io/scrape=true"
      - "prometheus.io/port=8080"
      - "prometheus.io/path=/metrics"
  
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
  
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-storage:/var/lib/grafana

volumes:
  grafana-storage:
```

## Alerting Strategy

### 1. Alert Design Principles

**Actionable Alerts**:
```
Good Alert Characteristics:
✅ Indicates a real problem affecting users
✅ Requires immediate human intervention
✅ Provides enough context to start investigation
✅ Has clear escalation path
✅ Can be resolved by the person receiving it

Poor Alert Characteristics:
❌ Fires for normal system behavior
❌ No clear action required
❌ Lacks context for investigation
❌ Alert fatigue from too many notifications
❌ False positives or flapping alerts
```

**Alert Severity Levels**:
```
P0 - Critical (Immediate Response):
- Service completely down
- Data loss occurring
- Security breach detected
- Revenue-impacting outage
Response Time: 15 minutes

P1 - High (Urgent Response):
- Significant performance degradation
- Partial service outage
- High error rates
- Approaching resource limits
Response Time: 1 hour

P2 - Medium (Normal Response):
- Minor performance issues
- Non-critical feature failures
- Resource usage warnings
- Capacity planning alerts
Response Time: 4 hours

P3 - Low (Informational):
- Maintenance reminders
- Trend notifications
- Non-urgent optimizations
Response Time: Next business day
```

### 2. Alert Rules and Thresholds

**Prometheus Alerting Rules**:
```yaml
# alerting_rules.yml
groups:
  - name: application_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors per second"
      
      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
          description: "95th percentile latency is {{ $value }}s"
      
      - alert: DatabaseConnectionPoolExhaustion
        expr: database_connections_active / database_connections_max > 0.9
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Database connection pool nearly exhausted"
          description: "{{ $value | humanizePercentage }} of connections in use"

  - name: infrastructure_alerts
    rules:
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.instance }}"
          description: "CPU usage is {{ $value }}%"
      
      - alert: HighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 90
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High memory usage on {{ $labels.instance }}"
          description: "Memory usage is {{ $value }}%"
      
      - alert: DiskSpaceLow
        expr: (1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Low disk space on {{ $labels.instance }}"
          description: "Disk usage is {{ $value }}% on {{ $labels.mountpoint }}"
```

### 3. Alert Routing and Escalation

**Alertmanager Configuration**:
```yaml
# alertmanager.yml
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@company.com'

route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 12h
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'critical-alerts'
      group_wait: 10s
      repeat_interval: 5m
    
    - match:
        severity: warning
      receiver: 'warning-alerts'
      repeat_interval: 24h

receivers:
  - name: 'default'
    email_configs:
      - to: 'team@company.com'
        subject: 'Alert: {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          {{ end }}

  - name: 'critical-alerts'
    email_configs:
      - to: 'oncall@company.com'
        subject: 'CRITICAL: {{ .GroupLabels.alertname }}'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/...'
        channel: '#alerts'
        title: 'Critical Alert'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
    pagerduty_configs:
      - service_key: 'your-pagerduty-service-key'

  - name: 'warning-alerts'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/...'
        channel: '#monitoring'
        title: 'Warning Alert'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'instance']
```

## Dashboard Design

### 1. Effective Dashboard Principles

**Dashboard Hierarchy**:
```
Level 1: Executive Dashboard
- High-level business metrics
- Overall system health
- SLA compliance
- Revenue impact metrics

Level 2: Operational Dashboard  
- Service health overview
- Key performance indicators
- Alert status
- Capacity utilization

Level 3: Technical Dashboard
- Detailed metrics per service
- Infrastructure monitoring
- Performance deep-dive
- Troubleshooting views

Level 4: Debug Dashboard
- Detailed traces and logs
- Error analysis
- Performance profiling
- Root cause analysis
```

**Dashboard Design Best Practices**:
```
Visual Design:
✅ Use consistent color schemes
✅ Group related metrics together
✅ Show trends over time
✅ Include context and thresholds
✅ Use appropriate chart types

Content Organization:
✅ Most important metrics at the top
✅ Logical grouping of panels
✅ Clear titles and descriptions
✅ Consistent time ranges
✅ Drill-down capabilities

Usability:
✅ Fast loading times
✅ Mobile-friendly design
✅ Shareable URLs
✅ Export capabilities
✅ Role-based access control
```

### 2. Sample Dashboard Configurations

**Grafana Service Dashboard**:
```json
{
  "dashboard": {
    "title": "Application Performance Dashboard",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{endpoint}}"
          }
        ],
        "yAxes": [
          {
            "label": "Requests/sec",
            "min": 0
          }
        ]
      },
      {
        "title": "Response Time Percentiles",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "P50"
          },
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "P95"
          },
          {
            "expr": "histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "P99"
          }
        ],
        "yAxes": [
          {
            "label": "Seconds",
            "min": 0
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "singlestat",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m]) / rate(http_requests_total[5m]) * 100",
            "legendFormat": "Error Rate %"
          }
        ],
        "thresholds": "1,5",
        "colorBackground": true
      }
    ]
  }
}
```

## Monitoring Tools and Technologies

### Open Source Monitoring Stack

**Prometheus + Grafana Stack**:
```yaml
# Complete monitoring stack
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus:/etc/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=30d'
      - '--web.enable-lifecycle'
  
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
  
  alertmanager:
    image: prom/alertmanager:latest
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager:/etc/alertmanager
  
  node-exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.ignored-mount-points=^/(sys|proc|dev|host|etc)($$|/)'

volumes:
  grafana-data:
```

**ELK Stack for Logs**:
```yaml
# Elasticsearch, Logstash, Kibana
version: '3.8'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.15.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
  
  logstash:
    image: docker.elastic.co/logstash/logstash:7.15.0
    ports:
      - "5044:5044"
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
    depends_on:
      - elasticsearch
  
  kibana:
    image: docker.elastic.co/kibana/kibana:7.15.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch

volumes:
  elasticsearch-data:
```

### Commercial Monitoring Solutions

**Cloud-Native Monitoring**:
```
AWS CloudWatch:
- Native AWS service integration
- Custom metrics and dashboards
- Automated scaling based on metrics
- Log aggregation and analysis

Google Cloud Monitoring:
- Stackdriver integration
- SRE-focused monitoring
- Error reporting and profiling
- Trace analysis

Azure Monitor:
- Application Insights integration
- Log Analytics workspace
- Automated alerting
- Performance profiling
```

**SaaS Monitoring Platforms**:
```
Datadog:
- Full-stack monitoring
- APM and infrastructure monitoring
- Machine learning-based alerting
- Extensive integrations

New Relic:
- Application performance monitoring
- Real user monitoring
- Synthetic monitoring
- AI-powered insights

Splunk:
- Log analysis and SIEM
- Machine data analytics
- Custom dashboards
- Advanced search capabilities
```

## Monitoring Best Practices

### 1. Monitoring Strategy

**Start with Business Metrics**:
```
Business KPIs to Monitor:
- Revenue per minute
- User conversion rates
- Customer satisfaction scores
- Feature adoption rates
- Support ticket volume

Technical Metrics Supporting Business:
- Page load times → Conversion rates
- API response times → User experience
- Error rates → Customer satisfaction
- Availability → Revenue impact
```

### 2. Alert Fatigue Prevention

**Alert Quality Guidelines**:
```
Before Creating an Alert, Ask:
1. Does this indicate a real problem?
2. Does it require immediate action?
3. Can it be automated instead?
4. Is the threshold appropriate?
5. Will someone be able to fix it?

Alert Hygiene:
- Review alerts monthly
- Remove or adjust noisy alerts
- Combine related alerts
- Use alert dependencies
- Implement alert suppression during maintenance
```

### 3. Monitoring as Code

**Infrastructure as Code for Monitoring**:
```yaml
# Terraform example for CloudWatch alarms
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "high-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    InstanceId = aws_instance.web.id
  }
}

resource "aws_sns_topic" "alerts" {
  name = "system-alerts"
}
```

### 4. Monitoring ROI

**Measuring Monitoring Effectiveness**:
```
Key Metrics:
- Mean Time to Detection (MTTD)
- Mean Time to Resolution (MTTR)
- False positive rate
- Alert response time
- Incident prevention rate

Cost-Benefit Analysis:
- Monitoring tool costs
- Engineering time for setup/maintenance
- Prevented downtime value
- Improved performance impact
- Customer satisfaction improvement
```

## Summary

Effective monitoring and alerting are fundamental to system reliability:

- **Three pillars of observability** (metrics, logs, traces) provide comprehensive system visibility
- **Strategic monitoring** using USE, RED, or Four Golden Signals ensures complete coverage
- **Actionable alerts** prevent alert fatigue and ensure rapid response to real issues
- **Layered dashboards** serve different audiences from executives to engineers
- **Monitoring as code** ensures consistency and version control
- **Business alignment** connects technical metrics to business outcomes
- **Continuous improvement** through regular review and optimization

Remember: The goal of monitoring is not to collect as much data as possible, but to provide the right information at the right time to the right people. Focus on metrics that help you understand system health, user experience, and business impact.

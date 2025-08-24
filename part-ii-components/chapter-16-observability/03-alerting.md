# Alerting

Good alerting is an art. Alert too much, and your team suffers from alert fatigue. Alert too little, and you miss critical issues. The goal is to create alerts that are actionable, timely, and help you maintain system reliability without overwhelming your team.

## Alerting Fundamentals

### The Golden Rules of Alerting

**1. Every Alert Must Be Actionable**
If receiving an alert doesn't require immediate human action, it shouldn't be an alert—it should be a dashboard metric or log entry.

**2. Alerts Should Indicate User Impact**
Focus on symptoms (what users experience) rather than causes (internal system states).

**3. Alerts Should Be Timely**
Alert when you can still prevent user impact, not after it's already happened.

**4. Context Is King**
Provide enough information in the alert to start troubleshooting immediately.

### Alert Severity Levels

```yaml
Severity Levels:
  Critical (P0):
    - Service completely down
    - Data loss occurring
    - Security breach detected
    - Response: Immediate (< 5 minutes)
    - Escalation: Page on-call engineer
    
  High (P1):
    - Significant performance degradation
    - Partial service outage
    - High error rates affecting users
    - Response: Within 30 minutes
    - Escalation: Slack notification + email
    
  Medium (P2):
    - Minor performance issues
    - Non-critical feature failures
    - Resource utilization warnings
    - Response: Within 2 hours
    - Escalation: Email notification
    
  Low (P3):
    - Informational alerts
    - Capacity planning warnings
    - Non-urgent maintenance needed
    - Response: Next business day
    - Escalation: Dashboard notification
```

## Types of Alerts

### Symptom-Based Alerts (Preferred)

Focus on what users experience rather than internal system metrics.

**Example: API Response Time Alert**

```yaml
# Prometheus Alert Rule
- alert: HighAPILatency
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
  for: 5m
  labels:
    severity: critical
    service: user-api
  annotations:
    summary: "API response time is too high"
    description: "95th percentile response time is {{ $value }}s for the last 5 minutes"
    runbook_url: "https://wiki.company.com/runbooks/high-api-latency"
    dashboard_url: "https://grafana.company.com/d/api-performance"
```

**Example: Error Rate Alert**

```yaml
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
  for: 2m
  labels:
    severity: high
    service: user-api
  annotations:
    summary: "High error rate detected"
    description: "Error rate is {{ $value | humanizePercentage }} for the last 5 minutes"
    impact: "Users may experience service failures"
```

### Cause-Based Alerts (Use Sparingly)

Focus on internal system states that predict future problems.

**Example: Disk Space Alert**

```yaml
- alert: DiskSpaceRunningOut
  expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) < 0.1
  for: 5m
  labels:
    severity: medium
    component: infrastructure
  annotations:
    summary: "Disk space running low"
    description: "Disk {{ $labels.device }} on {{ $labels.instance }} has less than 10% free space"
    action_required: "Clean up logs or expand disk within 24 hours"
```

## Alerting Strategies

### The USE Method for Infrastructure

Monitor **Utilization**, **Saturation**, and **Errors** for every resource.

```yaml
# CPU Utilization
- alert: HighCPUUtilization
  expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
  for: 10m
  labels:
    severity: medium
  annotations:
    summary: "High CPU utilization on {{ $labels.instance }}"

# Memory Saturation
- alert: HighMemoryUsage
  expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
  for: 5m
  labels:
    severity: high
  annotations:
    summary: "High memory usage on {{ $labels.instance }}"

# Network Errors
- alert: HighNetworkErrors
  expr: rate(node_network_receive_errs_total[5m]) > 10
  for: 5m
  labels:
    severity: medium
  annotations:
    summary: "High network errors on {{ $labels.instance }}"
```

### The RED Method for Services

Monitor **Rate**, **Errors**, and **Duration** for every service.

```yaml
# Request Rate (Traffic)
- alert: UnusualTrafficPattern
  expr: rate(http_requests_total[5m]) > 2 * rate(http_requests_total[1h] offset 1h)
  for: 10m
  labels:
    severity: medium
  annotations:
    summary: "Unusual traffic spike detected"
    description: "Current request rate is {{ $value }} req/s, which is 2x higher than usual"

# Error Rate
- alert: ServiceErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.01
  for: 5m
  labels:
    severity: high
  annotations:
    summary: "Service error rate is high"
    description: "{{ $labels.service }} error rate is {{ $value | humanizePercentage }}"

# Duration (Latency)
- alert: ServiceLatency
  expr: histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 1
  for: 5m
  labels:
    severity: medium
  annotations:
    summary: "Service latency is high"
    description: "99th percentile latency is {{ $value }}s"
```

### Business Metrics Alerts

Monitor metrics that directly impact business outcomes.

```yaml
# Revenue Impact
- alert: RevenueDropDetected
  expr: rate(payment_successful_total[1h]) < 0.8 * rate(payment_successful_total[1h] offset 24h)
  for: 15m
  labels:
    severity: critical
  annotations:
    summary: "Significant drop in successful payments"
    description: "Payment success rate is 20% lower than yesterday"
    business_impact: "Revenue loss estimated at ${{ $value }}/hour"

# User Experience
- alert: UserRegistrationFailure
  expr: rate(user_registration_failed_total[10m]) / rate(user_registration_attempted_total[10m]) > 0.1
  for: 5m
  labels:
    severity: high
  annotations:
    summary: "High user registration failure rate"
    description: "{{ $value | humanizePercentage }} of registration attempts are failing"
```

## Alert Configuration Examples

### Prometheus Alertmanager Configuration

```yaml
# alertmanager.yml
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@company.com'

route:
  group_by: ['alertname', 'service']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 12h
  receiver: 'default'
  routes:
  - match:
      severity: critical
    receiver: 'pager'
    group_wait: 10s
    repeat_interval: 1m
  - match:
      severity: high
    receiver: 'slack-high'
  - match:
      severity: medium
    receiver: 'slack-medium'

receivers:
- name: 'default'
  email_configs:
  - to: 'team@company.com'
    subject: 'Alert: {{ .GroupLabels.alertname }}'
    body: |
      {{ range .Alerts }}
      Alert: {{ .Annotations.summary }}
      Description: {{ .Annotations.description }}
      Labels: {{ range .Labels.SortedPairs }}{{ .Name }}={{ .Value }} {{ end }}
      {{ end }}

- name: 'pager'
  pagerduty_configs:
  - service_key: 'your-pagerduty-service-key'
    description: '{{ .GroupLabels.alertname }}: {{ .GroupLabels.service }}'

- name: 'slack-high'
  slack_configs:
  - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
    channel: '#alerts-high'
    title: 'High Severity Alert'
    text: |
      {{ range .Alerts }}
      *Alert:* {{ .Annotations.summary }}
      *Service:* {{ .Labels.service }}
      *Description:* {{ .Annotations.description }}
      *Runbook:* {{ .Annotations.runbook_url }}
      {{ end }}

- name: 'slack-medium'
  slack_configs:
  - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
    channel: '#alerts-medium'
    title: 'Medium Severity Alert'
```

### DataDog Monitor Configuration

```python
from datadog_api_client import ApiClient, Configuration
from datadog_api_client.v1.api.monitors_api import MonitorsApi
from datadog_api_client.v1.model.monitor import Monitor

configuration = Configuration()
api_client = ApiClient(configuration)
api_instance = MonitorsApi(api_client)

# High Error Rate Monitor
error_rate_monitor = Monitor(
    name="High Error Rate - User Service",
    type="metric alert",
    query="avg(last_5m):sum:http.requests{status:error,service:user-service}.as_rate() / sum:http.requests{service:user-service}.as_rate() > 0.05",
    message="""
    @slack-alerts-high
    
    **High error rate detected in user service**
    
    Current error rate: {{value}}%
    Threshold: 5%
    
    **Immediate Actions:**
    1. Check service logs: https://app.datadoghq.com/logs?query=service:user-service%20status:error
    2. Review recent deployments
    3. Check dependencies (database, external APIs)
    
    **Runbook:** https://wiki.company.com/runbooks/user-service-errors
    """,
    tags=["service:user-service", "team:backend"],
    options={
        "thresholds": {
            "critical": 0.05,
            "warning": 0.02
        },
        "notify_no_data": True,
        "no_data_timeframe": 10,
        "evaluation_delay": 60
    }
)

result = api_instance.create_monitor(body=error_rate_monitor)
```

### AWS CloudWatch Alarms

```python
import boto3

cloudwatch = boto3.client('cloudwatch')

# Create alarm for high CPU utilization
cloudwatch.put_metric_alarm(
    AlarmName='HighCPUUtilization',
    ComparisonOperator='GreaterThanThreshold',
    EvaluationPeriods=2,
    MetricName='CPUUtilization',
    Namespace='AWS/EC2',
    Period=300,
    Statistic='Average',
    Threshold=80.0,
    ActionsEnabled=True,
    AlarmActions=[
        'arn:aws:sns:us-east-1:123456789012:high-cpu-alert'
    ],
    AlarmDescription='Alert when CPU exceeds 80%',
    Dimensions=[
        {
            'Name': 'InstanceId',
            'Value': 'i-1234567890abcdef0'
        },
    ],
    Unit='Percent'
)

# Create alarm for application errors
cloudwatch.put_metric_alarm(
    AlarmName='HighApplicationErrors',
    ComparisonOperator='GreaterThanThreshold',
    EvaluationPeriods=1,
    MetricName='ErrorCount',
    Namespace='MyApp/API',
    Period=300,
    Statistic='Sum',
    Threshold=10.0,
    ActionsEnabled=True,
    AlarmActions=[
        'arn:aws:sns:us-east-1:123456789012:app-error-alert'
    ],
    AlarmDescription='Alert when error count exceeds 10 in 5 minutes',
    TreatMissingData='notBreaching'
)
```

## Advanced Alerting Patterns

### Composite Alerts

Combine multiple conditions to reduce false positives.

```yaml
# Alert only when both error rate is high AND traffic is normal
- alert: HighErrorRateWithNormalTraffic
  expr: |
    (
      rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
    ) and (
      rate(http_requests_total[5m]) > 10
    )
  for: 5m
  labels:
    severity: high
  annotations:
    summary: "High error rate detected with normal traffic levels"
    description: "Error rate: {{ $value | humanizePercentage }}, indicating a real issue"
```

### Anomaly Detection Alerts

Use statistical methods to detect unusual patterns.

```yaml
# Alert when current value deviates significantly from historical average
- alert: AnomalousTrafficPattern
  expr: |
    abs(
      rate(http_requests_total[5m]) - 
      avg_over_time(rate(http_requests_total[5m])[1h:5m] offset 24h)
    ) > 3 * stddev_over_time(rate(http_requests_total[5m])[1h:5m] offset 24h)
  for: 10m
  labels:
    severity: medium
  annotations:
    summary: "Anomalous traffic pattern detected"
    description: "Current traffic is {{ $value }} standard deviations from normal"
```

### Predictive Alerts

Alert before problems occur based on trends.

```yaml
# Alert when disk will be full in 4 hours based on current growth rate
- alert: DiskWillBeFull
  expr: |
    predict_linear(node_filesystem_avail_bytes[1h], 4*3600) < 0
  for: 5m
  labels:
    severity: medium
  annotations:
    summary: "Disk will be full soon"
    description: "Disk {{ $labels.device }} will be full in approximately 4 hours"
```

## Alert Fatigue Prevention

### 1. Use Alert Grouping

```yaml
# Group related alerts together
route:
  group_by: ['alertname', 'service', 'environment']
  group_wait: 30s      # Wait for more alerts before sending
  group_interval: 5m   # Send grouped alerts every 5 minutes
  repeat_interval: 4h  # Don't repeat the same alert for 4 hours
```

### 2. Implement Alert Suppression

```python
# Suppress alerts during maintenance windows
def is_maintenance_window():
    # Check if current time is in maintenance window
    return datetime.now().hour in [2, 3, 4]  # 2-5 AM maintenance

def should_alert(alert_name, severity):
    if is_maintenance_window() and severity in ['medium', 'low']:
        return False
    
    # Suppress duplicate alerts within time window
    last_alert_time = get_last_alert_time(alert_name)
    if last_alert_time and (datetime.now() - last_alert_time) < timedelta(hours=1):
        return False
    
    return True
```

### 3. Use Escalation Policies

```yaml
# Escalation policy example
escalation_policy:
  - level: 1
    wait_time: 5m
    notify: ['primary-oncall']
  - level: 2
    wait_time: 15m
    notify: ['secondary-oncall', 'team-lead']
  - level: 3
    wait_time: 30m
    notify: ['engineering-manager', 'director']
```

## Alert Response Playbooks

### Runbook Template

```markdown
# High API Latency Runbook

## Alert Description
API response time P95 > 2 seconds for 5+ minutes

## Immediate Actions (< 5 minutes)
1. **Check service status**: Is the service responding?
   ```bash
   curl -I https://api.company.com/health
   ```

2. **Check recent deployments**: Any recent changes?
   ```bash
   kubectl rollout history deployment/api-service
   ```

3. **Check dependencies**: Are external services healthy?
   - Database: Check connection pool utilization
   - Redis: Check memory usage and connection count
   - External APIs: Check their status pages

## Investigation Steps (5-15 minutes)
1. **Analyze metrics**:
   - Response time by endpoint
   - Error rate trends
   - Traffic patterns

2. **Check logs**:
   ```bash
   kubectl logs -f deployment/api-service --since=10m | grep ERROR
   ```

3. **Database performance**:
   ```sql
   SELECT query, mean_time, calls 
   FROM pg_stat_statements 
   ORDER BY mean_time DESC 
   LIMIT 10;
   ```

## Escalation Criteria
- Response time > 5 seconds: Page senior engineer
- Service completely down: Page engineering manager
- Data corruption suspected: Page CTO

## Resolution Steps
1. **Quick fixes**:
   - Restart unhealthy pods
   - Scale up if CPU/memory constrained
   - Clear cache if stale data suspected

2. **Rollback if needed**:
   ```bash
   kubectl rollout undo deployment/api-service
   ```

## Post-Incident
1. Update incident timeline
2. Schedule post-mortem if P0/P1
3. Create follow-up tasks for root cause fixes
```

### Automated Response Actions

```python
# Automated alert response system
class AlertHandler:
    def __init__(self):
        self.actions = {
            'HighCPUUtilization': self.handle_high_cpu,
            'HighMemoryUsage': self.handle_high_memory,
            'ServiceDown': self.handle_service_down
        }
    
    def handle_alert(self, alert_name, alert_data):
        if alert_name in self.actions:
            return self.actions[alert_name](alert_data)
        else:
            return self.default_handler(alert_data)
    
    def handle_high_cpu(self, alert_data):
        instance = alert_data['labels']['instance']
        
        # Auto-scale if possible
        if self.can_auto_scale(instance):
            self.scale_up(instance)
            return "Auto-scaled instance due to high CPU"
        
        # Otherwise, just notify
        return "Manual intervention required for high CPU"
    
    def handle_service_down(self, alert_data):
        service = alert_data['labels']['service']
        
        # Try automatic restart
        if self.restart_service(service):
            return f"Successfully restarted {service}"
        
        # If restart fails, escalate immediately
        self.escalate_to_oncall(alert_data)
        return f"Failed to restart {service}, escalated to on-call"
```

## Alerting Metrics and SLIs

Track the effectiveness of your alerting system:

```yaml
# Alerting SLIs (Service Level Indicators)
alerting_metrics:
  - name: "Mean Time to Detection (MTTD)"
    target: "< 5 minutes"
    measurement: "Time from issue start to first alert"
  
  - name: "Alert Precision"
    target: "> 80%"
    measurement: "Percentage of alerts that require action"
  
  - name: "Alert Recall"
    target: "> 95%"
    measurement: "Percentage of real issues that trigger alerts"
  
  - name: "False Positive Rate"
    target: "< 10%"
    measurement: "Percentage of alerts that are false alarms"
  
  - name: "Alert Response Time"
    target: "< 15 minutes"
    measurement: "Time from alert to human acknowledgment"
```

```python
# Track alerting effectiveness
class AlertingMetrics:
    def __init__(self):
        self.metrics = {}
    
    def record_alert(self, alert_id, timestamp, severity):
        self.metrics[alert_id] = {
            'fired_at': timestamp,
            'severity': severity,
            'acknowledged_at': None,
            'resolved_at': None,
            'was_actionable': None
        }
    
    def acknowledge_alert(self, alert_id, timestamp):
        if alert_id in self.metrics:
            self.metrics[alert_id]['acknowledged_at'] = timestamp
    
    def resolve_alert(self, alert_id, timestamp, was_actionable):
        if alert_id in self.metrics:
            self.metrics[alert_id]['resolved_at'] = timestamp
            self.metrics[alert_id]['was_actionable'] = was_actionable
    
    def calculate_mttd(self, incident_start, alert_id):
        alert = self.metrics.get(alert_id)
        if alert:
            return (alert['fired_at'] - incident_start).total_seconds()
        return None
    
    def calculate_precision(self, time_period):
        alerts_in_period = [a for a in self.metrics.values() 
                           if a['resolved_at'] and 
                           a['resolved_at'] >= time_period['start']]
        
        actionable_alerts = [a for a in alerts_in_period if a['was_actionable']]
        
        if len(alerts_in_period) == 0:
            return 0
        
        return len(actionable_alerts) / len(alerts_in_period)
```

Effective alerting is about finding the right balance between being informed and being overwhelmed. Focus on user-impacting issues, provide actionable information, and continuously refine your alerts based on their effectiveness. Remember: the goal isn't to eliminate all alerts, but to make sure every alert that fires helps you maintain system reliability and user satisfaction.
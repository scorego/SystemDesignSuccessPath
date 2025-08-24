# System Design Template Usage Guide

## Overview
This guide explains how to effectively use the system design templates for interview preparation and problem-solving. The templates are designed to provide structure while allowing flexibility for different problem types.

## Template Structure

### Core Templates Available
1. **Interview Problem Template** (`interview-problem-template.md`)
   - Complete problem structure with metadata
   - Standardized sections for requirements, design, and scaling
   - Assessment criteria and learning objectives

2. **Capacity Estimation Calculator** (`capacity-estimation-calculator.md`)
   - Formulas and calculation methods
   - Reference tables for common metrics
   - Cost estimation frameworks

3. **Architecture Diagram Templates** (`architecture-diagram-templates.md`)
   - Mermaid diagram templates for common patterns
   - Sequence diagrams for data flows
   - Infrastructure and deployment diagrams

## How to Use the Interview Problem Template

### Step 1: Problem Setup
```markdown
# Replace placeholders with actual values
- **Difficulty**: Choose from [Beginner/Easy/Medium/Hard/Expert]
- **Companies**: List companies that ask this question
- **Tags**: Add relevant technology tags
- **Estimated Time**: Provide realistic time estimates
```

### Step 2: Problem Statement Customization
```markdown
# Customize the business context
### Business Context
[Replace with specific business scenario]
- Why does this company need this system?
- What business problem does it solve?
- Who are the primary users?

### Core Problem
[Write a clear, concise problem statement]
- What system needs to be designed?
- What are the key functionalities?
- What scale are we targeting?
```

### Step 3: Requirements Gathering
```markdown
# Use the checklist format for clarity
### Functional Requirements
- [ ] Users can [specific action]
- [ ] System should [specific behavior]
- [ ] Data must be [specific requirement]

### Non-Functional Requirements
- **Scale**: Be specific about numbers
- **Performance**: Define latency and throughput
- **Availability**: Specify uptime requirements
```

### Step 4: Capacity Estimation
Use the calculator template to fill in realistic numbers:
```markdown
# Example usage
| Metric | Value | Calculation |
|--------|-------|-------------|
| Daily Active Users | 10M | Given requirement |
| Peak QPS | 50K | 10M users × 3 sessions × 50 requests ÷ 86400 × 3 |
| Storage per User | 1 GB | Profile + posts + media |
```

## Using the Capacity Estimation Calculator

### Basic Workflow
1. **Start with User Metrics**: Define your user base
2. **Calculate Traffic**: Use the provided formulas
3. **Estimate Storage**: Account for all data types
4. **Plan for Growth**: Project 2-3 years ahead
5. **Add Safety Margins**: Include 20-50% buffer

### Example Calculation Process
```markdown
# Step-by-step example for a social media app

## 1. User Base
- Total Users: 100M registered
- DAU: 30M (30% of registered)
- Peak Concurrent: 3M (10% of DAU)

## 2. Traffic Calculation
- Sessions per User: 3 per day
- Requests per Session: 50
- Daily Requests: 30M × 3 × 50 = 4.5B
- Average QPS: 4.5B ÷ 86400 = 52K
- Peak QPS: 52K × 3 = 156K

## 3. Storage Estimation
- User Profile: 1 KB
- Posts per User: 10 per month × 500 bytes = 5 KB/month
- Images: 5 per month × 200 KB = 1 MB/month
- Total per User: ~1 MB/month
- Total Storage: 100M × 1 GB = 100 TB
```

### Validation Checklist
- [ ] Numbers are realistic and well-reasoned
- [ ] Calculations are shown step-by-step
- [ ] Growth projections are included
- [ ] Safety margins are accounted for
- [ ] Units are consistent and correct

## Using Architecture Diagram Templates

### Selecting the Right Template
```markdown
# Decision matrix for template selection

## Basic Web Application
- Use for: CRUD apps, simple e-commerce, blogs
- Scale: < 1M users, < 10K QPS
- Complexity: Single application, simple data model

## Microservices Architecture
- Use for: Complex domains, multiple teams, high scale
- Scale: > 10M users, > 100K QPS
- Complexity: Multiple services, complex business logic

## Event-Driven Architecture
- Use for: Real-time systems, high throughput, loose coupling
- Scale: Variable, depends on event volume
- Complexity: Asynchronous processing, event sourcing
```

### Customizing Diagrams
```mermaid
# Example: Customizing the basic web app template
graph TB
    # Replace generic names with specific ones
    Web[React Web App] # Instead of "Web Browser"
    Mobile[iOS/Android App] # Instead of "Mobile App"
    
    # Add specific technologies
    LB[AWS ALB] # Instead of "Load Balancer"
    API[Node.js API] # Instead of "API Gateway"
    
    # Include relevant services
    Auth[Auth0] # Specific auth service
    Cache[(Redis Cluster)] # Specific cache technology
    DB[(PostgreSQL)] # Specific database
```

### Diagram Best Practices
1. **Progressive Disclosure**: Start high-level, add detail gradually
2. **Consistent Naming**: Use the same names across all diagrams
3. **Clear Data Flow**: Show direction with arrows
4. **Group Related Components**: Use subgraphs for logical grouping
5. **Include Key Metrics**: Add capacity numbers where relevant

## Problem-Specific Adaptations

### Social Media Platform
```markdown
# Key adaptations for social media problems
- Emphasize read-heavy workload (100:1 read/write ratio)
- Include content delivery network (CDN)
- Add recommendation engine components
- Consider real-time features (notifications, messaging)
- Plan for viral content scenarios
```

### E-commerce System
```markdown
# Key adaptations for e-commerce problems
- Include payment processing components
- Add inventory management system
- Consider order processing workflow
- Include fraud detection services
- Plan for peak shopping events (Black Friday)
```

### Messaging System
```markdown
# Key adaptations for messaging problems
- Emphasize real-time delivery requirements
- Include message queue/broker systems
- Add presence and status tracking
- Consider end-to-end encryption
- Plan for message history and search
```

## Interview-Specific Tips

### Time Management
```markdown
# Recommended time allocation for 45-60 minute interview

## Requirements Clarification (10-15 minutes)
- Ask clarifying questions
- Define functional requirements
- Establish scale and constraints
- Agree on success criteria

## High-Level Design (15-20 minutes)
- Draw basic architecture
- Identify major components
- Show data flow
- Discuss API design

## Detailed Design (15-20 minutes)
- Deep dive into 1-2 components
- Database schema design
- Caching strategy
- Handle specific scenarios

## Scale and Optimize (5-10 minutes)
- Identify bottlenecks
- Propose scaling solutions
- Discuss trade-offs
- Address follow-up questions
```

### Communication Strategy
```markdown
# How to present your solution effectively

## Start with Assumptions
- "I'm assuming we have X million users"
- "Let me clarify the read/write ratio"
- "Are we optimizing for consistency or availability?"

## Think Out Loud
- "I'm choosing this approach because..."
- "The trade-off here is..."
- "An alternative would be..."

## Use the Templates as Structure
- "Let me start with the high-level architecture"
- "Now let me estimate the capacity we need"
- "Let me show the data flow for this use case"
```

## Common Mistakes to Avoid

### Template Usage Mistakes
1. **Over-relying on Templates**: Don't force every problem into the same structure
2. **Skipping Customization**: Always adapt templates to the specific problem
3. **Ignoring Context**: Consider the interviewer's background and company
4. **Template Rigidity**: Be flexible and adjust based on interview flow

### Technical Mistakes
1. **Unrealistic Numbers**: Always sanity-check your calculations
2. **Missing Edge Cases**: Consider failure scenarios and edge cases
3. **Over-engineering**: Start simple, add complexity gradually
4. **Ignoring Trade-offs**: Always discuss pros and cons of decisions

### Communication Mistakes
1. **Jumping to Solutions**: Always clarify requirements first
2. **Not Explaining Reasoning**: Show your thought process
3. **Ignoring Feedback**: Listen to interviewer hints and suggestions
4. **Poor Time Management**: Keep track of time and pace yourself

## Advanced Template Techniques

### Multi-Problem Patterns
```markdown
# Reusable patterns across different problems

## User Management Pattern
- Authentication service
- User profile storage
- Session management
- Permission system

## Content Delivery Pattern
- CDN integration
- Image/video processing
- Caching strategy
- Geographic distribution

## Real-time Communication Pattern
- WebSocket connections
- Message queues
- Presence tracking
- Push notifications
```

### Scaling Progression Templates
```markdown
# How to show system evolution

## Phase 1: MVP (0-10K users)
- Single server
- Single database
- Basic caching

## Phase 2: Growth (10K-1M users)
- Load balancer
- Database replication
- Distributed cache

## Phase 3: Scale (1M+ users)
- Microservices
- Database sharding
- CDN integration
- Multiple regions
```

## Template Maintenance

### Keeping Templates Current
1. **Regular Updates**: Review and update templates quarterly
2. **Technology Evolution**: Add new technologies and patterns
3. **Feedback Integration**: Incorporate lessons learned from interviews
4. **Industry Trends**: Stay current with architectural patterns

### Version Control
1. **Template Versioning**: Track changes to templates over time
2. **Problem Variations**: Create variations for different contexts
3. **Company-Specific Adaptations**: Customize for specific companies
4. **Difficulty Levels**: Maintain templates for different skill levels

## Conclusion

These templates provide a structured approach to system design interviews while maintaining the flexibility needed for different problem types. Remember:

1. **Templates are Starting Points**: Always customize for the specific problem
2. **Practice Makes Perfect**: Use templates regularly to build muscle memory
3. **Focus on Communication**: Templates help organize thoughts, not replace thinking
4. **Stay Flexible**: Adapt based on interview flow and feedback
5. **Keep Learning**: Update templates as you gain more experience

The key to success is using these templates as a foundation while developing your own problem-solving approach and communication style.
# Chapter 12: Message Queues & Communication Patterns

## Overview

This chapter explores the fundamental concepts of inter-service communication in distributed systems. We'll cover the differences between synchronous and asynchronous communication patterns, dive deep into message queue technologies, and examine publish-subscribe (pub/sub) patterns that enable scalable, decoupled system architectures.

Understanding these communication patterns is crucial for building resilient, scalable distributed systems that can handle varying loads and maintain loose coupling between components.

## Learning Objectives

By the end of this chapter, you will be able to:

- Distinguish between synchronous and asynchronous communication patterns and their trade-offs
- Understand when to use message queues vs direct API calls
- Compare different message queue technologies and their use cases
- Design pub/sub systems for event-driven architectures
- Implement message delivery guarantees and handle failure scenarios
- Choose appropriate communication patterns for different system requirements

## Prerequisites

- Understanding of distributed systems basics (Chapter 3)
- Knowledge of API design principles (Chapter 13)
- Familiarity with network protocols (Chapter 2)
- Basic understanding of system reliability concepts (Chapter 7)

## Estimated Reading Time

- **Total**: 45-60 minutes
- **Section 1** (Sync vs Async): 15 minutes
- **Section 2** (Queue Systems): 20 minutes  
- **Section 3** (Event Streaming): 15 minutes
- **Section 4** (Pub/Sub Patterns): 15 minutes

## Chapter Sections

1. [Synchronous vs Asynchronous Communication](01-sync-async.md)
2. [Message Queue Systems](02-queue-systems.md)
3. [Event Streaming & Event Sourcing](03-event-streaming.md)
4. [Publish-Subscribe Patterns](04-pubsub.md)

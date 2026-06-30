# Regenera Bank Enterprise System - Scaling Strategy

**Date:** June 2026
**Compliance:** BACEN / High-Availability / SLA 99.99%

## 1. Executive Summary
The scalability architecture of Regenera Bank is designed to handle extreme bursts in traffic, specifically during peak PIX hours and payroll processing days (e.g., the 5th business day of the month), ensuring sub-100ms API latency.

## 2. Horizontal Pod Autoscaling (HPA)
All microservices are containerized and deployed on Google Kubernetes Engine (GKE).
- **Triggers:** Scaling is triggered on CPU utilization > 60% and Custom Metrics (e.g., Pub/Sub queue depth).
- **Node Pools:** Separate node pools for Core Ledger (compute-optimized) and AI inference (GPU-enabled for Liveness Detection).

## 3. Database Scaling
- **Primary Node:** Handles strict ACID write operations (Ledger Debits/Credits).
- **Read Replicas:** Serves dashboard queries, extract (extrato) requests, and compliance reports to offload the primary node.
- **Connection Pooling:** PgBouncer is deployed as a sidecar to prevent connection exhaustion during massive concurrent spikes.

## 4. Caching Layer
- **Redis Cluster:** Deployed in High Availability mode across 3 zones.
- **Eviction Policy:** `volatile-lru` for Idempotency keys (TTL of 24h) to ensure the cache size remains predictable.

## 5. Performance SLOs
- **PIX Webhooks:** p99 < 150ms.
- **Ledger Writes:** p99 < 50ms.
- **Ledger Reads (Cache Hit):** p99 < 10ms.

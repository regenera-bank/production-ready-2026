# Regenera Bank Enterprise System - System Design

**Date:** June 2026
**Version:** 4.0.0
**Status:** Approved for Production
**Compliance:** BACEN / PCI-DSS / LGPD

## 1. Executive Summary
The Regenera Bank architecture is designed to support high-throughput, low-latency financial operations while adhering strictly to the Brazilian Central Bank (BACEN) regulations. The system is divided into two major logical units: The **Core Ledger Engine** (ACID transactional base) and the **Edge Services** (Lifestyle, Open Finance, Webhooks).

## 2. Core Ledger Architecture (ACID Compliance)
The ledger is the heart of the bank. It uses a relational database (Google Cloud Spanner / Neon PostgreSQL) ensuring strict ACID properties.

### 2.1 Double-Entry Accounting
Every transaction creates two immutable records (Credit and Debit) in the `TransactionEntity`. Balances are never arbitrarily updated without a corresponding ledger entry.

### 2.2 Pessimistic Locking & Concurrency Control
To prevent Double-Spend attacks during high-concurrency scenarios (e.g., thousands of simultaneous PIX inbound requests), the system utilizes row-level locking (`SELECT ... FOR UPDATE` via TypeORM pessimistic write).
- **Deadlock Prevention:** During Internal TED transfers, the engine lexically sorts the Account IDs before acquiring locks.

## 3. PIX & Event Routing
Inbound SPI (Sistema de Pagamentos Instantâneos) events are received via Webhooks.
1. **API Gateway:** Validates the HMAC signature.
2. **Idempotency Guard:** Checks Redis to ensure the `endToEndId` has not been processed.
3. **CoreService:** Acquires a lock on the receiver's account and updates the balance atomically.

## 4. Lifestyle & Super-App Integrations
Services like the *Dream Vault* or *Marketplace* use a CQRS approach:
- **Command:** Financial debits hit the Core Ledger synchronously.
- **Query / Engagement:** Updates are pushed to Firestore (NoSQL) for sub-50ms read latency on the client mobile apps.
- **Asynchronous Rewards:** Cashback and RevPoints are processed asynchronously via Google Cloud Pub/Sub.

## 5. Network Topology
- **VPC Isolation:** The database resides in a private subnet with no public IP.
- **NAT Gateway:** Outbound traffic to the BACEN DICT network flows through a strict NAT Gateway.
- **Cloud Armor:** WAF rules block OWASP Top 10 vectors at the edge.

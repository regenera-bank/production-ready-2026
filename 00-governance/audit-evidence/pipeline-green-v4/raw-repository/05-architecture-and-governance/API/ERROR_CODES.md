# Regenera Bank API - Error Codes Specification

**Date:** June 2026

This document lists the standard error codes returned by the Regenera Bank API. All errors follow the RFC 7807 Problem Details for HTTP APIs standard.

## 1. Security & Authentication Errors
| Code | HTTP Status | Description | Action Required |
|------|-------------|-------------|-----------------|
| `AUTH_001` | 401 Unauthorized | Invalid or expired JWT token. | Request a new token via the `/auth/refresh` endpoint. |
| `AUTH_002` | 403 Forbidden | Missing required IAM roles or custom claims. | Contact the administrator to request access. |
| `FIN_SEC_001` | 403 Forbidden | Account is blocked, frozen, or under judicial review. | The user must contact the compliance department. |

## 2. Transactional Errors (Ledger)
| Code | HTTP Status | Description | Action Required |
|------|-------------|-------------|-----------------|
| `LEDGER_001` | 422 Unprocessable | `INSUFFICIENT_FUNDS`. The account does not have enough balance for the debit. | Instruct the user to add funds to their account. |
| `LEDGER_002` | 409 Conflict | `DOUBLE_SPEND_PREVENTED`. Idempotency key already processed. | None. The original transaction was successful. |
| `PIX_001` | 403 Forbidden | `LIMIT_EXCEEDED`. The transaction exceeds the BACEN normative limit (e.g., Nightly Limit). | The user must adjust their limits via the app. |

## 3. Compliance Errors
| Code | HTTP Status | Description | Action Required |
|------|-------------|-------------|-----------------|
| `AML_001` | 451 Unavailable | `FROZEN_BY_COAF`. Transaction flagged for Money Laundering. | Operation permanently rejected. Wait for manual review. |
| `KYC_001` | 400 Bad Request | Document selfie mismatch (Liveness Detection Failed). | Instruct the user to take a clearer photo in good lighting. |

## 4. System Errors
| Code | HTTP Status | Description | Action Required |
|------|-------------|-------------|-----------------|
| `SYS_001` | 500 Internal Error | General unexpected failure. | Retry with exponential backoff. If it persists, escalate to L1 Support. |
| `SYS_002` | 503 Service Unavailable | Timeout communicating with BACEN DICT or Open Finance partners. | Use Circuit Breaker logic and retry later. |

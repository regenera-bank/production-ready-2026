package bank.regenera.customers.domain.model

import java.time.Instant
import java.util.UUID

enum class CustomerStatus { PENDING_KYC, ACTIVE, RESTRICTED, BLOCKED, CLOSED }

data class Customer(val id: UUID, val partyId: UUID, val status: CustomerStatus, val createdAt: Instant, val updatedAt: Instant, val version: Long) { init { require(version > 0) } }

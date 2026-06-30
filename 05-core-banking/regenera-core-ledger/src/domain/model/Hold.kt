package bank.regenera.ledger.domain.model

import java.time.Instant
import java.util.UUID

enum class HoldStatus { ACTIVE, RELEASED, CAPTURED, EXPIRED }

data class Hold(val id: UUID, val accountId: UUID, val amount: Money, val status: HoldStatus, val createdAt: Instant, val expiresAt: Instant, val idempotencyKey: String) { init { require(amount.minorUnits > 0); require(expiresAt.isAfter(createdAt)) } }

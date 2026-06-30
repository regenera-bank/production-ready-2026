package bank.regenera.ledger.domain.model

import java.time.Instant
import java.util.UUID

data class Release(val id: UUID, val holdId: UUID, val releasedAt: Instant, val reasonCode: String, val idempotencyKey: String)

package bank.regenera.ledger.domain.model

import java.time.Instant
import java.util.UUID

enum class SettlementStatus { PENDING, CONFIRMED, REJECTED, UNKNOWN, RECONCILED }

data class Settlement(val id: UUID, val journalEntryId: UUID, val externalReference: String?, val status: SettlementStatus, val settledAt: Instant?)

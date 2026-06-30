package bank.regenera.ledger.domain.model

import java.time.Instant
import java.util.UUID

data class Reversal(val id: UUID, val originalEntryId: UUID, val reversalEntryId: UUID, val reasonCode: String, val createdAt: Instant)

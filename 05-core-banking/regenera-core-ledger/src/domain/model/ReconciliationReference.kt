package bank.regenera.ledger.domain.model

import java.time.Instant
import java.util.UUID

data class ReconciliationReference(val id: UUID, val journalEntryId: UUID, val source: String, val externalReference: String, val matchedAt: Instant?)

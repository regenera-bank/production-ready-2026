package bank.regenera.transactions.domain.model

import java.time.Instant
import java.util.UUID

data class TransactionAttempt(val id: UUID, val transactionId: UUID, val provider: String, val startedAt: Instant, val endedAt: Instant?, val result: TransactionState)

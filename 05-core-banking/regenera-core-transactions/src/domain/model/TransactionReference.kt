package bank.regenera.transactions.domain.model

import java.util.UUID

data class TransactionReference(val transactionId: UUID, val idempotencyKey: String, val correlationId: UUID) { init { require(idempotencyKey.length in 16..128) } }

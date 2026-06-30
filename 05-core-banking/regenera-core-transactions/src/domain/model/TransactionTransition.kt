package bank.regenera.transactions.domain.model

import java.time.Instant

data class TransactionTransition(val from: TransactionState, val to: TransactionState, val occurredAt: Instant, val reasonCode: String, val actor: String)

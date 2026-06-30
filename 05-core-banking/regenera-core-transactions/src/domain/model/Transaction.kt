package bank.regenera.transactions.domain.model

import java.time.Instant
import java.util.UUID

data class Transaction(val id: UUID, val idempotencyKey: String, val state: TransactionState, val history: List<TransactionTransition>) {
    fun transition(target: TransactionState, reasonCode: String, actor: String, at: Instant = Instant.now()): Transaction {
        require(TransitionPolicy.canTransition(state, target)) { "invalid transition: $state -> $target" }
        return copy(state=target, history=history + TransactionTransition(state,target,at,reasonCode,actor))
    }
}

object TransitionPolicy {
    private val allowed = mapOf(
        TransactionState.CREATED to setOf(TransactionState.VALIDATING,TransactionState.CANCELLED),
        TransactionState.VALIDATING to setOf(TransactionState.RISK_ANALYSIS,TransactionState.REJECTED,TransactionState.EXPIRED),
        TransactionState.RISK_ANALYSIS to setOf(TransactionState.AUTHORIZED,TransactionState.REJECTED,TransactionState.MANUAL_REVIEW),
        TransactionState.AUTHORIZED to setOf(TransactionState.FUNDS_RESERVED,TransactionState.CANCELLED,TransactionState.EXPIRED),
        TransactionState.FUNDS_RESERVED to setOf(TransactionState.SENT,TransactionState.REVERSED,TransactionState.EXPIRED),
        TransactionState.SENT to setOf(TransactionState.ACCEPTED,TransactionState.REJECTED,TransactionState.UNKNOWN),
        TransactionState.ACCEPTED to setOf(TransactionState.SETTLED,TransactionState.UNKNOWN,TransactionState.REVERSED),
        TransactionState.SETTLED to setOf(TransactionState.RECONCILED,TransactionState.REVERSED),
        TransactionState.UNKNOWN to setOf(TransactionState.ACCEPTED,TransactionState.SETTLED,TransactionState.REJECTED,TransactionState.MANUAL_REVIEW,TransactionState.RECONCILED),
        TransactionState.MANUAL_REVIEW to setOf(TransactionState.AUTHORIZED,TransactionState.REJECTED,TransactionState.CANCELLED),
        TransactionState.RECONCILED to emptySet(), TransactionState.REJECTED to emptySet(), TransactionState.CANCELLED to emptySet(), TransactionState.EXPIRED to emptySet(), TransactionState.REVERSED to emptySet()
    )
    fun canTransition(from: TransactionState, to: TransactionState)=to in allowed.getValue(from)
}

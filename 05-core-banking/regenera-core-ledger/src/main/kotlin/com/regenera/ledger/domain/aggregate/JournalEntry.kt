package bank.regenera.ledger.domain.model

import java.time.Instant
import java.util.UUID

data class JournalEntry(val id: UUID, val idempotencyKey: String, val businessEvent: String, val occurredAt: Instant, val postings: List<Posting>, val reversalOf: UUID? = null) {
    init {
        require(idempotencyKey.length in 16..128)
        require(businessEvent.isNotBlank())
        require(postings.size >= 2)
        require(postings.map { it.amount.currency }.distinct().size == 1)
        val debit = postings.filter { it.side == PostingSide.DEBIT }.fold(0L) { acc, p -> Math.addExact(acc, p.amount.minorUnits) }
        val credit = postings.filter { it.side == PostingSide.CREDIT }.fold(0L) { acc, p -> Math.addExact(acc, p.amount.minorUnits) }
        require(debit == credit) { "journal entry is not balanced" }
    }
}

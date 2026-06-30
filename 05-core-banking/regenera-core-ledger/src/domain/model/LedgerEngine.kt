package bank.regenera.ledger.domain.model

import java.util.UUID

class LedgerEngine {
    private val entries = linkedMapOf<UUID, JournalEntry>()
    private val idempotency = mutableMapOf<String, UUID>()

    @Synchronized fun post(entry: JournalEntry): JournalEntry {
        val previousId = idempotency[entry.idempotencyKey]
        if (previousId != null) return entries.getValue(previousId)
        require(!entries.containsKey(entry.id))
        entries[entry.id] = entry
        idempotency[entry.idempotencyKey] = entry.id
        return entry
    }

    fun reverse(originalId: UUID, reversal: JournalEntry): JournalEntry {
        require(entries.containsKey(originalId))
        require(reversal.reversalOf == originalId)
        return post(reversal)
    }

    fun balance(accountId: UUID, currency: String): Money {
        var value = 0L
        entries.values.flatMap { it.postings }.filter { it.ledgerAccountId == accountId }.forEach { p ->
            value = if (p.side == PostingSide.DEBIT) Math.addExact(value, p.amount.minorUnits) else Math.subtractExact(value, p.amount.minorUnits)
        }
        return Money.ofMinorUnits(value, currency)
    }
}

package bank.regenera.ledger.tests

import bank.regenera.ledger.domain.model.*
import java.time.Instant
import java.util.UUID

fun main() {
    val currency = "BRL"
    val amount = Money.ofMinorUnits(50000, currency)
    JournalEntry(UUID.randomUUID(), "pix-500-00000001", "PIX_CREATED", Instant.now(), listOf(
        Posting(UUID.randomUUID(), UUID.randomUUID(), PostingSide.DEBIT, amount, 1),
        Posting(UUID.randomUUID(), UUID.randomUUID(), PostingSide.CREDIT, amount, 1)
    ))
}

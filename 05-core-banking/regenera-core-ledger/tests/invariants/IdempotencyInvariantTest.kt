package bank.regenera.ledger.tests

import bank.regenera.ledger.domain.model.*
import java.time.Instant
import java.util.UUID

fun main() {
    val engine=LedgerEngine(); val amount=Money.ofMinorUnits(1,"BRL")
    val entry=JournalEntry(UUID.randomUUID(),"idempotency-0001","TEST",Instant.now(),listOf(Posting(UUID.randomUUID(),UUID.randomUUID(),PostingSide.DEBIT,amount,1),Posting(UUID.randomUUID(),UUID.randomUUID(),PostingSide.CREDIT,amount,1)))
    check(engine.post(entry).id == engine.post(entry).id)
}

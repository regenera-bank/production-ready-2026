package bank.regenera.ledger.tests

import bank.regenera.ledger.domain.model.*
import java.time.Instant
import java.util.UUID

fun main() { Hold(UUID.randomUUID(),UUID.randomUUID(),Money.ofMinorUnits(100,"BRL"),HoldStatus.ACTIVE,Instant.now(),Instant.now().plusSeconds(60),"hold-key-00000001") }

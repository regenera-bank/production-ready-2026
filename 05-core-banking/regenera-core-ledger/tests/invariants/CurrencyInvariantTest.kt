package bank.regenera.ledger.tests

import bank.regenera.ledger.domain.model.Money

fun main() { check(runCatching { Money.ofMinorUnits(1,"brl") }.isFailure) }

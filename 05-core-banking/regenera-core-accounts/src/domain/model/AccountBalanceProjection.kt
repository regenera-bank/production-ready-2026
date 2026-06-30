package bank.regenera.accounts.domain.model

import java.time.Instant
import java.util.UUID

data class AccountBalanceProjection(val accountId: UUID, val currency: String, val ledgerMinorUnits: Long, val heldMinorUnits: Long, val availableMinorUnits: Long, val calculatedAt: Instant, val ledgerSequence: Long) { init { require(availableMinorUnits == Math.subtractExact(ledgerMinorUnits, heldMinorUnits)) } }

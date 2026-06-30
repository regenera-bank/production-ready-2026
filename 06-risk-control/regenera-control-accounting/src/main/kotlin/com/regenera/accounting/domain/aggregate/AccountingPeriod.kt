package bank.regenera.ledger.domain.model

import java.time.LocalDate
import java.util.UUID

enum class AccountingPeriodStatus { OPEN, CLOSING, CLOSED }

data class AccountingPeriod(val id: UUID, val startsOn: LocalDate, val endsOn: LocalDate, val status: AccountingPeriodStatus) { init { require(!endsOn.isBefore(startsOn)) } }

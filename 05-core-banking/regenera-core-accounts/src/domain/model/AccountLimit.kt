package bank.regenera.accounts.domain.model

import java.util.UUID

data class AccountLimit(val id: UUID, val accountId: UUID, val limitType: String, val currency: String, val minorUnits: Long) { init { require(minorUnits >= 0); require(currency.matches(Regex("^[A-Z]{3}$"))) } }

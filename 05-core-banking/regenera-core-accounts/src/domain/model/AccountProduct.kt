package bank.regenera.accounts.domain.model

import java.util.UUID

data class AccountProduct(val id: UUID, val code: String, val name: String, val currency: String, val enabled: Boolean) { init { require(code.isNotBlank()); require(currency.matches(Regex("^[A-Z]{3}$"))) } }

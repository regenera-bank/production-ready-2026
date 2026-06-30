package bank.regenera.ledger.domain.model

import java.util.UUID

enum class LedgerAccountType { ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE, TRANSITORY }
enum class LedgerAccountStatus { OPEN, BLOCKED, CLOSED }

data class LedgerAccount(val id: UUID, val code: String, val type: LedgerAccountType, val currency: String, val status: LedgerAccountStatus) { init { require(code.isNotBlank()); require(currency.matches(Regex("^[A-Z]{3}$"))) } }

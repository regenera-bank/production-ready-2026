package bank.regenera.ledger.domain.policies

object CurrencyPolicy { fun requireIso4217(code: String) { require(code.matches(Regex("^[A-Z]{3}$"))) } }

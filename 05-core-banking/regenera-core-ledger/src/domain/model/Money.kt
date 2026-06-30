package bank.regenera.ledger.domain.model

data class Money private constructor(val minorUnits: Long, val currency: String) {
    init { require(currency.matches(Regex("^[A-Z]{3}$"))) }
    fun plus(other: Money): Money { require(currency == other.currency); return ofMinorUnits(Math.addExact(minorUnits, other.minorUnits), currency) }
    fun minus(other: Money): Money { require(currency == other.currency); return ofMinorUnits(Math.subtractExact(minorUnits, other.minorUnits), currency) }
    companion object { fun ofMinorUnits(minorUnits: Long, currency: String) = Money(minorUnits, currency) }
}

package bank.regenera.ledger.domain.model

import java.util.UUID

enum class PostingSide { DEBIT, CREDIT }

data class Posting(val id: UUID, val ledgerAccountId: UUID, val side: PostingSide, val amount: Money, val sequence: Long) { init { require(amount.minorUnits > 0); require(sequence > 0) } }

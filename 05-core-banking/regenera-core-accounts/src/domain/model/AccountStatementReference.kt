package bank.regenera.accounts.domain.model

import java.time.Instant
import java.util.UUID

data class AccountStatementReference(val accountId: UUID, val from: Instant, val to: Instant, val nextCursor: String?) { init { require(!to.isBefore(from)) } }

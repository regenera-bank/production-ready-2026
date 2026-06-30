package bank.regenera.accounts.domain.model

import java.time.Instant
import java.util.UUID

enum class RestrictionType { DEBIT_BLOCK, CREDIT_BLOCK, PIX_BLOCK, CARD_BLOCK, FULL_BLOCK }

data class AccountRestriction(val id: UUID, val accountId: UUID, val type: RestrictionType, val reasonCode: String, val effectiveAt: Instant, val expiresAt: Instant?)

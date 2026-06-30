package bank.regenera.accounts.domain.model

import java.time.Instant
import java.util.UUID

enum class HolderRole { PRIMARY, JOINT, AUTHORIZED_USER }

data class AccountHolder(val accountId: UUID, val partyId: UUID, val role: HolderRole, val validFrom: Instant, val validUntil: Instant?)

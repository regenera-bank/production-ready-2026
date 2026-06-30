package bank.regenera.customers.domain.model

import java.time.Instant
import java.util.UUID

enum class PartyType { PERSON, LEGAL_ENTITY }

data class Party(val id: UUID, val type: PartyType, val createdAt: Instant, val version: Long = 1) { init { require(version > 0) } }

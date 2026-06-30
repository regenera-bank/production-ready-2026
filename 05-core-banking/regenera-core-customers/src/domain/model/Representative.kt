package bank.regenera.customers.domain.model

import java.time.Instant
import java.util.UUID

enum class RepresentativeRole { LEGAL_REPRESENTATIVE, ATTORNEY, PARTNER, DIRECTOR }

data class Representative(val representedPartyId: UUID, val representativePartyId: UUID, val role: RepresentativeRole, val validFrom: Instant, val validUntil: Instant?) { init { require(validUntil == null || validUntil.isAfter(validFrom)) } }

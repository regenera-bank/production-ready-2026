package bank.regenera.customers.domain.model

import java.math.BigDecimal
import java.util.UUID

data class BeneficialOwner(val legalEntityPartyId: UUID, val ownerPartyId: UUID, val ownershipPercent: BigDecimal, val controlByOtherMeans: Boolean) { init { require(ownershipPercent >= BigDecimal.ZERO && ownershipPercent <= BigDecimal("100")) } }

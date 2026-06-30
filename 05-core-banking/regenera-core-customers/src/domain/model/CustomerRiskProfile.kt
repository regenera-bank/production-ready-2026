package bank.regenera.customers.domain.model

import java.time.Instant
import java.util.UUID

enum class RiskRating { LOW, MEDIUM, HIGH, PROHIBITED }

data class CustomerRiskProfile(val customerId: UUID, val rating: RiskRating, val pep: Boolean, val sanctionsMatch: Boolean, val blocked: Boolean, val assessedAt: Instant, val modelVersion: String) { init { require(modelVersion.isNotBlank()) } }

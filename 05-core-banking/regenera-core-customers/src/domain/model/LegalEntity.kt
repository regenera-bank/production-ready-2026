package bank.regenera.customers.domain.model

import java.time.LocalDate
import java.util.UUID

data class LegalEntity(val partyId: UUID, val legalName: String, val tradeName: String?, val incorporationDate: LocalDate, val countryCode: String) { init { require(legalName.isNotBlank()); require(countryCode.length == 2) } }

package bank.regenera.customers.domain.model

import java.time.LocalDate
import java.util.UUID

data class Person(val partyId: UUID, val legalName: String, val birthDate: LocalDate, val nationality: String) { init { require(legalName.isNotBlank()); require(nationality.length == 2) } }

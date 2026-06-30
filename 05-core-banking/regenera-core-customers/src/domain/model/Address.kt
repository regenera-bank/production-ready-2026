package bank.regenera.customers.domain.model

import java.util.UUID

data class Address(val id: UUID, val partyId: UUID, val countryCode: String, val postalCode: String, val city: String, val line1: String, val line2: String?) { init { require(countryCode.length == 2); require(city.isNotBlank()); require(line1.isNotBlank()) } }

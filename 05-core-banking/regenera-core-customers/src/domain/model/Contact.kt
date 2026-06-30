package bank.regenera.customers.domain.model

import java.util.UUID

enum class ContactType { EMAIL, PHONE }

data class Contact(val id: UUID, val partyId: UUID, val type: ContactType, val valueHash: String, val verified: Boolean) { init { require(valueHash.isNotBlank()) } }

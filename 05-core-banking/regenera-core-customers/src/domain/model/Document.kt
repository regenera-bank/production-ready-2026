package bank.regenera.customers.domain.model

import java.time.LocalDate
import java.util.UUID

enum class DocumentType { CPF, CNPJ, RG, PASSPORT, ARTICLES_OF_ASSOCIATION, POWER_OF_ATTORNEY }

data class Document(val id: UUID, val partyId: UUID, val type: DocumentType, val numberHash: String, val issuerCountry: String, val expiresOn: LocalDate?) { init { require(numberHash.isNotBlank()); require(issuerCountry.length == 2) } }

package bank.regenera.customers.domain.model

import java.time.Instant
import java.util.UUID

enum class KycCaseStatus { OPEN, WAITING_DOCUMENTS, IN_REVIEW, APPROVED, REJECTED, EXPIRED }

data class KycCaseReference(val caseId: UUID, val customerId: UUID, val status: KycCaseStatus, val openedAt: Instant, val nextReviewAt: Instant?)

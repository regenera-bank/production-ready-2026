package bank.regenera.pix.domain.model

import java.util.UUID

enum class PixPaymentStatus { CREATED, VALIDATING, RISK_ANALYSIS, AUTHORIZED, FUNDS_RESERVED, SENT, ACCEPTED, SETTLED, RECONCILED, REJECTED, CANCELLED, EXPIRED, REVERSED, UNKNOWN, MANUAL_REVIEW }

data class PixPayment(val id: UUID, val idempotencyKey: String, val amountMinorUnits: Long, val currency: String, val status: PixPaymentStatus) { init { require(amountMinorUnits > 0); require(currency == "BRL"); require(idempotencyKey.length in 16..128) } }

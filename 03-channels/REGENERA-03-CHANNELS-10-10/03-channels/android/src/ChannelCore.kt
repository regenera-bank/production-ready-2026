package regenera.channels.android

import java.math.BigInteger

enum class CommandState { READY, SUBMITTED, COMPLETED, FAILED, UNKNOWN }

data class FinancialIntent(
    val correlationId: String,
    val idempotencyKey: String,
    val amountCents: String,
    val state: CommandState,
    val deviceBindingId: String,
    val attestationValid: Boolean,
)

object ChannelCore {
    private val uuid = Regex("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$")
    private val cents = Regex("^\\d{1,19}$")
    private val binding = Regex("^[A-Za-z0-9_-]{16,128}$")
    private val maxCents = BigInteger("9223372036854775807")

    fun validate(intent: FinancialIntent): FinancialIntent {
        require(uuid.matches(intent.correlationId)) { "CORRELATION_ID_INVALID" }
        require(uuid.matches(intent.idempotencyKey)) { "IDEMPOTENCY_KEY_INVALID" }
        require(cents.matches(intent.amountCents)) { "AMOUNT_INVALID" }

        val amount = intent.amountCents.toBigInteger()
        require(amount > BigInteger.ZERO && amount <= maxCents) { "AMOUNT_INVALID" }
        require(binding.matches(intent.deviceBindingId)) { "DEVICE_BINDING_REQUIRED" }
        require(intent.attestationValid) { "DEVICE_ATTESTATION_REQUIRED" }
        require(intent.state != CommandState.UNKNOWN) { "UNKNOWN_REQUIRES_RECONCILIATION" }

        return intent
    }

    fun canRetry(state: CommandState): Boolean = state == CommandState.FAILED

    fun sanitizeTelemetry(input: Map<String, String>): Map<String, String> =
        input.filterKeys { it in setOf("correlationId", "route", "result", "durationMs") }
}

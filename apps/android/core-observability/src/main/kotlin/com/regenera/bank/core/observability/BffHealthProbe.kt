package com.regenera.bank.core.observability

import com.regenera.bank.core.network.MobileBffApi

/**
 * Probes mobile-bff health endpoint for readiness checks and startup diagnostics.
 */
class BffHealthProbe(
    private val api: MobileBffApi,
    private val logger: RegeneraLogger,
) {

    suspend fun probe(): BffHealthStatus {
        return try {
            val response = api.health()
            val status = BffHealthStatus(
                healthy = response.status == "ok",
                layer = response.layer,
                channel = response.channel,
            )
            logger.info(TAG, "mobile-bff health: ${response.status} (${response.layer})")
            status
        } catch (error: Exception) {
            logger.error(TAG, "mobile-bff health probe failed", error)
            BffHealthStatus(healthy = false, layer = "unreachable", channel = null)
        }
    }

    companion object {
        private const val TAG = "BffHealthProbe"
    }
}

data class BffHealthStatus(
    val healthy: Boolean,
    val layer: String,
    val channel: String?,
)
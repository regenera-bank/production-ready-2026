package com.regenera.bank.core.network

import retrofit2.http.GET

/**
 * Shared mobile-bff endpoints consumed by all feature modules.
 * Base URL: http://localhost:3201/v1/ (emulator: 10.0.2.2:3201)
 */
interface MobileBffApi {

    @GET("health")
    suspend fun health(): HealthResponse
}

data class HealthResponse(
    val status: String,
    val layer: String,
    val channel: String? = null,
)
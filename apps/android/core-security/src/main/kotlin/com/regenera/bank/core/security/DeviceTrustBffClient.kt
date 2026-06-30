package com.regenera.bank.core.security

import retrofit2.http.Body
import retrofit2.http.POST

/**
 * Mobile BFF client for device trust and biometric enrollment.
 * Mirrors web-bff passkey flows adapted for Android Keystore attestation.
 */
interface DeviceTrustBffClient {

    @POST("auth/device/register")
    suspend fun registerDevice(@Body request: DeviceRegisterRequest): DeviceRegisterResponse

    @POST("auth/device/verify")
    suspend fun verifyDevice(@Body request: DeviceVerifyRequest): DeviceVerifyResponse
}

data class DeviceRegisterRequest(
    val deviceId: String,
    val attestation: String,
    val publicKey: String,
    val platform: String = "android",
)

data class DeviceRegisterResponse(
    val deviceTrustId: String,
    val status: String,
)

data class DeviceVerifyRequest(
    val deviceId: String,
    val challenge: String,
    val signature: String,
)

data class DeviceVerifyResponse(
    val verified: Boolean,
    val sessionToken: String?,
)
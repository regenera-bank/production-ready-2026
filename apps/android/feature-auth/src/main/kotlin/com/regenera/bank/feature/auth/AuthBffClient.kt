package com.regenera.bank.feature.auth

import retrofit2.http.Body
import retrofit2.http.POST

/** Mobile BFF auth — espelha web-bff /auth via mobile-bff :3201/v1/. */
interface AuthBffClient {

    @POST("auth/session")
    suspend fun login(@Body request: LoginRequest): SessionResponse

    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): SessionResponse

    @POST("auth/firebase/session")
    suspend fun exchangeFirebaseToken(@Body request: FirebaseTokenRequest): SessionResponse

    @POST("auth/session/revoke")
    suspend fun logout(): LogoutResponse
}

data class LoginRequest(val document: String, val password: String)

data class SessionResponse(
    val accessToken: String,
    val userId: String,
    val displayName: String,
    val expiresAt: String,
)

data class RegisterRequest(
    val document: String,
    val password: String,
    val displayName: String,
    val email: String,
    val phone: String,
    val birthDate: String,
    val address: AddressBody,
)

data class AddressBody(
    val street: String,
    val number: String,
    val complement: String? = null,
    val neighborhood: String,
    val city: String,
    val state: String,
    val postalCode: String,
)

data class FirebaseTokenRequest(val idToken: String)

data class LogoutResponse(val ok: Boolean)
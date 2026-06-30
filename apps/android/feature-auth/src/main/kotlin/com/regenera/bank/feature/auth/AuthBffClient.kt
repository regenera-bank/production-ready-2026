package com.regenera.bank.feature.auth

import retrofit2.http.Body
import retrofit2.http.POST

/** Mobile BFF auth — mirrors web-bff /v1/auth endpoints. */
interface AuthBffClient {

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): LoginResponse

    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): RegisterResponse

    @POST("auth/firebase/token")
    suspend fun exchangeFirebaseToken(@Body request: FirebaseTokenRequest): LoginResponse

    @POST("auth/logout")
    suspend fun logout(): LogoutResponse
}

data class LoginRequest(val document: String, val password: String)

data class LoginResponse(
    val sessionToken: String,
    val userId: String,
    val displayName: String,
)

data class RegisterRequest(
    val document: String,
    val password: String,
    val displayName: String,
    val email: String,
    val phone: String,
    val birthDate: String,
)

data class RegisterResponse(val userId: String, val status: String)

data class FirebaseTokenRequest(val idToken: String)

data class LogoutResponse(val ok: Boolean)
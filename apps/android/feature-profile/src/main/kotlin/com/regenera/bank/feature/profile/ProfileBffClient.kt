package com.regenera.bank.feature.profile

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PUT

/** Mobile BFF profile — user settings and contact data. */
interface ProfileBffClient {

    @GET("profile/me")
    suspend fun getProfile(): ProfileResponse

    @PUT("profile/me")
    suspend fun updateProfile(@Body request: ProfileUpdateRequest): ProfileResponse
}

data class ProfileResponse(
    val userId: String,
    val displayName: String,
    val email: String,
    val phone: String,
    val documentMasked: String,
)

data class ProfileUpdateRequest(
    val displayName: String?,
    val email: String?,
    val phone: String?,
)
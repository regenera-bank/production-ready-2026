package com.regenera.bank.core.storage

import retrofit2.http.GET

/**
 * Mobile BFF client for profile snapshot used to hydrate local storage.
 */
interface ProfileSyncBffClient {

    @GET("profile/me")
    suspend fun getProfile(): ProfileSnapshotResponse
}

data class ProfileSnapshotResponse(
    val userId: String,
    val displayName: String,
    val email: String,
    val onboardingCompleted: Boolean,
    val lastSyncedAt: Long,
)
package com.regenera.bank.core.storage

/**
 * Local user preferences persisted via DataStore.
 * Synced from mobile-bff profile on login.
 */
interface UserPreferencesStore {
    suspend fun setOnboardingCompleted(completed: Boolean)
    suspend fun isOnboardingCompleted(): Boolean
    suspend fun setLastSyncedAt(epochMillis: Long)
    suspend fun getLastSyncedAt(): Long?
}

class InMemoryUserPreferencesStore : UserPreferencesStore {
    private var onboardingCompleted = false
    private var lastSyncedAt: Long? = null

    override suspend fun setOnboardingCompleted(completed: Boolean) {
        onboardingCompleted = completed
    }

    override suspend fun isOnboardingCompleted(): Boolean = onboardingCompleted

    override suspend fun setLastSyncedAt(epochMillis: Long) {
        lastSyncedAt = epochMillis
    }

    override suspend fun getLastSyncedAt(): Long? = lastSyncedAt
}
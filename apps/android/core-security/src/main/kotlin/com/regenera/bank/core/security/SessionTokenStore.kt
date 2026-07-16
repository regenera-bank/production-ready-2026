package com.regenera.bank.core.security

/**
 * Abstraction for persisting mobile-bff session tokens securely.
 * Production implementation uses EncryptedSharedPreferences via Android Keystore.
 */
interface SessionTokenStore {
    suspend fun saveSessionToken(token: String)
    suspend fun getSessionToken(): String?
    suspend fun clearSessionToken()
}

class InMemorySessionTokenStore : SessionTokenStore {
    private var token: String? = null

    override suspend fun saveSessionToken(token: String) {
        this.token = token
    }

    override suspend fun getSessionToken(): String? = token

    override suspend fun clearSessionToken() {
        token = null
    }
}
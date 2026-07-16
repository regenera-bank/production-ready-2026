package com.regenera.bank.security

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.regenera.bank.core.security.SessionTokenStore
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Persistência de sessão entre reinícios protegida pelo Android Keystore
 * (EncryptedSharedPreferences + MasterKey AES256-GCM) — checklist §11.
 *
 * Se o keyset criptográfico estiver corrompido (restore de backup em outro
 * aparelho, limpeza parcial de dados), o arquivo cifrado é descartado e
 * recriado: o cliente refaz login em vez de o app quebrar na inicialização.
 * Tokens nunca são gravados em texto claro.
 */
@Singleton
class PreferencesSessionTokenStore @Inject constructor(
    @ApplicationContext private val context: Context,
) : SessionTokenStore {
    private val prefs: SharedPreferences by lazy { createEncryptedPrefs() }

    private fun createEncryptedPrefs(): SharedPreferences {
        // Migração one-shot: remove o arquivo legado em texto claro, se existir.
        context.getSharedPreferences(LEGACY_PREFS_NAME, Context.MODE_PRIVATE)
            .edit().clear().apply()
        return try {
            buildEncrypted()
        } catch (error: Exception) {
            // Keyset inválido/corrompido: descarta o arquivo cifrado e recria.
            Log.w(TAG, "Keyset da sessão inválido — recriando storage cifrado", error)
            context.deleteSharedPreferences(ENCRYPTED_PREFS_NAME)
            buildEncrypted()
        }
    }

    private fun buildEncrypted(): SharedPreferences {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        return EncryptedSharedPreferences.create(
            context,
            ENCRYPTED_PREFS_NAME,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        )
    }

    override suspend fun saveSessionToken(token: String) {
        prefs.edit().putString(KEY_TOKEN, token).apply()
    }

    override suspend fun getSessionToken(): String? = prefs.getString(KEY_TOKEN, null)

    override suspend fun clearSessionToken() {
        prefs.edit().remove(KEY_TOKEN).apply()
    }

    private companion object {
        const val TAG = "SessionTokenStore"
        const val LEGACY_PREFS_NAME = "regenera_session"
        const val ENCRYPTED_PREFS_NAME = "regenera_session_secure"
        const val KEY_TOKEN = "access_token"
    }
}

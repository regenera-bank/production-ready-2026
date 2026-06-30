package com.regenera.bank.core.network

data class MobileBffConfig(
    val baseUrl: String,
    val sessionCookieName: String = "regenera_session",
    val connectTimeoutSeconds: Long = 15,
    val readTimeoutSeconds: Long = 30,
) {
    companion object {
        fun emulatorDefault(): MobileBffConfig = MobileBffConfig(
            baseUrl = BuildConfig.MOBILE_BFF_BASE_URL,
        )
    }
}
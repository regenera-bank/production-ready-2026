package com.regenera.bank.core.network

import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import java.util.concurrent.TimeUnit

class MobileBffClientFactory(
    private val config: MobileBffConfig,
    private val sessionProvider: () -> String? = { null },
) {

    private val moshi: Moshi = Moshi.Builder()
        .add(KotlinJsonAdapterFactory())
        .build()

    fun createApi(): MobileBffApi = createRetrofit().create(MobileBffApi::class.java)

    fun <T> create(service: Class<T>): T = createRetrofit().create(service)

    private fun createRetrofit(): Retrofit = Retrofit.Builder()
        .baseUrl(config.baseUrl)
        .client(createOkHttp())
        .addConverterFactory(MoshiConverterFactory.create(moshi))
        .build()

    private fun createOkHttp(): OkHttpClient {
        val sessionInterceptor = Interceptor { chain ->
            val session = sessionProvider()
            val request = if (session != null) {
                chain.request().newBuilder()
                    .addHeader("Authorization", "Bearer $session")
                    .build()
            } else {
                chain.request()
            }
            chain.proceed(request)
        }

        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BASIC
        }

        return OkHttpClient.Builder()
            .connectTimeout(config.connectTimeoutSeconds, TimeUnit.SECONDS)
            .readTimeout(config.readTimeoutSeconds, TimeUnit.SECONDS)
            .addInterceptor(sessionInterceptor)
            .addInterceptor(logging)
            .build()
    }
}
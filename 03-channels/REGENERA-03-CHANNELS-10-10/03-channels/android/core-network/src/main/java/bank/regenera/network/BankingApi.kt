package bank.regenera.network

import java.io.IOException
import java.time.Duration
import java.util.UUID
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

class ApiHttpException(val status: Int) : IOException("HTTP_$status")

class BankingApi(
    private val baseUrl: String,
    private val tokenProvider: () -> String?
) {
    private val json = Json {
        ignoreUnknownKeys = false
        explicitNulls = false
    }

    private val client = OkHttpClient.Builder()
        .retryOnConnectionFailure(false)
        .callTimeout(Duration.ofSeconds(15))
        .build()

    private suspend fun call(
        path: String,
        method: String = "GET",
        body: String? = null,
        headers: Map<String, String> = emptyMap()
    ): String = withContext(Dispatchers.IO) {
        val token = tokenProvider() ?: throw SecurityException("sessão ausente")
        val requestBuilder = Request.Builder()
            .url(baseUrl.trimEnd('/') + path)
            .header("Authorization", "Bearer $token")
            .header("X-Correlation-ID", headers["X-Correlation-ID"] ?: UUID.randomUUID().toString())
            .header("Accept", "application/json")

        headers.forEach { (name, value) -> requestBuilder.header(name, value) }

        val requestBody = body?.toRequestBody("application/json".toMediaType())
        requestBuilder.method(method, if (method == "GET") null else requestBody)

        client.newCall(requestBuilder.build()).execute().use { response ->
            val responseBody = response.body?.string().orEmpty()
            if (!response.isSuccessful) throw ApiHttpException(response.code)
            responseBody
        }
    }

    suspend fun accounts(): List<Account> =
        json.decodeFromString(call("/accounts"))

    suspend fun balance(id: String): Balance =
        json.decodeFromString(call("/accounts/$id/balance"))

    suspend fun transactions(id: String): TransactionPage =
        json.decodeFromString(call("/accounts/$id/transactions?limit=50"))

    suspend fun createPix(request: PixRequest, idempotencyKey: String): PixPayment =
        json.decodeFromString(
            call(
                "/pix/payments",
                "POST",
                json.encodeToString(PixRequest.serializer(), request),
                mapOf("Idempotency-Key" to idempotencyKey)
            )
        )
}

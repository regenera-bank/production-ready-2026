package com.regenera.bank.feature.pix

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

/** Mobile BFF Pix — keys, lookup and transfers (DICT/SPI via core-bank). */
interface PixBffClient {

    @GET("banking/pix/keys")
    suspend fun listKeys(): PixKeysResponse

    @POST("banking/pix/keys")
    suspend fun registerKey(@Body request: PixKeyRequest): PixKeyItem

    @POST("banking/pix/lookup")
    suspend fun lookupKey(@Body request: PixLookupRequest): PixLookupResponse

    @POST("banking/pix/transfers")
    suspend fun sendTransfer(@Body request: PixTransferRequest): PixTransferResponse
}

data class PixKeysResponse(val items: List<PixKeyItem>)

data class PixKeyItem(val key: String, val type: String, val status: String)

data class PixKeyRequest(val key: String, val type: String)

data class PixLookupRequest(val key: String)

data class PixLookupResponse(
    val key: String,
    val holderName: String,
    val bank: String,
    val documentMasked: String,
)

data class PixTransferRequest(val key: String, val amountCents: String)

data class PixTransferResponse(
    val operationId: String,
    val status: String,
    val endToEndId: String?,
)
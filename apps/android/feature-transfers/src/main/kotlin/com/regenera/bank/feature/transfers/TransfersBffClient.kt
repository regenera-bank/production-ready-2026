package com.regenera.bank.feature.transfers

import retrofit2.http.Body
import retrofit2.http.POST

/** Mobile BFF internal transfers between Regenera accounts. */
interface TransfersBffClient {

    @POST("banking/transfers")
    suspend fun transfer(@Body request: InternalTransferRequest): InternalTransferResponse
}

data class InternalTransferRequest(
    val toDocument: String,
    val amountCents: String,
    val description: String? = null,
)

data class InternalTransferResponse(
    val operationId: String,
    val status: String,
    val fromAccountId: String,
    val toAccountId: String,
)
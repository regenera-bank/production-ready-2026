package com.regenera.bank.feature.transactions

import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

/** Mobile BFF statement — paginated extrato with receipt metadata. */
interface TransactionsBffClient {

    @GET("banking/transactions")
    suspend fun listTransactions(
        @Query("cursor") cursor: String? = null,
        @Query("limit") limit: Int = 20,
    ): TransactionsPageResponse

    @GET("banking/transactions/{transactionId}")
    suspend fun getTransaction(@Path("transactionId") transactionId: String): TransactionDetail
}

data class TransactionsPageResponse(
    val items: List<TransactionSummary>,
    val nextCursor: String?,
)

data class TransactionSummary(
    val id: String,
    val description: String,
    val amountCents: String,
    val direction: String,
    val category: String,
    val occurredAt: String,
)

data class TransactionDetail(
    val id: String,
    val description: String,
    val amountCents: String,
    val direction: String,
    val counterparty: String?,
    val occurredAt: String,
    val receiptUrl: String?,
)
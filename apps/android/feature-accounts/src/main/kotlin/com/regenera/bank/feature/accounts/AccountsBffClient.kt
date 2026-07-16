package com.regenera.bank.feature.accounts

import retrofit2.http.GET
import retrofit2.http.Path

/** Mobile BFF accounts — ledger-backed account registry via core-bank. */
interface AccountsBffClient {

    @GET("accounts")
    suspend fun listAccounts(): AccountsListResponse

    @GET("accounts/{accountId}/balance")
    suspend fun getBalance(@Path("accountId") accountId: String): BalanceResponse
}

data class AccountsListResponse(val items: List<AccountSummary>)

data class AccountSummary(
    val accountId: String,
    val type: String,
    val status: String,
    val balanceCents: String,
    val currency: String = "BRL",
)

data class BalanceResponse(
    val accountId: String,
    val balanceCents: String,
    val availableCents: String,
    val heldCents: String,
)
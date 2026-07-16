package com.regenera.bank.feature.credit

import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Body

/** Mobile BFF credit — lines, limits and installment simulation. */
interface CreditBffClient {

    @GET("banking/credit")
    suspend fun listCreditLines(): CreditLinesResponse

    @POST("banking/credit/simulate")
    suspend fun simulateInstallment(@Body request: CreditSimulateRequest): CreditSimulateResponse
}

data class CreditLinesResponse(val items: List<CreditLineSummary>)

data class CreditLineSummary(
    val lineId: String,
    val product: String,
    val limitCents: String,
    val usedCents: String,
    val availableCents: String,
    val apr: String,
)

data class CreditSimulateRequest(val lineId: String, val amountCents: String, val installments: Int)

data class CreditSimulateResponse(
    val installmentCents: String,
    val totalCents: String,
    val cet: String,
)
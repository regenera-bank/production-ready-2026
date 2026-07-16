package com.regenera.bank.feature.investments

import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Body

/** Mobile BFF investments — portfolio and CDB/Tesouro applications. */
interface InvestmentsBffClient {

    @GET("banking/investments")
    suspend fun getPortfolio(): PortfolioResponse

    @POST("banking/investments/apply")
    suspend fun apply(@Body request: InvestmentApplyRequest): InvestmentApplyResponse
}

data class PortfolioResponse(
    val totalCents: String,
    val appliedCents: String,
    val positions: List<InvestmentPosition>,
)

data class InvestmentPosition(
    val productId: String,
    val name: String,
    val amountCents: String,
    val yieldPct: String,
    val maturityDate: String?,
)

data class InvestmentApplyRequest(val productId: String, val amountCents: String)

data class InvestmentApplyResponse(val operationId: String, val status: String)
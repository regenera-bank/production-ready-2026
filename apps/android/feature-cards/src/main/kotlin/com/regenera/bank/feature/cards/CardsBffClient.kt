package com.regenera.bank.feature.cards

import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

/** Mobile BFF cards — virtual/physical card lifecycle. */
interface CardsBffClient {

    @GET("banking/cards")
    suspend fun listCards(): CardsListResponse

    @POST("banking/cards/{cardId}/block")
    suspend fun blockCard(@Path("cardId") cardId: String): CardActionResponse

    @POST("banking/cards/{cardId}/unblock")
    suspend fun unblockCard(@Path("cardId") cardId: String): CardActionResponse
}

data class CardsListResponse(val items: List<CardSummary>)

data class CardSummary(
    val cardId: String,
    val lastFour: String,
    val brand: String,
    val type: String,
    val status: String,
    val limitCents: String,
)

data class CardActionResponse(val cardId: String, val status: String)
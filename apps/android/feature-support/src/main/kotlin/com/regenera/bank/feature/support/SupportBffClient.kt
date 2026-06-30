package com.regenera.bank.feature.support

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

/** Mobile BFF support — tickets and Raphaela AI chat handoff. */
interface SupportBffClient {

    @GET("support/faq")
    suspend fun listFaq(): FaqResponse

    @POST("support/tickets")
    suspend fun openTicket(@Body request: OpenTicketRequest): TicketResponse

    @POST("ai/chat")
    suspend fun chat(@Body request: AiChatRequest): AiChatResponse
}

data class FaqResponse(val items: List<FaqItem>)

data class FaqItem(val id: String, val question: String, val answer: String)

data class OpenTicketRequest(val subject: String, val message: String, val category: String)

data class TicketResponse(val ticketId: String, val status: String)

data class AiChatRequest(val message: String, val sessionId: String?)

data class AiChatResponse(val reply: String, val sessionId: String)
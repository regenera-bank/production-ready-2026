package com.regenera.bank.feature.home

import retrofit2.http.GET

/** Mobile BFF home dashboard — composes balance, shortcuts and recent activity. */
interface HomeBffClient {

    @GET("banking/dashboard")
    suspend fun getDashboard(): DashboardResponse
}

data class DashboardResponse(
    val balanceCents: String,
    val availableCents: String,
    val accountNumber: String,
    val recentTransactions: List<DashboardTransaction>,
    val shortcuts: List<DashboardShortcut>,
)

data class DashboardTransaction(
    val id: String,
    val description: String,
    val amountCents: String,
    val direction: String,
    val occurredAt: String,
)

data class DashboardShortcut(
    val id: String,
    val label: String,
    val route: String,
)
package com.regenera.bank.feature.onboarding

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

/** Mobile BFF onboarding — KYC document capture and address validation. */
interface OnboardingBffClient {

    @GET("onboarding/status")
    suspend fun getStatus(): OnboardingStatusResponse

    @POST("onboarding/profile")
    suspend fun submitProfile(@Body request: AddressRequest): AddressResponse

    @POST("onboarding/kyc/document")
    suspend fun submitDocuments(@Body request: DocumentSubmitRequest): DocumentSubmitResponse

    @POST("onboarding/kyc/selfie")
    suspend fun submitSelfie(@Body request: SelfieSubmitRequest): DocumentSubmitResponse

    @POST("onboarding/account/open")
    suspend fun openAccount(): AccountOpenResponse
}

data class OnboardingStatusResponse(
    val step: String,
    val kycStatus: String,
    val canProceed: Boolean,
)

data class DocumentSubmitRequest(
    val documentType: String,
    val frontImageBase64: String,
    val backImageBase64: String?,
)

data class DocumentSubmitResponse(val submissionId: String, val status: String)

data class AddressRequest(
    val street: String,
    val number: String,
    val complement: String?,
    val neighborhood: String,
    val city: String,
    val state: String,
    val postalCode: String,
)

data class AddressResponse(val validated: Boolean, val normalizedAddress: AddressRequest?)

data class SelfieSubmitRequest(val selfieContent: String)

data class AccountOpenResponse(
    val accountId: String,
    val accountStatus: String,
    val welcomeCreditCents: String,
)
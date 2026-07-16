import CoreNetworking
import CoreObservability
import Foundation

public final class MockMobileBFFClient: MobileBFFClientProtocol, @unchecked Sendable {
    public let baseURL = URL(string: "https://bff.test")!
    public var health = HealthLiveResponse(status: "UP", service: "mobile-bff")
    public var session = SessionResponse(
        accessToken: "token",
        userId: "u1",
        displayName: "Ana",
        expiresAt: "2026-12-31T00:00:00Z",
        kycStatus: "PENDING",
        accountStatus: "NONE"
    )
    public var dashboard = DashboardResponse(
        accountId: "acc",
        maskedAccount: "****1234",
        agency: "0001",
        document: "12345678901",
        balanceCents: "100000",
        availableCents: "90000",
        currency: "BRL",
        correlationId: "corr",
        recentTransactions: []
    )

    public init() {}

    public func checkHealth(correlation: CorrelationContext) async throws -> HealthLiveResponse { health }
    public func createSession(document: String, password: String, correlation: CorrelationContext) async throws -> SessionResponse { session }
    public func fetchDashboard(token: String, correlation: CorrelationContext) async throws -> DashboardResponse { dashboard }
    public func fetchTransactions(token: String, correlation: CorrelationContext) async throws -> [TransactionDTO] { [] }
    public func fetchPixKeys(token: String, correlation: CorrelationContext) async throws -> [PixKeyDTO] { [] }
    public func sendPixTransfer(token: String, key: String, amountCents: String, idempotencyKey: String, correlation: CorrelationContext) async throws -> PixTransferResponse {
        PixTransferResponse(endToEndId: "e2e", paymentId: "p1", receiverMasked: "***", amountCents: amountCents, balanceCents: "90000", availableCents: "80000")
    }
    public func sendTransfer(token: String, toDocument: String, amountCents: String, idempotencyKey: String, correlation: CorrelationContext) async throws -> TransferResponse {
        TransferResponse(paymentId: "p2", creditorName: "Bob", amountCents: amountCents, balanceCents: "90000", availableCents: "80000")
    }
}
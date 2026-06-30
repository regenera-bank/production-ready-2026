import CoreObservability
import Foundation

public enum MobileBFFError: Error, Equatable, Sendable {
    case invalidURL
    case httpStatus(Int, String)
    case decodingFailed
    case unauthorized
}

public protocol MobileBFFClientProtocol: Sendable {
    var baseURL: URL { get }

    func checkHealth(correlation: CorrelationContext) async throws -> HealthLiveResponse
    func createSession(document: String, password: String, correlation: CorrelationContext) async throws -> SessionResponse
    func fetchDashboard(token: String, correlation: CorrelationContext) async throws -> DashboardResponse
    func fetchTransactions(token: String, correlation: CorrelationContext) async throws -> [TransactionDTO]
    func fetchPixKeys(token: String, correlation: CorrelationContext) async throws -> [PixKeyDTO]
    func sendPixTransfer(
        token: String,
        key: String,
        amountCents: String,
        idempotencyKey: String,
        correlation: CorrelationContext
    ) async throws -> PixTransferResponse
    func sendTransfer(
        token: String,
        toDocument: String,
        amountCents: String,
        idempotencyKey: String,
        correlation: CorrelationContext
    ) async throws -> TransferResponse
}
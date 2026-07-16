import CoreObservability
import Foundation

public final class URLSessionMobileBFFClient: MobileBFFClientProtocol, @unchecked Sendable {
    public let baseURL: URL
    private let session: URLSession
    private let decoder: JSONDecoder

    public init(baseURL: URL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
        self.decoder = JSONDecoder()
    }

    public func checkHealth(correlation: CorrelationContext) async throws -> HealthLiveResponse {
        try await request(path: MobileBFFPath.healthLive, method: "GET", token: nil, correlation: correlation)
    }

    public func createSession(
        document: String,
        password: String,
        correlation: CorrelationContext
    ) async throws -> SessionResponse {
        let body = ["document": document, "password": password]
        return try await request(
            path: MobileBFFPath.session,
            method: "POST",
            body: body,
            token: nil,
            correlation: correlation
        )
    }

    public func fetchDashboard(token: String, correlation: CorrelationContext) async throws -> DashboardResponse {
        try await request(path: MobileBFFPath.dashboard, method: "GET", token: token, correlation: correlation)
    }

    public func fetchTransactions(token: String, correlation: CorrelationContext) async throws -> [TransactionDTO] {
        struct Payload: Decodable { let items: [TransactionDTO] }
        let payload: Payload = try await request(
            path: MobileBFFPath.transactions,
            method: "GET",
            token: token,
            correlation: correlation
        )
        return payload.items
    }

    public func fetchPixKeys(token: String, correlation: CorrelationContext) async throws -> [PixKeyDTO] {
        struct Payload: Decodable { let items: [PixKeyDTO] }
        let payload: Payload = try await request(
            path: MobileBFFPath.pixKeys,
            method: "GET",
            token: token,
            correlation: correlation
        )
        return payload.items
    }

    public func sendPixTransfer(
        token: String,
        key: String,
        amountCents: String,
        idempotencyKey: String,
        correlation: CorrelationContext
    ) async throws -> PixTransferResponse {
        try await request(
            path: MobileBFFPath.pixTransfers,
            method: "POST",
            body: ["key": key, "amountCents": amountCents],
            token: token,
            idempotencyKey: idempotencyKey,
            correlation: correlation
        )
    }

    public func sendTransfer(
        token: String,
        toDocument: String,
        amountCents: String,
        idempotencyKey: String,
        correlation: CorrelationContext
    ) async throws -> TransferResponse {
        try await request(
            path: MobileBFFPath.transfers,
            method: "POST",
            body: ["toDocument": toDocument, "amountCents": amountCents],
            token: token,
            idempotencyKey: idempotencyKey,
            correlation: correlation
        )
    }

    private func request<T: Decodable>(
        path: String,
        method: String,
        body: [String: String]? = nil,
        token: String?,
        idempotencyKey: String? = nil,
        correlation: CorrelationContext
    ) async throws -> T {
        guard let url = URL(string: path, relativeTo: baseURL) else {
            throw MobileBFFError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(correlation.id, forHTTPHeaderField: "x-correlation-id")
        if let token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let idempotencyKey {
            request.setValue(idempotencyKey, forHTTPHeaderField: "Idempotency-Key")
        }
        if let body {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
        }

        RegeneraLogger.info("\(method) \(path)", correlation: correlation)

        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw MobileBFFError.decodingFailed
        }

        guard (200 ... 299).contains(http.statusCode) else {
            let message = String(data: data, encoding: .utf8) ?? "erro"
            if http.statusCode == 401 { throw MobileBFFError.unauthorized }
            throw MobileBFFError.httpStatus(http.statusCode, message)
        }

        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw MobileBFFError.decodingFailed
        }
    }
}
import CoreNetworking
import CoreObservability
import CoreSecurity
import CoreStorage
import Foundation

public final class AuthenticationViewModel: ObservableObject {
    @Published public private(set) var displayName: String?
    @Published public private(set) var errorMessage: String?

    private let client: MobileBFFClientProtocol
    private let sessionStore: SessionStoreProtocol

    public init(client: MobileBFFClientProtocol, sessionStore: SessionStoreProtocol) {
        self.client = client
        self.sessionStore = sessionStore
        displayName = sessionStore.load()?.displayName
    }

    @MainActor
    public func signIn(document: String, password: String) async {
        errorMessage = nil
        do {
            let response = try await client.createSession(
                document: document,
                password: password,
                correlation: CorrelationContext()
            )
            let expiresAt = ISO8601DateFormatter().date(from: response.expiresAt) ?? Date().addingTimeInterval(3600)
            try sessionStore.save(
                StoredSession(
                    accessToken: response.accessToken,
                    userId: response.userId,
                    displayName: response.displayName,
                    expiresAt: expiresAt
                )
            )
            displayName = response.displayName
        } catch {
            errorMessage = "Falha na autenticação."
        }
    }
}
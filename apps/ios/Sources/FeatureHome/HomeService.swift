import CoreNetworking
import CoreObservability
import Foundation

public final class HomeViewModel: ObservableObject {
    @Published public private(set) var dashboard: DashboardResponse?
    @Published public private(set) var isLoading = false
    @Published public private(set) var errorMessage: String?

    private let client: MobileBFFClientProtocol

    public init(client: MobileBFFClientProtocol) {
        self.client = client
    }

    @MainActor
    public func load(token: String) async {
        isLoading = true
        defer { isLoading = false }
        do {
            dashboard = try await client.fetchDashboard(token: token, correlation: CorrelationContext())
            errorMessage = nil
        } catch {
            errorMessage = "Não foi possível carregar o home."
        }
    }
}
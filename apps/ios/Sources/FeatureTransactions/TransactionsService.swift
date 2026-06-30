import CoreNetworking
import CoreObservability
import Foundation

@MainActor
public final class TransactionsViewModel: ObservableObject {
    @Published public private(set) var items: [TransactionDTO] = []

    private let client: MobileBFFClientProtocol

    public init(client: MobileBFFClientProtocol) {
        self.client = client
    }

    public func load(token: String) async {
        do {
            items = try await client.fetchTransactions(token: token, correlation: CorrelationContext())
        } catch {
            items = []
        }
    }
}
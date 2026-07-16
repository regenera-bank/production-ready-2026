import CoreNetworking
import CoreObservability
import Foundation

@MainActor
public final class TransfersViewModel: ObservableObject {
    @Published public private(set) var lastTransfer: TransferResponse?

    private let client: MobileBFFClientProtocol

    public init(client: MobileBFFClientProtocol) {
        self.client = client
    }

    public func send(token: String, toDocument: String, amountCents: String) async {
        do {
            lastTransfer = try await client.sendTransfer(
                token: token,
                toDocument: toDocument,
                amountCents: amountCents,
                idempotencyKey: UUID().uuidString,
                correlation: CorrelationContext()
            )
        } catch {
            lastTransfer = nil
        }
    }
}
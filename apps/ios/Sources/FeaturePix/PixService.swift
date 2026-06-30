import CoreNetworking
import CoreObservability
import Foundation

@MainActor
public final class PixViewModel: ObservableObject {
    @Published public private(set) var keys: [PixKeyDTO] = []
    @Published public private(set) var lastTransfer: PixTransferResponse?

    private let client: MobileBFFClientProtocol

    public init(client: MobileBFFClientProtocol) {
        self.client = client
    }

    public func loadKeys(token: String) async {
        do {
            keys = try await client.fetchPixKeys(token: token, correlation: CorrelationContext())
        } catch {
            keys = []
        }
    }

    public func send(token: String, key: String, amountCents: String) async {
        do {
            lastTransfer = try await client.sendPixTransfer(
                token: token,
                key: key,
                amountCents: amountCents,
                idempotencyKey: UUID().uuidString,
                correlation: CorrelationContext()
            )
        } catch {
            lastTransfer = nil
        }
    }
}
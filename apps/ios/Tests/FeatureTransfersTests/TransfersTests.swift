import MobileBFFTestSupport
import XCTest
@testable import FeatureTransfers

@MainActor
final class TransfersTests: XCTestCase {
    func testSendTransfer() async {
        let viewModel = TransfersViewModel(client: MockMobileBFFClient())
        await viewModel.send(token: "t", toDocument: "123", amountCents: "500")
        XCTAssertEqual(viewModel.lastTransfer?.creditorName, "Bob")
    }
}
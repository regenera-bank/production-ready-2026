import MobileBFFTestSupport
import XCTest
@testable import FeaturePix

@MainActor
final class PixTests: XCTestCase {
    func testSendPixTransfer() async {
        let viewModel = PixViewModel(client: MockMobileBFFClient())
        await viewModel.send(token: "t", key: "email@test.com", amountCents: "1000")
        XCTAssertEqual(viewModel.lastTransfer?.amountCents, "1000")
    }
}
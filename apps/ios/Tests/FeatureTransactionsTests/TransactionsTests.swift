import MobileBFFTestSupport
import XCTest
@testable import FeatureTransactions

@MainActor
final class TransactionsTests: XCTestCase {
    func testLoadEmptyList() async {
        let viewModel = TransactionsViewModel(client: MockMobileBFFClient())
        await viewModel.load(token: "token")
        XCTAssertTrue(viewModel.items.isEmpty)
    }
}
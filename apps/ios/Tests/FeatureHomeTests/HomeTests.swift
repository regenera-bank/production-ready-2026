import MobileBFFTestSupport
import XCTest
@testable import FeatureHome

@MainActor
final class HomeTests: XCTestCase {
    func testLoadDashboard() async {
        let viewModel = HomeViewModel(client: MockMobileBFFClient())
        await viewModel.load(token: "token")
        XCTAssertEqual(viewModel.dashboard?.accountId, "acc")
    }
}
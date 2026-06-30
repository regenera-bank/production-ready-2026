import CoreObservability
import MobileBFFTestSupport
import XCTest
@testable import CoreNetworking

final class MobileBFFClientTests: XCTestCase {
    func testMockClientHealthIsUp() async throws {
        let client = MockMobileBFFClient()
        let health = try await client.checkHealth(correlation: CorrelationContext(id: "test"))
        XCTAssertEqual(health.status, "UP")
        XCTAssertEqual(health.service, "mobile-bff")
    }

    func testMobileBFFPathMatchesSharedContract() {
        XCTAssertEqual(MobileBFFPath.pixTransfers, "/v1/banking/pix/transfers")
        XCTAssertEqual(MobileBFFPath.session, "/v1/auth/session")
    }
}
import XCTest
@testable import FeatureCredit

final class CreditTests: XCTestCase {
    func testDemoLine() {
        XCTAssertEqual(CreditService.demoLine().availableCents, "250000")
    }
}
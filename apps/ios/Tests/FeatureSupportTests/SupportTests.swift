import XCTest
@testable import FeatureSupport

final class SupportTests: XCTestCase {
    func testOpenTickets() {
        XCTAssertEqual(SupportService.openTickets().first?.status, "OPEN")
    }
}
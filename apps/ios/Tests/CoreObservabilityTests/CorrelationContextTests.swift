import XCTest
@testable import CoreObservability

final class CorrelationContextTests: XCTestCase {
    func testGeneratesNonEmptyId() {
        let context = CorrelationContext()
        XCTAssertFalse(context.id.isEmpty)
    }
}
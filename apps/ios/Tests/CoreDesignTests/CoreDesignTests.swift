import XCTest
@testable import CoreDesign

final class CoreDesignTests: XCTestCase {
    func testModuleLoads() {
        XCTAssertNotNil(RegeneraScreenBackground.self)
    }
}
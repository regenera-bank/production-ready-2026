import XCTest
@testable import FeatureCards

final class CardsTests: XCTestCase {
    func testPlaceholderCards() {
        XCTAssertEqual(CardsService.placeholderCards().first?.lastFour, "4242")
    }
}
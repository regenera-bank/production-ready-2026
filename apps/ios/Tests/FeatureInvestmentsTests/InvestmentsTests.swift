import XCTest
@testable import FeatureInvestments

final class InvestmentsTests: XCTestCase {
    func testDemoPortfolioCount() {
        XCTAssertEqual(InvestmentsService.demoPortfolio().count, 2)
    }
}
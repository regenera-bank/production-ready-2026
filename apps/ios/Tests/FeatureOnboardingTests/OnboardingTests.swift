import MobileBFFTestSupport
import XCTest
@testable import FeatureOnboarding

final class OnboardingTests: XCTestCase {
    func testDefaultStepsCount() {
        XCTAssertEqual(OnboardingService.defaultSteps().count, 4)
    }

    func testBffReadyWithMock() async {
        let ready = await OnboardingService.checkBffReady(client: MockMobileBFFClient())
        XCTAssertTrue(ready)
    }
}
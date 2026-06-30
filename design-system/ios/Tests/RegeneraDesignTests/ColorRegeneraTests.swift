import SwiftUI
import XCTest
@testable import RegeneraDesign

final class ColorRegeneraTests: XCTestCase {
    func testCanonicalTokensAreDefined() {
        XCTAssertNotNil(Color.Regenera.primary)
        XCTAssertNotNil(Color.Regenera.backgroundDeep)
        XCTAssertNotNil(Color.Regenera.gradientStart)
    }

    func testTypographyFamily() {
        XCTAssertEqual(RegeneraTypography.fontFamily, "Manrope")
    }
}
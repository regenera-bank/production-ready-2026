import CoreStorage
import XCTest
@testable import FeatureProfile

final class ProfileTests: XCTestCase {
    func testFromSession() throws {
        let session = StoredSession(accessToken: "t", userId: "u1", displayName: "Ana", expiresAt: Date())
        let profile = ProfileService.fromSession(session)
        XCTAssertEqual(profile?.displayName, "Ana")
    }
}
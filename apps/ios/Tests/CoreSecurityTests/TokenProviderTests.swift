import CoreStorage
import XCTest
@testable import CoreSecurity

final class TokenProviderTests: XCTestCase {
    func testReturnsStoredToken() throws {
        let store = InMemorySessionStore()
        try store.save(StoredSession(accessToken: "abc", userId: "u", displayName: "Ana", expiresAt: Date()))
        let provider = SessionTokenProvider(store: store)
        XCTAssertEqual(provider.currentToken(), "abc")
    }
}
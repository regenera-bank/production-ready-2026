import XCTest
@testable import CoreStorage

final class SessionStoreTests: XCTestCase {
    func testInMemoryStoreRoundTrip() throws {
        let store = InMemorySessionStore()
        let session = StoredSession(accessToken: "t", userId: "u", displayName: "Ana", expiresAt: Date())
        try store.save(session)
        XCTAssertEqual(store.load(), session)
        try store.clear()
        XCTAssertNil(store.load())
    }
}
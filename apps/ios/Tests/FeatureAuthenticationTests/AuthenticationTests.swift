import CoreStorage
import MobileBFFTestSupport
import XCTest
@testable import FeatureAuthentication

@MainActor
final class AuthenticationTests: XCTestCase {
    func testSignInPersistsSession() async {
        let store = InMemorySessionStore()
        let client = MockMobileBFFClient()
        let viewModel = AuthenticationViewModel(client: client, sessionStore: store)
        await viewModel.signIn(document: "123", password: "secret")
        XCTAssertEqual(viewModel.displayName, "Ana")
        XCTAssertEqual(store.load()?.accessToken, "token")
    }
}
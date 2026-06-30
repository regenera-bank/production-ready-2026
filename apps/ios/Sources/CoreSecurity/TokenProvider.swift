import CoreStorage
import Foundation

public protocol AccessTokenProvider: Sendable {
    func currentToken() -> String?
}

public struct SessionTokenProvider: AccessTokenProvider {
    private let store: SessionStoreProtocol

    public init(store: SessionStoreProtocol) {
        self.store = store
    }

    public func currentToken() -> String? {
        store.load()?.accessToken
    }
}
import Foundation

public struct StoredSession: Codable, Equatable, Sendable {
    public let accessToken: String
    public let userId: String
    public let displayName: String
    public let expiresAt: Date

    public init(accessToken: String, userId: String, displayName: String, expiresAt: Date) {
        self.accessToken = accessToken
        self.userId = userId
        self.displayName = displayName
        self.expiresAt = expiresAt
    }
}

public protocol SessionStoreProtocol: Sendable {
    func load() -> StoredSession?
    func save(_ session: StoredSession) throws
    func clear() throws
}

public final class InMemorySessionStore: SessionStoreProtocol, @unchecked Sendable {
    private var session: StoredSession?

    public init() {}

    public func load() -> StoredSession? { session }

    public func save(_ session: StoredSession) throws {
        self.session = session
    }

    public func clear() throws {
        session = nil
    }
}
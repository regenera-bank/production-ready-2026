import CoreStorage
import Foundation

public struct ProfileSnapshot: Equatable, Sendable {
    public let displayName: String
    public let userId: String
}

public enum ProfileService {
    public static func fromSession(_ session: StoredSession?) -> ProfileSnapshot? {
        guard let session else { return nil }
        return ProfileSnapshot(displayName: session.displayName, userId: session.userId)
    }
}
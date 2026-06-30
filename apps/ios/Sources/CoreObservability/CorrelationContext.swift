import Foundation

public struct CorrelationContext: Sendable {
    public let id: String

    public init(id: String = UUID().uuidString) {
        self.id = id
    }
}

public enum RegeneraLogger {
    public static func info(_ message: String, correlation: CorrelationContext) {
        #if DEBUG
        print("[regenera][\(correlation.id)] \(message)")
        #endif
    }
}
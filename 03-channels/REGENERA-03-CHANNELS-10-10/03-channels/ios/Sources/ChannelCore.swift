import Foundation

enum CommandState { case ready, submitted, completed, failed, unknown }

struct FinancialIntent {
    let correlationId: String
    let idempotencyKey: String
    let amountCents: String
    let state: CommandState
    let deviceBindingId: String
    let appAttestValid: Bool
}

enum ChannelError: Error { case correlation, idempotency, amount, device, attestation, unknown }

enum ChannelCore {
    private static let maxCents = "9223372036854775807"
    private static let bindingPattern = try! NSRegularExpression(pattern: "^[A-Za-z0-9_-]{16,128}$")

    static func validate(_ intent: FinancialIntent) throws -> FinancialIntent {
        guard UUID(uuidString: intent.correlationId) != nil else { throw ChannelError.correlation }
        guard UUID(uuidString: intent.idempotencyKey) != nil else { throw ChannelError.idempotency }
        guard isValidAmount(intent.amountCents) else { throw ChannelError.amount }
        guard matches(bindingPattern, intent.deviceBindingId) else { throw ChannelError.device }
        guard intent.appAttestValid else { throw ChannelError.attestation }
        guard intent.state != .unknown else { throw ChannelError.unknown }
        return intent
    }

    static func canRetry(_ state: CommandState) -> Bool { state == .failed }

    static func sanitizeTelemetry(_ input: [String: String]) -> [String: String] {
        let allowed = Set(["correlationId", "route", "result", "durationMs"])
        return input.filter { allowed.contains($0.key) }
    }

    private static func isValidAmount(_ value: String) -> Bool {
        guard !value.isEmpty, value.count <= 19, value.allSatisfy({ $0.isNumber }) else { return false }
        let normalized = String(value.drop(while: { $0 == "0" }))
        guard !normalized.isEmpty else { return false }
        if normalized.count != maxCents.count { return normalized.count < maxCents.count }
        return normalized <= maxCents
    }

    private static func matches(_ expression: NSRegularExpression, _ value: String) -> Bool {
        let range = NSRange(value.startIndex..<value.endIndex, in: value)
        return expression.firstMatch(in: value, range: range)?.range == range
    }
}

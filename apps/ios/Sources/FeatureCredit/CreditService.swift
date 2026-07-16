import Foundation

public struct CreditLine: Equatable, Sendable {
    public let name: String
    public let availableCents: String
    public let usedCents: String
}

public enum CreditService {
    public static func demoLine() -> CreditLine {
        CreditLine(name: "Crédito pessoal", availableCents: "250000", usedCents: "50000")
    }
}
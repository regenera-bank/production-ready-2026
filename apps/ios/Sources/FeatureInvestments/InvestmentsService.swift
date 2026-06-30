import Foundation

public struct InvestmentPosition: Identifiable, Equatable, Sendable {
    public let id: String
    public let name: String
    public let amountCents: String
}

public enum InvestmentsService {
    public static func demoPortfolio() -> [InvestmentPosition] {
        [
            InvestmentPosition(id: "cdb", name: "CDB Regenera", amountCents: "1000000"),
            InvestmentPosition(id: "fii", name: "FII Verde", amountCents: "350000"),
        ]
    }
}
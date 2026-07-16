import Foundation

public struct CardSummary: Identifiable, Equatable, Sendable {
    public let id: String
    public let brand: String
    public let lastFour: String
    public let limitCents: String
}

public enum CardsService {
    public static func placeholderCards() -> [CardSummary] {
        [
            CardSummary(id: "card-1", brand: "Regenera", lastFour: "4242", limitCents: "500000"),
        ]
    }
}
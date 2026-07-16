import RegeneraDesign
import CoreDesign
import SwiftUI

public struct CardsView: View {
    private let cards: [CardSummary]

    public init(cards: [CardSummary] = CardsService.placeholderCards()) {
        self.cards = cards
    }

    public var body: some View {
        ZStack {
            RegeneraScreenBackground()
            VStack(alignment: .leading, spacing: 12) {
                Text("Cartões")
                    .font(.title.bold())
                    .foregroundStyle(Color.Regenera.textPrimary)
                ForEach(cards) { card in
                    RegeneraCard {
                        Text("\(card.brand) •••• \(card.lastFour)")
                    }
                }
            }
            .padding()
        }
    }
}
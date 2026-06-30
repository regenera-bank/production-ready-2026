import RegeneraDesign
import CoreDesign
import SwiftUI

public struct InvestmentsView: View {
    private let positions: [InvestmentPosition]

    public init(positions: [InvestmentPosition] = InvestmentsService.demoPortfolio()) {
        self.positions = positions
    }

    public var body: some View {
        ZStack {
            RegeneraScreenBackground()
            VStack(alignment: .leading, spacing: 12) {
                Text("Investimentos")
                    .font(.title.bold())
                    .foregroundStyle(Color.Regenera.textPrimary)
                ForEach(positions) { position in
                    RegeneraCard {
                        Text(position.name)
                    }
                }
            }
            .padding()
        }
    }
}
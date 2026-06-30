import RegeneraDesign
import CoreDesign
import SwiftUI

public struct CreditView: View {
    private let line: CreditLine

    public init(line: CreditLine = CreditService.demoLine()) {
        self.line = line
    }

    public var body: some View {
        ZStack {
            RegeneraScreenBackground()
            RegeneraCard {
                VStack(alignment: .leading) {
                    Text("Crédito")
                        .font(.title.bold())
                    Text(line.name)
                    Text("Disponível: R$ \(line.availableCents) centavos")
                        .foregroundStyle(Color.Regenera.textSecondary)
                }
            }
            .padding()
        }
    }
}
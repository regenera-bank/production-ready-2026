import RegeneraDesign
import CoreDesign
import SwiftUI

public struct TransfersView: View {
    @ObservedObject private var viewModel: TransfersViewModel

    public init(viewModel: TransfersViewModel) {
        self.viewModel = viewModel
    }

    public var body: some View {
        ZStack {
            RegeneraScreenBackground()
            VStack(alignment: .leading) {
                Text("Transferências")
                    .font(.title.bold())
                    .foregroundStyle(Color.Regenera.textPrimary)
                if let transfer = viewModel.lastTransfer {
                    RegeneraCard {
                        Text("Para \(transfer.creditorName)")
                    }
                }
            }
            .padding()
        }
    }
}
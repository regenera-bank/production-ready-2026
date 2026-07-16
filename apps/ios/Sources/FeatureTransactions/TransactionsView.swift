import RegeneraDesign
import CoreDesign
import CoreNetworking
import SwiftUI

public struct TransactionsView: View {
    @ObservedObject private var viewModel: TransactionsViewModel

    public init(viewModel: TransactionsViewModel) {
        self.viewModel = viewModel
    }

    public var body: some View {
        ZStack {
            RegeneraScreenBackground()
            List(viewModel.items) { item in
                VStack(alignment: .leading) {
                    Text(item.title).foregroundStyle(Color.Regenera.textPrimary)
                    Text(item.party).foregroundStyle(Color.Regenera.textSecondary)
                }
                .listRowBackground(Color.Regenera.backgroundSurface)
            }
            .scrollContentBackground(.hidden)
        }
    }
}
import RegeneraDesign
import CoreDesign
import CoreNetworking
import SwiftUI

public struct HomeView: View {
    @ObservedObject private var viewModel: HomeViewModel

    public init(viewModel: HomeViewModel) {
        self.viewModel = viewModel
    }

    public var body: some View {
        ZStack {
            RegeneraScreenBackground()
            VStack(alignment: .leading, spacing: 16) {
                Text("Home")
                    .font(.title.bold())
                    .foregroundStyle(Color.Regenera.textPrimary)
                if viewModel.isLoading {
                    ProgressView()
                } else if let dashboard = viewModel.dashboard {
                    RegeneraCard {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Saldo disponível")
                                .foregroundStyle(Color.Regenera.textSecondary)
                            Text("R$ \(formatCents(dashboard.availableCents))")
                                .font(.title2.bold())
                                .foregroundStyle(Color.Regenera.primary)
                            Text("Conta \(dashboard.maskedAccount)")
                                .foregroundStyle(Color.Regenera.textSecondary)
                        }
                    }
                } else if let error = viewModel.errorMessage {
                    Text(error).foregroundStyle(Color.Regenera.danger)
                }
            }
            .padding()
        }
    }

    private func formatCents(_ cents: String) -> String {
        guard let value = Int(cents) else { return "0,00" }
        let reais = value / 100
        let remainder = abs(value % 100)
        return "\(reais),\(String(format: "%02d", remainder))"
    }
}
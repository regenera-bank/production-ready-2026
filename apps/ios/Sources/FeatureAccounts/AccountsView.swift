import RegeneraDesign
import CoreDesign
import CoreNetworking
import SwiftUI

public struct AccountsView: View {
    private let dashboard: DashboardResponse?

    public init(dashboard: DashboardResponse?) {
        self.dashboard = dashboard
    }

    public var body: some View {
        ZStack {
            RegeneraScreenBackground()
            VStack(alignment: .leading, spacing: 12) {
                Text("Contas")
                    .font(.title.bold())
                    .foregroundStyle(Color.Regenera.textPrimary)
                if let dashboard {
                    RegeneraCard {
                        VStack(alignment: .leading) {
                            Text(AccountsService.accountLabel(from: dashboard))
                            Text("Documento \(AccountsService.maskedDocument(dashboard.document))")
                                .foregroundStyle(Color.Regenera.textSecondary)
                        }
                    }
                } else {
                    Text("Sem conta carregada")
                        .foregroundStyle(Color.Regenera.textSecondary)
                }
            }
            .padding()
        }
    }
}
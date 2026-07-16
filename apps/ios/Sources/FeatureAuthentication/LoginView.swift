import RegeneraDesign
import CoreDesign
import SwiftUI

public struct LoginView: View {
    @ObservedObject private var viewModel: AuthenticationViewModel
    @State private var document = ""
    @State private var password = ""

    public init(viewModel: AuthenticationViewModel) {
        self.viewModel = viewModel
    }

    public var body: some View {
        ZStack {
            RegeneraScreenBackground()
            VStack(spacing: 16) {
                Text("Regenera Bank")
                    .font(.largeTitle.bold())
                    .foregroundStyle(Color.Regenera.textPrimary)
                RegeneraCard {
                    VStack(spacing: 12) {
                        TextField("CPF", text: $document)
                            .textContentType(.username)
                        SecureField("Senha", text: $password)
                        if let error = viewModel.errorMessage {
                            Text(error).foregroundStyle(Color.Regenera.danger)
                        }
                        RegeneraPrimaryButton("Entrar") {
                            Task { await viewModel.signIn(document: document, password: password) }
                        }
                    }
                }
            }
            .padding()
        }
    }
}
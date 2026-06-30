import RegeneraDesign
import CoreDesign
import SwiftUI

public struct PixView: View {
    @ObservedObject private var viewModel: PixViewModel

    public init(viewModel: PixViewModel) {
        self.viewModel = viewModel
    }

    public var body: some View {
        ZStack {
            RegeneraScreenBackground()
            VStack(alignment: .leading, spacing: 12) {
                Text("Pix")
                    .font(.title.bold())
                    .foregroundStyle(Color.Regenera.textPrimary)
                ForEach(viewModel.keys) { key in
                    RegeneraCard {
                        Text(key.key)
                    }
                }
            }
            .padding()
        }
    }
}
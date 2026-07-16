import RegeneraDesign
import CoreDesign
import SwiftUI

public struct ProfileView: View {
    private let profile: ProfileSnapshot?

    public init(profile: ProfileSnapshot?) {
        self.profile = profile
    }

    public var body: some View {
        ZStack {
            RegeneraScreenBackground()
            VStack(alignment: .leading, spacing: 12) {
                Text("Perfil")
                    .font(.title.bold())
                    .foregroundStyle(Color.Regenera.textPrimary)
                if let profile {
                    RegeneraCard {
                        Text(profile.displayName)
                        Text("ID \(profile.userId)")
                            .foregroundStyle(Color.Regenera.textSecondary)
                    }
                }
            }
            .padding()
        }
    }
}
import RegeneraDesign
import SwiftUI

public struct RegeneraScreenBackground: View {
    public init() {}

    public var body: some View {
        LinearGradient(
            colors: [Color.Regenera.gradientStart, Color.Regenera.backgroundDeep],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
        .ignoresSafeArea()
    }
}

public struct RegeneraPrimaryButton: View {
    private let title: String
    private let action: () -> Void

    public init(_ title: String, action: @escaping () -> Void) {
        self.title = title
        self.action = action
    }

    public var body: some View {
        Button(action: action) {
            Text(title)
                .fontWeight(.semibold)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .foregroundStyle(Color.Regenera.backgroundDeep)
                .background(Color.Regenera.primary)
                .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }
}

public struct RegeneraCard<Content: View>: View {
    private let content: Content

    public init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    public var body: some View {
        content
            .padding()
            .background(Color.Regenera.backgroundSurface.opacity(0.85))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color.Regenera.border, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}
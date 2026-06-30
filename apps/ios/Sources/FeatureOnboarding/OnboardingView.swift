import RegeneraDesign
import CoreDesign
import SwiftUI

public struct OnboardingView: View {
    private let steps: [OnboardingStep]

    public init(steps: [OnboardingStep] = OnboardingService.defaultSteps()) {
        self.steps = steps
    }

    public var body: some View {
        ZStack {
            RegeneraScreenBackground()
            VStack(alignment: .leading, spacing: 12) {
                Text("Onboarding")
                    .font(.title.bold())
                    .foregroundStyle(Color.Regenera.textPrimary)
                ForEach(steps, id: \.id) { step in
                    RegeneraCard {
                        HStack {
                            Text(step.title)
                            Spacer()
                            Image(systemName: step.completed ? "checkmark.circle.fill" : "circle")
                                .foregroundStyle(step.completed ? Color.Regenera.success : Color.Regenera.textSecondary)
                        }
                    }
                }
            }
            .padding()
        }
    }
}
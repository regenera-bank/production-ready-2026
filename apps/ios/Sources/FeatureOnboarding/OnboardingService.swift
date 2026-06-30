import CoreNetworking
import CoreObservability
import Foundation

public struct OnboardingStep: Equatable, Sendable {
    public let id: String
    public let title: String
    public let completed: Bool
}

public enum OnboardingService {
    public static func defaultSteps() -> [OnboardingStep] {
        [
            OnboardingStep(id: "cadastral", title: "Dados cadastrais", completed: false),
            OnboardingStep(id: "document", title: "Documento", completed: false),
            OnboardingStep(id: "selfie", title: "Selfie", completed: false),
            OnboardingStep(id: "done", title: "Conta ativa", completed: false),
        ]
    }

    public static func checkBffReady(client: MobileBFFClientProtocol) async -> Bool {
        do {
            let health = try await client.checkHealth(correlation: CorrelationContext())
            return health.status == "UP"
        } catch {
            return false
        }
    }
}
import CoreNetworking
import CoreStorage
import FeatureAuthentication
import FeatureHome
import FeatureOnboarding
import FeatureProfile
import SwiftUI

@main
struct RegeneraBankApp: App {
    private let dependencies: AppDependencies

    init() {
        dependencies = AppDependencies()
    }

    var body: some Scene {
        WindowGroup {
            RootView(dependencies: dependencies)
        }
    }
}

struct AppDependencies {
    let sessionStore: InMemorySessionStore
    let bffClient: MobileBFFClientProtocol
    let authViewModel: AuthenticationViewModel
    let homeViewModel: HomeViewModel

    init() {
        let store = InMemorySessionStore()
        let baseURL = URL(string: ProcessInfo.processInfo.environment["MOBILE_BFF_URL"] ?? "http://127.0.0.1:8082")!
        let client = URLSessionMobileBFFClient(baseURL: baseURL)
        sessionStore = store
        bffClient = client
        authViewModel = AuthenticationViewModel(client: client, sessionStore: store)
        homeViewModel = HomeViewModel(client: client)
    }
}

struct RootView: View {
    let dependencies: AppDependencies

    var body: some View {
        if dependencies.authViewModel.displayName == nil {
            LoginView(viewModel: dependencies.authViewModel)
        } else {
            TabView {
                HomeView(viewModel: dependencies.homeViewModel)
                    .tabItem { Label("Home", systemImage: "house") }
                OnboardingView()
                    .tabItem { Label("Onboarding", systemImage: "person.crop.circle.badge.plus") }
                ProfileView(profile: ProfileService.fromSession(dependencies.sessionStore.load()))
                    .tabItem { Label("Perfil", systemImage: "person") }
            }
            .task {
                if let token = dependencies.sessionStore.load()?.accessToken {
                    await dependencies.homeViewModel.load(token: token)
                }
            }
        }
    }
}
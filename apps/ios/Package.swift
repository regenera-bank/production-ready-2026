// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "RegeneraBank",
    defaultLocalization: "pt-BR",
    platforms: [
        .iOS(.v17),
        .macOS(.v14),
    ],
    products: [
        .library(name: "CoreDesign", targets: ["CoreDesign"]),
        .library(name: "CoreNetworking", targets: ["CoreNetworking"]),
        .library(name: "CoreSecurity", targets: ["CoreSecurity"]),
        .library(name: "CoreStorage", targets: ["CoreStorage"]),
        .library(name: "CoreObservability", targets: ["CoreObservability"]),
        .library(name: "FeatureAuthentication", targets: ["FeatureAuthentication"]),
        .library(name: "FeatureOnboarding", targets: ["FeatureOnboarding"]),
        .library(name: "FeatureHome", targets: ["FeatureHome"]),
        .library(name: "FeatureAccounts", targets: ["FeatureAccounts"]),
        .library(name: "FeatureTransactions", targets: ["FeatureTransactions"]),
        .library(name: "FeaturePix", targets: ["FeaturePix"]),
        .library(name: "FeatureTransfers", targets: ["FeatureTransfers"]),
        .library(name: "FeatureCards", targets: ["FeatureCards"]),
        .library(name: "FeatureCredit", targets: ["FeatureCredit"]),
        .library(name: "FeatureInvestments", targets: ["FeatureInvestments"]),
        .library(name: "FeatureProfile", targets: ["FeatureProfile"]),
        .library(name: "FeatureSupport", targets: ["FeatureSupport"]),
        .executable(name: "RegeneraBankApp", targets: ["RegeneraBankApp"]),
    ],
    targets: [
        .target(
            name: "RegeneraDesign",
            dependencies: []
        ),
        .target(
            name: "CoreObservability",
            dependencies: []
        ),
        .target(
            name: "CoreStorage",
            dependencies: []
        ),
        .target(
            name: "CoreSecurity",
            dependencies: ["CoreStorage"]
        ),
        .target(
            name: "MobileBFFTestSupport",
            dependencies: ["CoreNetworking"]
        ),
        .target(
            name: "CoreNetworking",
            dependencies: ["CoreObservability"]
        ),
        .target(
            name: "CoreDesign",
            dependencies: ["RegeneraDesign"]
        ),
        .target(
            name: "FeatureAuthentication",
            dependencies: ["CoreDesign", "CoreNetworking", "CoreSecurity", "RegeneraDesign"]
        ),
        .target(
            name: "FeatureOnboarding",
            dependencies: ["CoreDesign", "CoreNetworking", "CoreSecurity", "RegeneraDesign"]
        ),
        .target(
            name: "FeatureHome",
            dependencies: ["CoreDesign", "CoreNetworking", "RegeneraDesign"]
        ),
        .target(
            name: "FeatureAccounts",
            dependencies: ["CoreDesign", "CoreNetworking", "RegeneraDesign"]
        ),
        .target(
            name: "FeatureTransactions",
            dependencies: ["CoreDesign", "CoreNetworking", "RegeneraDesign"]
        ),
        .target(
            name: "FeaturePix",
            dependencies: ["CoreDesign", "CoreNetworking", "RegeneraDesign"]
        ),
        .target(
            name: "FeatureTransfers",
            dependencies: ["CoreDesign", "CoreNetworking", "RegeneraDesign"]
        ),
        .target(
            name: "FeatureCards",
            dependencies: ["CoreDesign", "CoreNetworking", "RegeneraDesign"]
        ),
        .target(
            name: "FeatureCredit",
            dependencies: ["CoreDesign", "CoreNetworking", "RegeneraDesign"]
        ),
        .target(
            name: "FeatureInvestments",
            dependencies: ["CoreDesign", "CoreNetworking", "RegeneraDesign"]
        ),
        .target(
            name: "FeatureProfile",
            dependencies: ["CoreDesign", "CoreNetworking", "RegeneraDesign"]
        ),
        .target(
            name: "FeatureSupport",
            dependencies: ["CoreDesign", "CoreNetworking", "RegeneraDesign"]
        ),
        .executableTarget(
            name: "RegeneraBankApp",
            dependencies: [
                "CoreDesign",
                "CoreNetworking",
                "CoreSecurity",
                "CoreStorage",
                "CoreObservability",
                "FeatureAuthentication",
                "FeatureOnboarding",
                "FeatureHome",
                "FeatureAccounts",
                "FeatureTransactions",
                "FeaturePix",
                "FeatureTransfers",
                "FeatureCards",
                "FeatureCredit",
                "FeatureInvestments",
                "FeatureProfile",
                "FeatureSupport",
            ]
        ),
        .testTarget(name: "CoreObservabilityTests", dependencies: ["CoreObservability"]),
        .testTarget(name: "CoreStorageTests", dependencies: ["CoreStorage"]),
        .testTarget(name: "CoreSecurityTests", dependencies: ["CoreSecurity"]),
        .testTarget(name: "CoreNetworkingTests", dependencies: ["CoreNetworking", "MobileBFFTestSupport"]),
        .testTarget(name: "CoreDesignTests", dependencies: ["CoreDesign"]),
        .testTarget(name: "FeatureAuthenticationTests", dependencies: ["FeatureAuthentication", "MobileBFFTestSupport"]),
        .testTarget(name: "FeatureOnboardingTests", dependencies: ["FeatureOnboarding", "MobileBFFTestSupport"]),
        .testTarget(name: "FeatureHomeTests", dependencies: ["FeatureHome", "MobileBFFTestSupport"]),
        .testTarget(name: "FeatureAccountsTests", dependencies: ["FeatureAccounts"]),
        .testTarget(name: "FeatureTransactionsTests", dependencies: ["FeatureTransactions", "MobileBFFTestSupport"]),
        .testTarget(name: "FeaturePixTests", dependencies: ["FeaturePix", "MobileBFFTestSupport"]),
        .testTarget(name: "FeatureTransfersTests", dependencies: ["FeatureTransfers", "MobileBFFTestSupport"]),
        .testTarget(name: "FeatureCardsTests", dependencies: ["FeatureCards"]),
        .testTarget(name: "FeatureCreditTests", dependencies: ["FeatureCredit"]),
        .testTarget(name: "FeatureInvestmentsTests", dependencies: ["FeatureInvestments"]),
        .testTarget(name: "FeatureProfileTests", dependencies: ["FeatureProfile"]),
        .testTarget(name: "FeatureSupportTests", dependencies: ["FeatureSupport"]),
    ]
)
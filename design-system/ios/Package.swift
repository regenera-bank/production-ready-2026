// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "RegeneraDesign",
    platforms: [
        .iOS(.v17),
        .macOS(.v14),
    ],
    products: [
        .library(name: "RegeneraDesign", targets: ["RegeneraDesign"]),
    ],
    targets: [
        .target(name: "RegeneraDesign"),
        .testTarget(
            name: "RegeneraDesignTests",
            dependencies: ["RegeneraDesign"]
        ),
    ]
)
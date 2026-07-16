pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "RegeneraBank"

include(":app")
include(":core-design")
include(":core-network")
include(":core-security")
include(":core-storage")
include(":core-observability")
include(":feature-auth")
include(":feature-onboarding")
include(":feature-home")
include(":feature-accounts")
include(":feature-transactions")
include(":feature-pix")
include(":feature-transfers")
include(":feature-cards")
include(":feature-credit")
include(":feature-investments")
include(":feature-profile")
include(":feature-support")
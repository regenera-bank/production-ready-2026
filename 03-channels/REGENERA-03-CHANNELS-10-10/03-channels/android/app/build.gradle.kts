plugins { id("com.android.application"); id("org.jetbrains.kotlin.android"); id("org.jetbrains.kotlin.plugin.serialization"); id("org.jetbrains.kotlin.plugin.compose") }
android { namespace="bank.regenera.mobile"; compileSdk=35
  defaultConfig { applicationId="bank.regenera.mobile"; minSdk=28; targetSdk=35; versionCode=1; versionName="1.0.0"
    buildConfigField("String","API_BASE_URL","\"${project.findProperty("API_BASE_URL") ?: ""}\"")
    buildConfigField("String","OIDC_AUTHORIZATION_ENDPOINT","\"${project.findProperty("OIDC_AUTHORIZATION_ENDPOINT") ?: ""}\"")
    buildConfigField("String","OIDC_TOKEN_ENDPOINT","\"${project.findProperty("OIDC_TOKEN_ENDPOINT") ?: ""}\"")
    buildConfigField("String","OIDC_CLIENT_ID","\"${project.findProperty("OIDC_CLIENT_ID") ?: ""}\"")
    buildConfigField("String","OIDC_REDIRECT_URI","\"${project.findProperty("OIDC_REDIRECT_URI") ?: "bank.regenera.mobile:/oauth/callback"}\"")
    buildConfigField("long","PLAY_INTEGRITY_CLOUD_PROJECT_NUMBER","${project.findProperty("PLAY_INTEGRITY_CLOUD_PROJECT_NUMBER") ?: "0"}L") }
  buildFeatures { compose=true; buildConfig=true }
  buildTypes { release { isMinifyEnabled=true; isShrinkResources=true; proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"),"proguard-rules.pro") } }
  packaging { resources.excludes += "/META-INF/{AL2.0,LGPL2.1}" }
}
dependencies {
  implementation(project(":core-design")); implementation(project(":core-network")); implementation(project(":core-security")); implementation(project(":core-observability"))
  implementation("androidx.activity:activity-compose:1.10.1"); implementation("androidx.compose.material3:material3:1.3.1"); implementation("androidx.navigation:navigation-compose:2.8.8")
  implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.7"); implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.10.1"); implementation("net.openid:appauth:0.11.1")
}
tasks.register("verifyReleaseConfiguration") { doLast { require((project.findProperty("API_BASE_URL") as String?)?.startsWith("https://") == true) { "API_BASE_URL de release ausente ou insegura" }; require((project.findProperty("OIDC_AUTHORIZATION_ENDPOINT") as String?)?.startsWith("https://") == true) { "OIDC authorization endpoint ausente" }; require((project.findProperty("OIDC_TOKEN_ENDPOINT") as String?)?.startsWith("https://") == true) { "OIDC token endpoint ausente" }; require((project.findProperty("OIDC_CLIENT_ID") as String?)?.isNotBlank() == true) { "OIDC client ausente" }; require((project.findProperty("PLAY_INTEGRITY_CLOUD_PROJECT_NUMBER") as String?)?.toLongOrNull()?.let{it>0} == true) { "Play Integrity não configurado" } } }
tasks.matching { it.name == "preReleaseBuild" }.configureEach { dependsOn("verifyReleaseConfiguration") }

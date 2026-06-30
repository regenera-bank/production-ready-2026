# Regenera Bank — keep Retrofit interfaces and Moshi models
-keepclassmembers class * {
    @retrofit2.http.* <methods>;
}
-keep class com.regenera.bank.** { *; }
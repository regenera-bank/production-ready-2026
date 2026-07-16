#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

log() { printf '[regenera-android] %s\n' "$*"; }

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    return 1
  fi
}

resolve_java_home() {
  if [[ -n "${JAVA_HOME:-}" && -x "${JAVA_HOME}/bin/java" ]]; then
    echo "$JAVA_HOME"
    return 0
  fi
  local portable_jdk="$ROOT_DIR/../../.tools/jdk-17/Contents/Home"
  if [[ -x "$portable_jdk/bin/java" ]]; then
    echo "$portable_jdk"
    return 0
  fi
  if [[ -x "/Applications/Android Studio.app/Contents/jbr/Contents/Home/bin/java" ]]; then
    echo "/Applications/Android Studio.app/Contents/jbr/Contents/Home"
    return 0
  fi
  if [[ -x "/opt/homebrew/opt/openjdk@17/bin/java" ]]; then
    echo "/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
    return 0
  fi
  if require_cmd /usr/libexec/java_home; then
    /usr/libexec/java_home 2>/dev/null || true
    return 0
  fi
  return 1
}

JAVA_HOME_RESOLVED="$(resolve_java_home || true)"
if [[ -n "$JAVA_HOME_RESOLVED" ]]; then
  export JAVA_HOME="$JAVA_HOME_RESOLVED"
  export PATH="$JAVA_HOME/bin:$PATH"
fi

if ! require_cmd java || ! java -version >/dev/null 2>&1; then
  log "EXTERNAL_EXECUTION_REQUIRED: JDK 17+ not found."
  log "Install Android Studio or Temurin JDK 17, then re-run: bash scripts/build-debug.sh"
  exit 2
fi

ANDROID_SDK="${ANDROID_HOME:-/opt/homebrew/share/android-commandlinetools}"
if [[ ! -f "$ROOT_DIR/local.properties" && -d "$ANDROID_SDK" ]]; then
  printf 'sdk.dir=%s\n' "$ANDROID_SDK" >"$ROOT_DIR/local.properties"
  log "Wrote local.properties from ANDROID_HOME=$ANDROID_SDK"
fi

GRADLE_CMD=()
if [[ -x "$ROOT_DIR/gradlew" ]]; then
  GRADLE_CMD=("$ROOT_DIR/gradlew")
elif require_cmd gradle; then
  GRADLE_CMD=(gradle)
else
  log "EXTERNAL_EXECUTION_REQUIRED: Gradle wrapper missing and gradle CLI not installed."
  log "From Android Studio: open apps/android and let it sync, or run: gradle wrapper"
  exit 2
fi

log "Java: $(java -version 2>&1 | head -n 1)"
log "Building debug APK..."
"${GRADLE_CMD[@]}" --no-daemon assembleDebug test
log "Build OK — APK: app/build/outputs/apk/debug/app-debug.apk"
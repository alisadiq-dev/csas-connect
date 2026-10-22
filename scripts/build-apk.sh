#!/usr/bin/env bash
# Build the CSAS Connect debug APK:  android/app/build/outputs/apk/debug/app-debug.apk
#
#   CAP_SERVER_URL=https://your-deployed-site npm run android:apk     # APK anyone can install & use
#   npm run android:apk                                                # test build → this Mac's LAN dev server
#
# The app is a native shell that loads the live portal from CAP_SERVER_URL (see capacitor.config.ts).
set -euo pipefail
cd "$(dirname "$0")/.."

# Toolchain locations (override by exporting JAVA_HOME / ANDROID_HOME yourself).
: "${JAVA_HOME:=$(ls -d "$HOME"/.local/jdk-21*/Contents/Home 2>/dev/null | head -1)}"
: "${ANDROID_HOME:=$HOME/Library/Android/sdk}"
export JAVA_HOME ANDROID_HOME
if [ ! -x "$JAVA_HOME/bin/java" ]; then echo "JDK 17+ not found. Install one and set JAVA_HOME." >&2; exit 1; fi
if [ ! -d "$ANDROID_HOME/platforms" ]; then echo "Android SDK not found at $ANDROID_HOME. Set ANDROID_HOME." >&2; exit 1; fi
export PATH="$JAVA_HOME/bin:$PATH"
echo "sdk.dir=$ANDROID_HOME" > android/local.properties

if [ -z "${CAP_SERVER_URL:-}" ]; then
  ip="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)"
  if [ -z "$ip" ]; then echo "Set CAP_SERVER_URL (e.g. https://your-site) — couldn't detect a LAN IP." >&2; exit 1; fi
  export CAP_SERVER_URL="http://$ip:3000"
  echo "⚠ CAP_SERVER_URL not set: this APK will only work on the same Wi-Fi while 'npm run dev' is running on this Mac."
fi
echo "→ App will load: $CAP_SERVER_URL"

CLEARTEXT=false
case "$CAP_SERVER_URL" in http://*) CLEARTEXT=true ;; esac

npx cap sync android
( cd android && ./gradlew assembleDebug -Pcleartext="$CLEARTEXT" )

APK="android/app/build/outputs/apk/debug/app-debug.apk"
echo
echo "✔ Built $APK ($(du -h "$APK" | cut -f1))"
"$ANDROID_HOME"/cmdline-tools/latest/bin/apkanalyzer manifest application-id "$APK" 2>/dev/null | sed 's/^/  application id: /' || true

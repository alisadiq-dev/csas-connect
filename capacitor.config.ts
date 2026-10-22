import type { CapacitorConfig } from "@capacitor/cli";

/**
 * CSAS Connect Android app.
 *
 * The portal is server-rendered (login, server actions, Postgres), so it cannot be exported as a static
 * bundle. The app is therefore a native shell whose WebView loads the live site from `CAP_SERVER_URL`:
 *   - the APK that other people install must point at a PUBLIC HTTPS deployment, and
 *   - for a quick test on your own phone it can point at the dev server on your LAN (http://<ip>:3000).
 * Set it when syncing/building, e.g.  CAP_SERVER_URL=https://csas-connect.example.com npm run android:apk
 * `capacitor-shell/` (webDir) only contains the local loading and "can't reach the server" pages.
 */
const serverUrl = process.env.CAP_SERVER_URL ?? "http://10.0.2.2:3000"; // 10.0.2.2 = host machine from the Android emulator
const cleartext = serverUrl.startsWith("http://");
const host = new URL(serverUrl).host;

const config: CapacitorConfig = {
  appId: "com.csas.connect",
  appName: "CSAS Connect",
  webDir: "capacitor-shell",
  backgroundColor: "#070a13",
  server: {
    url: serverUrl,
    cleartext, // plain-http (LAN/dev) only; an https URL needs nothing here
    allowNavigation: [host],
    errorPath: "offline.html",
  },
  android: {
    // Debug builds can be inspected from chrome://inspect; release builds stay locked down.
    webContentsDebuggingEnabled: cleartext,
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: "#070a13",
      androidScaleType: "CENTER_INSIDE",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK", // light icons on the dark header
      backgroundColor: "#070a13",
      overlaysWebView: false,
    },
  },
};

export default config;

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CapacitorBridge } from "@/components/native/CapacitorBridge";
import { LenisProvider } from "@/components/providers/LenisProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CSAS Connect",
  description: "Departmental portal for the University of the Punjab's Department of Statistics.",
  applicationName: "CSAS Connect",
  // Installed to a phone's home screen, it launches full-screen like a native app.
  appleWebApp: { capable: true, title: "CSAS Connect", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  other: { "mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Draw under the notch / home indicator; layouts add env(safe-area-inset-*) padding where it matters.
  viewportFit: "cover",
  themeColor: "#080b14",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LenisProvider>{children}</LenisProvider>
        <CapacitorBridge />
      </body>
    </html>
  );
}

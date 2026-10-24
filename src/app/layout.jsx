import "./globals.css";
import { Suspense } from "react";
import { ThemeBootstrap } from "@/components/layout/ProfileMenu";
import ServiceWorkerRegister from "@/components/layout/ServiceWorkerRegister";
import RouteAccessibility from "@/components/layout/RouteAccessibility";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { AppModeProvider } from "@/lib/AppModeProvider";

export const metadata = {
  title: "Smart Safar | Faisalabad Transit",
  description: "Plan your journey with route, stop, and transit information for Faisalabad.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icons/smart-safar-192.png", sizes: "192x192", type: "image/png" }, { url: "/icons/smart-safar-512.png", sizes: "512x512", type: "image/png" }, { url: "/logo.svg", type: "image/svg+xml" }],
    shortcut: "/icons/smart-safar-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Smart Safar" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f5fb" },
    { media: "(prefers-color-scheme: dark)", color: "#111d3d" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" style={{ backgroundColor: "#f4f5fb" }}>
    <head>
        <script src="/prepaint.js" />
        <link rel="preconnect" href="https://tile.openstreetmap.org" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://tile.openstreetmap.org" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-750x1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-828x1792.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1170x2532.png" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1179x2556.png" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1284x2778.png" media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1290x2796.png" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1206x2622.png" media="(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1320x2868.png" media="(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1668x2388.png" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-2048x2732.png" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1125x2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1242x2208.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1242x2688.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)" />
      </head>
      <body>
        <AppModeProvider>
          <AuthProvider>
            <ServiceWorkerRegister />
            <Suspense fallback={null}><RouteAccessibility /></Suspense>
            <ThemeBootstrap />
            {children}
          </AuthProvider>
        </AppModeProvider>
      </body>
    </html>
  );
}

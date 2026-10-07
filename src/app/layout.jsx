import "./globals.css";
import "leaflet/dist/leaflet.css";
import BootSplash from "@/components/layout/BootSplash";
import { ThemeBootstrap } from "@/components/layout/ProfileMenu";

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
  themeColor: "#111d3d",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-750x1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-828x1792.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1170x2532.png" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1179x2556.png" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1284x2778.png" media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1290x2796.png" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" />
      </head>
      <body>
        <BootSplash />
        <ThemeBootstrap />
        {children}
      </body>
    </html>
  );
}

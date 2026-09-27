import "./globals.css";
import "leaflet/dist/leaflet.css";
import { ThemeBootstrap } from "@/components/layout/ProfileMenu";

export const metadata = {
  title: "Smart Safar | Faisalabad Transit",
  description: "Plan your journey with route, stop, and transit information for Faisalabad.",
  icons: { icon: "/logo.svg", shortcut: "/logo.svg", apple: "/logo.svg" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeBootstrap />
        {children}
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalytics } from "@next/third-parties/google";
import "@/styles/globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0a1628",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Last Island — One Piece Naval Battle",
    template: "%s | Last Island",
  },
  description:
    "Challenge other pirates in real-time naval battles on the Grand Line. Place your fleet, fire cannonballs, and climb the bounty leaderboard in this One Piece–themed multiplayer Battleship game.",
  keywords: [
    "battleship",
    "naval battle",
    "multiplayer",
    "One Piece",
    "online game",
    "strategy",
    "pirate game",
    "Last Island",
  ],
  authors: [{ name: "Last Island" }],
  creator: "Last Island",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://last-island.vercel.app"
  ),
  openGraph: {
    type: "website",
    siteName: "Last Island",
    title: "Last Island — One Piece Naval Battle",
    description:
      "Real-time multiplayer Battleship with One Piece theming. Place your fleet, fire cannonballs, and climb the bounty leaderboard.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Last Island" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Last Island — One Piece Naval Battle",
    description:
      "Real-time multiplayer Battleship with One Piece theming. Challenge pirates on the Grand Line.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <Analytics />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
}

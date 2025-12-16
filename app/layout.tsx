import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Providers } from "@/components/providers";
import { getAuthSession } from "@/lib/auth";

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
  title: "Movie Vault",
  description: "Find films, track your watchlist, and chat with an AI movie concierge.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-noise min-h-screen antialiased`}>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import { env } from "@/lib/env";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: {
    default: "Maven Clinic",
    template: "%s | Maven Clinic",
  },
  description: "Virtual women’s health, fertility, and care coordination platform.",
  applicationName: "Maven Clinic",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${playfair.variable} min-h-screen bg-[var(--slate-50)] text-[var(--foreground)] antialiased`}>
        {children}
      </body>
    </html>
  );
}
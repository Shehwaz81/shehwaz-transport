import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Shehwaz Transport Inc. | Precision Logistics for North America",
  description:
    "Premier logistics partner delivering excellence across miles. Reliable, scalable, and professional trucking solutions.",
  keywords: [
    "Shehwaz Transport",
    "Trucking Company",
    "Logistics",
    "Freight Shipping",
    "North America Transport",
    "FTL",
    "LTL",
    "Expedited Shipping",
    "Emergency Freight",
    "Cross-border Shipping",
    "Canada Trucking",
    "USA Trucking",
    "Reliable Logistics",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

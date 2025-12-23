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
  title: "Shehwaz Transport Inc. | Windsor Trucking & Cross-Border Logistics",
  description:
    "Trusted trucking company in Windsor, Ontario. Shehwaz Transport Inc. offers reliable FTL, LTL, and expedited freight services across Canada and the USA.",
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
    "Windsor Trucking",
    "Detroit Border Crossing",
    "Ontario Freight",
    "Michigan Logistics",
    "Windsor Cross-border",
    "Local Trucking Windsor",
    "Transport Windsor",
  ],
  authors: [{ name: "Shehwaz Transport Inc." }],
  creator: "Shehwaz Transport Inc.",
  publisher: "Shehwaz Transport Inc.",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://shehwaztransport.ca"),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Shehwaz Transport Inc. | Windsor Trucking & Cross-Border Logistics",
    description:
      "Trusted trucking company in Windsor, Ontario. Shehwaz Transport Inc. offers reliable FTL, LTL, and expedited freight services across Canada and the USA.",
    url: "https://shehwaztransport.ca",
    siteName: "Shehwaz Transport Inc.",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Shehwaz Transport Inc. Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shehwaz Transport Inc. | Windsor Trucking & Cross-Border Logistics",
    description: "Trusted trucking company in Windsor, Ontario. Shehwaz Transport Inc. offers reliable FTL, LTL, and expedited freight services across Canada and the USA.",
    images: ["/opengraph-image.png"],
  },
  category: "logistics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TruckingBusiness",
    "name": "Shehwaz Transport Inc.",
    "image": "https://shehwaztransport.ca/images/logo-full.png",
    "@id": "https://shehwaztransport.ca",
    "url": "https://shehwaztransport.ca",
    "telephone": "+1 (416) 908-8377",
    "email": "dispatch@shehwaztransport.ca",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Windsor",
      "addressLocality": "Windsor",
      "addressRegion": "ON",
      "postalCode": "N8W",
      "addressCountry": "CA"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 42.3149,
      "longitude": -83.0364
    },
    "areaServed": [
      "Windsor",
      "Detroit",
      "Ontario",
      "Michigan",
      "North America",
      "Canada",
      "USA"
    ],
    "priceRange": "$$",
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      "opens": "00:00",
      "closes": "23:59"
    },
    "description": "Shehwaz Transport Inc. is a premier trucking and logistics company based in Windsor, Ontario, specializing in cross-border freight, FTL, LTL, and expedited shipping."
  };

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}

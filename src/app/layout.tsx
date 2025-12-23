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
    "Premier trucking company in Windsor, Ontario. Shehwaz Transport Inc. provides reliable FTL, LTL, and expedited freight services to Detroit, Michigan, Toronto, and across North America.",
  keywords: [
    "Shehwaz Transport",
    "Trucking Company Windsor",
    "Logistics Windsor",
    "Cross-border Shipping Detroit",
    "Freight Shipping Ontario",
    "FTL Carrier Canada",
    "LTL Shipping USA",
    "Expedited Freight Michigan",
    "Emergency Shipping Toronto",
    "Windsor to Detroit Trucking",
    "Canada USA Logistics",
    "Reliable Trucking Company",
    "Local Trucking Windsor",
    "Transport Windsor",
    "Supply Chain Solutions",
    "Freight Brokerage",
    "3PL Services",
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
    icon: [
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
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
    "logo": "https://shehwaztransport.ca/images/logo-full.png",
    "@id": "https://shehwaztransport.ca",
    "url": "https://shehwaztransport.ca",
    "telephone": "+1 (416) 908-8377",
    "email": "dispatch@shehwaztransport.ca",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "2024 Cosenza St",
      "addressLocality": "Windsor",
      "addressRegion": "ON",
      "postalCode": "N9G 0B2",
      "addressCountry": "CA"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 42.3149,
      "longitude": -83.0364
    },
    "areaServed": [
      {
        "@type": "City",
        "name": "Windsor",
        "address": {
            "@type": "PostalAddress",
            "addressRegion": "ON",
            "addressCountry": "CA"
        }
      },
      {
        "@type": "City",
        "name": "Detroit",
        "address": {
            "@type": "PostalAddress",
            "addressRegion": "MI",
            "addressCountry": "US"
        }
      },
      {
        "@type": "City",
        "name": "Toronto",
        "address": {
            "@type": "PostalAddress",
            "addressRegion": "ON",
            "addressCountry": "CA"
        }
      },
      {
        "@type": "State",
        "name": "Ontario",
        "address": {
            "@type": "PostalAddress",
            "addressCountry": "CA"
        }
      },
      {
        "@type": "State",
        "name": "Michigan",
        "address": {
            "@type": "PostalAddress",
            "addressCountry": "US"
        }
      },
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

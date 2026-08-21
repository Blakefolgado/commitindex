import type { Metadata } from "next";
import { Geist, Newsreader } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { VercelAnalytics } from "@/components/vercel-analytics";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://commitindex.com"),
  title: "Commit Index — Public company GitHub activity",
  description:
    "Explore public GitHub activity across the world’s most interesting technology companies.",
  openGraph: {
    title: "Commit Index",
    description: "See how the world’s technology companies build in public.",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://commitindex.com/#website",
      url: "https://commitindex.com",
      name: "Commit Index",
      description:
        "Public GitHub commit activity for the world's most interesting technology companies.",
      publisher: { "@id": "https://commitindex.com/#organization" },
    },
    {
      "@type": "Organization",
      "@id": "https://commitindex.com/#organization",
      name: "Commit Index",
      url: "https://commitindex.com",
      logo: "https://commitindex.com/icon.svg",
    },
    {
      "@type": "Dataset",
      name: "Commit Index company commit activity",
      description:
        "Daily counts of public, non-merge commits across the eight most recently active public repositories of each indexed technology company, covering a rolling 52-week window.",
      url: "https://commitindex.com",
      creator: { "@id": "https://commitindex.com/#organization" },
      isAccessibleForFree: true,
      measurementTechnique: "GitHub repository commit statistics API",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${geist.variable} ${newsreader.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <SiteHeader />
        {children}
        <SiteFooter />
        <VercelAnalytics />
      </body>
    </html>
  );
}

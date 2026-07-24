import type { Metadata } from "next";
import { Geist, Newsreader } from "next/font/google";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${geist.variable} ${newsreader.variable}`}>
        <SiteHeader />
        {children}
        <VercelAnalytics />
      </body>
    </html>
  );
}

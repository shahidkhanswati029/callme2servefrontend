import type { Metadata, Viewport } from "next";
import { Inter, Noto_Serif_Display } from "next/font/google";
import { AppProviders } from "@/store/Provider";
import "./globals.css";

const notoSerif = Noto_Serif_Display({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  preload: false,
  adjustFontFallback: true,
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://callme2serve.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "CallMe2Serve",
    template: "%s · CallMe2Serve",
  },
  description:
    "Find trusted local experts with live GPS pins. Ask for work, open a shop, pay digitally — cash is out.",
  applicationName: "CallMe2Serve",
  keywords: [
    "experts",
    "local services",
    "shops",
    "GPS",
    "CallMe2Serve",
    "marketplace",
  ],
  authors: [{ name: "CallMe2Serve" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "CallMe2Serve",
    title: "CallMe2Serve · Find trusted experts near you",
    description:
      "Real experts with live place pins. Ask, accept, pay, and get a real receipt.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CallMe2Serve",
    description: "Find trusted experts near you with live GPS pins.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f7f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1c18" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"} />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=JSON.parse(localStorage.getItem('cmts_ui_prefs')||'{}');var t=p.theme==='dark'?'dark':'light';document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t;var l=p.language;if(l==='ur'||l==='pa'||l==='ar'||l==='fa'){document.documentElement.lang=l;document.documentElement.dir='rtl';}else if(l==='ja'||l==='en'){document.documentElement.lang=l;document.documentElement.dir='ltr';}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${notoSerif.variable} ${inter.variable}`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

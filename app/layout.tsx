import type { Metadata } from "next";
import "./globals.css";
import { TonProviders }   from "@/components/TonProviders";
import { ThemeProvider }  from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Surge",
  description: "Surge — Autonomous DeFi yield optimization powered by TON Agentic Wallets",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Surge",
    description: "Surge — Your autonomous DeFi agent on TON",
    images: ["/icon.svg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap"
          rel="stylesheet"
        />
        {/* Sync html.dark class before React hydrates (for globals.css body bg) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <TonProviders>
            {children}
          </TonProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}

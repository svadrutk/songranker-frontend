import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/app/providers";
import { AuthProvider } from "@/components/AuthProvider";
import { FeedbackProvider } from "@/components/FeedbackProvider";
import { Navbar } from "@/components/Navbar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ErrorBanner } from "@/components/ErrorBanner";
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
  title: "Chorusboard",
  description: "Rank your favorite songs with ease.",
  icons: {
    icon: '/logo/logo.svg',
    apple: '/logo/logo.svg',
  },
  openGraph: {
    title: 'Chorusboard',
    description: 'Rank your favorite songs with ease.',
    url: 'https://chorusboard.com',
    siteName: 'Chorusboard',
    images: [
      {
        url: '/logo/logo.svg',
        width: 1200,
        height: 630,
        alt: 'Chorusboard Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chorusboard',
    description: 'Rank your favorite songs with ease.',
    images: ['/logo/logo.svg'],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full w-full">
      <head>
        {process.env.NODE_ENV === "development" && (
          <>
            <Script
              src="//unpkg.com/react-grab/dist/index.global.js"
              crossOrigin="anonymous"
              strategy="beforeInteractive"
            />
            <Script
              src="//unpkg.com/@react-grab/opencode/dist/client.global.js"
              strategy="lazyOnload"
            />
          </>
        )}
        <meta name="theme-color" content="#faf8f5" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full w-full overflow-hidden`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <FeedbackProvider>
              <div className="fixed inset-0 flex flex-col overflow-hidden bg-background">
                <ErrorBanner />
                <Navbar />
                <main className="flex-1 min-h-0 overflow-hidden relative">
                  {children}
                </main>
                {/* Global Theme Toggle in Bottom Right */}
                <div className="fixed bottom-4 right-4 z-[60]">
                  <ThemeToggle />
                </div>
              </div>
            </FeedbackProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

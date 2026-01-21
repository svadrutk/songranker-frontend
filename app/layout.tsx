import type { Metadata, Viewport } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ThemeProvider } from "@/app/providers";
import { AuthProvider } from "@/components/AuthProvider";
import { Navbar } from "@/components/Navbar";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "Song Ranker",
  description: "Rank your favorite songs with ease.",
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
    <html lang="en" suppressHydrationWarning className={`h-full w-full ${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body
        className="antialiased h-full w-full overflow-hidden"
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <div className="fixed inset-0 flex flex-col overflow-hidden bg-background">
              <Navbar />
              <main className="flex-1 min-h-0 overflow-hidden relative">
                {children}
              </main>
              {/* Global Theme Toggle in Bottom Right */}
              <div className="fixed bottom-4 right-4 z-[60]">
                <ThemeToggle />
              </div>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

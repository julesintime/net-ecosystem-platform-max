import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UniversalAppBar } from "@/components/universal-app-bar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { OrganizationProvider } from "@/components/providers/organization-provider"
import { Toaster } from "@/components/ui/sonner"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Net Ecosystem Platform",
  description: "Universal platform with inbox, library, catalog and profile",
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
        <TooltipProvider>
          <OrganizationProvider>
            <div className="flex h-screen">
              <UniversalAppBar />
              <main className="flex-1 md:pl-16 pb-16 md:pb-0 overflow-hidden">
                {children}
              </main>
            </div>
            <Toaster />
          </OrganizationProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}

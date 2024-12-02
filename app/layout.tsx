import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";
import Ripple from "@/components/ui/ripple";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Port Tracker",
  description: "Track your Solana token portfolio",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            {children}

            <Ripple numCircles={8} mainCircleOpacity={0.2}/>

          </Providers>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

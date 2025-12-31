import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";

// import {
//   ClerkProvider,
//   SignInButton,
//   SignUpButton,
//   SignedIn,
//   SignedOut,
//   UserButton,
// } from '@clerk/nextjs'

export const metadata: Metadata = {
  title: "My Next App",
  description: "Practice with separate layouts",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' suppressHydrationWarning> 
      <head>
        <meta name="google-site-verification" content="hkN1ssOr7KiXpqpdBp6lixxkZgo-XqybxNLqUA_Snas" />
      </head>
      <body className="min-h-screen bg-background">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
    );
  }
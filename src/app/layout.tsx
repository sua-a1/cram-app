import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { SupabaseAuthProvider } from "@/providers/supabase-auth-provider";
import { initializeServer } from "@/lib/server/init";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cram Support",
  description: "Streamlined support ticketing system for efficient customer service and team collaboration.",
};

// Initialize server features
initializeServer().catch(console.error);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background antialiased`} suppressHydrationWarning>
        <SupabaseAuthProvider>
          <main className="relative flex min-h-screen flex-col">
            {children}
          </main>
          <Toaster />
        </SupabaseAuthProvider>
      </body>
    </html>
  );
}
